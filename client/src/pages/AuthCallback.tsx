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
            
            // Redirect immediately after successful authentication
            if (userData.forceOnboarding || !userData.selectedLeaders?.length) {
              console.log("Redirecting to onboarding for user setup")
              window.location.replace('/onboarding')
            } else {
              console.log("User onboarding complete, redirecting to dashboard")
              window.location.replace('/dashboard')
            }
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">
            {status === 'loading' && 'Completing Sign In...'}
            {status === 'success' && 'Sign In Successful!'}
            {status === 'error' && 'Sign In Failed'}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {status === 'loading' && (
            <>
              <Loader2 className="h-8 w-8 animate-spin mx-auto" />
              <p className="text-muted-foreground">
                Please wait while we complete your authentication...
              </p>
            </>
          )}
          
          {status === 'success' && (
            <>
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <div className="h-4 w-4 bg-green-500 rounded-full"></div>
              </div>
              <p className="text-muted-foreground">
                Redirecting you to the app...
              </p>
            </>
          )}
          
          {status === 'error' && (
            <>
              <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <div className="h-4 w-4 bg-red-500 rounded-full"></div>
              </div>
              <p className="text-red-600 text-sm">
                {error}
              </p>
              <p className="text-muted-foreground text-sm">
                Redirecting you back to login...
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}