import { useEffect, useState } from 'react'
import { useLocation } from 'wouter'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import { handleAuthCallback } from '@/lib/supabaseAuth'
// Debug logging replaced with console methods

export default function AuthCallback() {
  const [, navigate] = useLocation()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function processAuthCallback() {
      try {
        logInfo("Processing Supabase auth callback")
        
        const user = await handleAuthCallback()
        
        if (user) {
          logInfo("Auth callback successful, authenticating with server", {
            userId: user.uid,
            email: user.email
          })

          // Send user data to our Express server for session creation
          const response = await fetch('/api/auth/supabase-callback', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
              photoURL: user.photoURL,
              emailVerified: user.emailVerified
            }),
          })

          if (response.ok) {
            const userData = await response.json()
            logInfo("Server authentication successful", { userId: userData.id })
            
            setStatus('success')
            
            // Check if user needs onboarding
            if (userData.forceOnboarding || !userData.selectedLeaders?.length) {
              navigate('/onboarding')
            } else {
              navigate('/dashboard')
            }
          } else {
            throw new Error('Server authentication failed')
          }
        } else {
          throw new Error('No user data received from Supabase')
        }
      } catch (err: any) {
        logError("Auth callback failed", err)
        setError(err.message || 'Authentication failed')
        setStatus('error')
        
        // Redirect to login after a delay
        setTimeout(() => {
          navigate('/')
        }, 3000)
      }
    }

    processAuthCallback()
  }, [navigate])

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