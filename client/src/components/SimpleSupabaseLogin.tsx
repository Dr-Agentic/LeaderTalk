import { useState } from 'react'
import { supabase } from '../supabase'
import { Button } from './ui/button'

export default function SimpleSupabaseLogin() {
  const [loading, setLoading] = useState(false)
  const [oauthUrl, setOauthUrl] = useState<string | null>(null)

  const generateOAuthUrl = async () => {
    try {
      setLoading(true)
      console.log('Generating OAuth URL')
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/auth/callback'
        }
      })

      if (error) {
        console.error('Error generating OAuth URL:', error)
        return
      }

      console.log('OAuth data:', data)
      
      if (data.url) {
        setOauthUrl(data.url)
        console.log('OAuth URL generated:', data.url)
      }
    } catch (error) {
      console.error('OAuth URL generation error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 border rounded">
      <h3 className="text-lg font-semibold mb-4">Simple Supabase Test</h3>
      
      {!oauthUrl ? (
        <Button 
          onClick={generateOAuthUrl}
          disabled={loading}
          className="w-full"
        >
          {loading ? 'Generating URL...' : 'Generate OAuth URL'}
        </Button>
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-green-600">OAuth URL generated successfully!</p>
          <Button 
            onClick={() => window.location.href = oauthUrl}
            className="w-full"
          >
            Go to Google Sign-In
          </Button>
          <div className="text-xs text-gray-500 break-all">
            URL: {oauthUrl}
          </div>
        </div>
      )}
    </div>
  )
}