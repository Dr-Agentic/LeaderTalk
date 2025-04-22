import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import GoogleSignUp from "@/components/onboarding/GoogleSignUp";
import { Link } from "wouter";

export default function DirectLogin() {
  const handleDirectLogin = async () => {
    try {
      console.log("Starting demo login process...");
      
      // Show loading state
      const button = document.getElementById('demo-login-button');
      if (button) {
        button.textContent = "Logging in...";
        button.setAttribute('disabled', 'true');
      }
      
      console.log("Sending force-login request to server...");
      // Use fetch instead of direct navigation to prevent full page reload
      const response = await fetch("/api/auth/force-login");
      
      console.log("Force login response received:", {
        status: response.status,
        statusText: response.statusText,
        redirected: response.redirected,
        redirectUrl: response.redirected ? response.url : 'none',
        ok: response.ok,
        type: response.type,
        headers: [...response.headers].map(([key, value]) => `${key}: ${value}`).join(', ')
      });
      
      if (response.redirected) {
        console.log(`Server redirected to ${response.url}, following redirect on client side...`);
        // If server tried to redirect, handle it on client side instead 
        window.location.href = "/";
      } else if (response.ok) {
        console.log("Login successful, redirecting to dashboard...");
        // If login was successful but no redirect, manually go to dashboard
        window.location.href = "/"; 
      } else {
        const responseText = await response.text();
        console.error("Login failed:", responseText);
        console.error("Status:", response.status, response.statusText);
        alert(`Login failed (${response.status}). Please try again.`);
        // Reset button state
        if (button) {
          button.textContent = "Log in as Demo User";
          button.removeAttribute('disabled');
        }
      }
    } catch (error) {
      console.error("Login error:", error);
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      alert("Login error. Please check console for details and try again.");
      // Reset button state
      const button = document.getElementById('demo-login-button');
      if (button) {
        button.textContent = "Log in as Demo User";
        button.removeAttribute('disabled');
      }
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 p-4">
      <Card className="w-full max-w-md p-8 space-y-6 shadow-lg">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">LeaderTalk</h1>
          <p className="text-slate-500">AI-Powered Communication Coaching</p>
        </div>

        <Tabs defaultValue="demo" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="demo">Quick Demo</TabsTrigger>
            <TabsTrigger value="google">Google Login</TabsTrigger>
          </TabsList>
          
          <TabsContent value="demo" className="space-y-4">
            <div className="bg-amber-50 border-l-4 border-amber-400 p-4 my-4">
              <p className="text-sm text-amber-700">
                Demo mode: Try the app with pre-populated data.
              </p>
            </div>
            
            <Button 
              id="demo-login-button"
              size="lg"
              className="w-full"
              onClick={handleDirectLogin}
            >
              Log in as Demo User
            </Button>
            
            <div className="text-center text-xs text-slate-500 mt-2">
              <p>No sign-up required. Click to continue.</p>
            </div>
          </TabsContent>
          
          <TabsContent value="google" className="space-y-4">
            <div className="text-center mb-4">
              <GoogleSignUp />
            </div>
          </TabsContent>
        </Tabs>

        <div className="text-center text-xs text-slate-500 mt-6 pt-2 border-t border-slate-200">
          <p className="mb-2">By continuing, you agree to our <Link href="#" className="text-blue-600 hover:underline">Terms of Service</Link> and <Link href="#" className="text-blue-600 hover:underline">Privacy Policy</Link></p>
          <p>© 2025 LeaderTalk. All rights reserved.</p>
        </div>
      </Card>
    </div>
  );
}