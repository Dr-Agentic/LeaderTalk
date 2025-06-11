import { useEffect, useState } from 'react'
import { useLocation } from 'wouter'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import { handleAuthCallback } from '@/lib/supabaseAuth'

// Global flag to prevent multiple callback executions
declare global {
  interface Window {
    __authCallbackProcessing?: boolean
  }
}

export default function AuthCallback() {
  const [, navigate] = useLocation()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)
  const [processed, setProcessed] = useState(false)

  useEffect(() => {
    // Prevent multiple executions with a global flag
    if (processed || (window as any).__authCallbackProcessing) return
    ;(window as any).__authCallbackProcessing = true

    async function processAuthCallback() {
      setProcessed(true)
      try {
        console.log("Processing Supabase auth callback")
        
        const user = await handleAuthCallback()
        
        if (user) {
          console.log("Auth callback successful, authenticating with server", {
            userId: user.uid,
            email: user.email
          })

          // Store cookies before server call for comparison
          ;(window as any).__cookiesBeforeAuth = document.cookie
          
          // Log cookies before server call
          console.log("🍪 CLIENT: Cookies before server authentication:", {
            allCookies: document.cookie,
            hasLeadertalkSid: document.cookie.includes('leadertalk.sid'),
            hasConnectSid: document.cookie.includes('connect.sid'),
            cookieCount: document.cookie.split(';').length
          })

          // Send user data to our Express server for session creation
          const response = await fetch('/api/auth/supabase-callback', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include', // Ensure cookies are included
            body: JSON.stringify({
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
              photoURL: user.photoURL,
              emailVerified: user.emailVerified
            }),
          })

          if (response.ok) {
            const responseData = await response.json()
            const userData = responseData.user
            console.log("Server authentication successful", { userId: userData.id })
            
            // Log cookies after server call
            console.log("🍪 CLIENT: Cookies after server authentication:", {
              allCookies: document.cookie,
              hasLeadertalkSid: document.cookie.includes('leadertalk.sid'),
              hasConnectSid: document.cookie.includes('connect.sid'),
              cookieCount: document.cookie.split(';').length,
              cookieChanged: document.cookie !== (window as any).__cookiesBeforeAuth
            })
            
            setStatus('success')
            
            // Clear the processing flag
            ;(window as any).__authCallbackProcessing = false
            
            // Wait for session cookie to be set before redirecting
            console.log("Waiting for session to establish before redirect...")
            
            // Verify session is established before redirecting
            setTimeout(async () => {
              try {
                const sessionCheck = await fetch('/api/debug/session', {
                  credentials: 'include'
                });
                const sessionData = await sessionCheck.json();
                
                console.log("Session verification before redirect:", sessionData);
                
                if (sessionData.isLoggedIn) {
                  console.log("Session confirmed, proceeding with redirect");
                  if (userData.forceOnboarding || !userData.selectedLeaders?.length) {
                    console.log("Redirecting to onboarding for user setup")
                    window.location.replace('/onboarding')
                  } else {
                    console.log("User onboarding complete, redirecting to dashboard")
                    window.location.replace('/dashboard')
                  }
                } else {
                  console.error("Session not established, retrying authentication");
                  throw new Error("Session not established after authentication");
                }
              } catch (error) {
                console.error("Session verification failed:", error);
                // Fallback to immediate redirect
                if (userData.forceOnboarding || !userData.selectedLeaders?.length) {
                  window.location.replace('/onboarding')
                } else {
                  window.location.replace('/dashboard')
                }
              }
            }, 1000); // Wait 1 second for session to be established
          } else {
            const errorText = await response.text()
            console.error('Server authentication failed:', errorText)
            ;(window as any).__authCallbackProcessing = false
            throw new Error(`Server authentication failed: ${response.status}`)
          }
        } else {
          ;(window as any).__authCallbackProcessing = false
          throw new Error('No user data received from Supabase')
        }
      } catch (err: any) {
        console.error("Auth callback failed", err)
        setError(err.message || 'Authentication failed')
        setStatus('error')
        ;(window as any).__authCallbackProcessing = false
        
        // Redirect to login after a delay
        setTimeout(() => {
          navigate('/')
        }, 3000)
      }
    }

    processAuthCallback()
  }, []) // Empty dependency array to run only once

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 relative overflow-hidden p-4">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}} />
      </div>
      
      <Card className="w-full max-w-md bg-gradient-to-br from-purple-600/20 to-pink-500/20 backdrop-blur-lg border border-purple-600/30 relative z-10">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-white">
            {status === 'loading' && 'Completing Sign In...'}
            {status === 'success' && 'Sign In Successful!'}
            {status === 'error' && 'Sign In Failed'}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {status === 'loading' && (
            <>
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-white" />
              <p className="text-white/70">
                Please wait while we complete your authentication...
              </p>
            </>
          )}
          
          {status === 'success' && (
            <>
              <div className="h-8 w-8 bg-green-500/20 rounded-full flex items-center justify-center mx-auto border border-green-500/30">
                <div className="h-4 w-4 bg-green-400 rounded-full"></div>
              </div>
              <p className="text-white/70">
                Redirecting you to the app...
              </p>
            </>
          )}
          
          {status === 'error' && (
            <>
              <div className="h-8 w-8 bg-red-500/20 rounded-full flex items-center justify-center mx-auto border border-red-500/30">
                <div className="h-4 w-4 bg-red-400 rounded-full"></div>
              </div>
              <p className="text-red-400 text-sm">
                {error}
              </p>
              <p className="text-white/70 text-sm">
                Redirecting you back to login...
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}