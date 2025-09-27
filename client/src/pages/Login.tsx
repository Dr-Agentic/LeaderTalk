import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { signInWithGoogle } from "@/lib/supabaseAuth";
import { Loader2 } from "lucide-react";
import googleLogoPath from "@assets/google-logo.png";
// Debug logging replaced with console methods

export default function Login() {
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      console.log("Google sign-in process initiated from UI");
      await signInWithGoogle();
    } catch (error: any) {
      console.error("Google sign-in error", error);
      console.error("Google sign-in error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page min-height-screen flex-center relative overflow-hidden" 
         style={{background: 'var(--gradient-background)'}}>
      {/* Floating elements background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="floating-circle floating-circle-1"></div>
        <div className="floating-circle floating-circle-2"></div>
        <div className="floating-circle floating-circle-3"></div>
      </div>

      <Card className="container-sm glass-card relative z-10">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-white">
            Welcome to LeaderTalk
          </CardTitle>
          <CardDescription className="text-white/70">
            Transform your communication skills with AI-powered coaching
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Development Login Button */}
          {import.meta.env.DEV && (
            <Button 
              onClick={async () => {
                try {
                  setLoading(true);
                  const response = await fetch('/api/auth/force-login');
                  if (response.ok) {
                    window.location.href = "/dashboard";
                  } else {
                    console.error('Dev login failed');
                  }
                } catch (error) {
                  console.error('Dev login error:', error);
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading}
              className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "🚀"} Dev Login (Skip Auth)
            </Button>
          )}
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full cta-button flex items-center justify-center"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                <img 
                  src={googleLogoPath} 
                  alt="Google" 
                  className="mr-2 h-6 w-6"
                />
                Sign in with Google
              </>
            )}
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
