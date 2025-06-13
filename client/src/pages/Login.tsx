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
import googleLogoPath from "@assets/web_neutral_rd_na@4x_1749778980238.png";
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
    <div className="login-page min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        />
      </div>

      <Card className="w-full max-w-md bg-gradient-to-br from-purple-600/20 to-pink-500/20 backdrop-blur-lg border border-purple-600/30 relative z-10">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-white">
            Welcome to LeaderTalk
          </CardTitle>
          <CardDescription className="text-white/70">
            Transform your communication skills with AI-powered coaching
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
                  className="mr-2 h-4 w-4"
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
