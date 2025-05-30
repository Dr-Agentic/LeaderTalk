import { useState } from 'react'
import { supabase } from '../supabase'
import { Button } from './ui/button'

export default function SimpleSupabaseLogin() {
  const [loading, setLoading] = useState(false)

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true)
      console.log('Simple Google sign-in initiated')
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/auth/callback'
        }
      })

      if (error) {
        console.error('Error:', error)
        return
      }

      console.log('OAuth data:', data)
      
      // Direct navigation without any complex logic
      if (data.url) {
        console.log('Redirecting to:', data.url)
        window.open(data.url, '_self')
      }
    } catch (error) {
      console.error('Sign-in error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 border rounded">
      <h3 className="text-lg font-semibold mb-4">Simple Supabase Test</h3>
      <Button 
        onClick={handleGoogleSignIn}
        disabled={loading}
        className="w-full"
      >
        {loading ? 'Redirecting...' : 'Test Google Sign-In'}
      </Button>
    </div>
  )
}