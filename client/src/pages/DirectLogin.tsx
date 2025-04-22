import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useEffect } from "react";

export default function DirectLogin() {
  const handleDirectLogin = () => {
    // This is a direct server-side redirect, no client-side checks or errors
    window.location.href = "/api/auth/force-login";
  };

  // Immediately try to log in on page load
  useEffect(() => {
    handleDirectLogin();
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-blue-100 p-4">
      <Card className="w-full max-w-md p-8 space-y-6 shadow-lg">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">LeaderTalk</h1>
          <p className="text-gray-500">Communication coaching app</p>
        </div>

        <div className="bg-amber-50 border-l-4 border-amber-400 p-4 my-4">
          <p className="text-sm text-amber-700">
            Development mode: Login will happen automatically.
          </p>
        </div>

        <Button 
          size="lg"
          className="w-full"
          onClick={handleDirectLogin}
        >
          Log in as Demo User
        </Button>

        <div className="text-center text-sm text-gray-500 mt-6">
          <p>Logging in automatically... Click the button if nothing happens.</p>
        </div>
      </Card>
    </div>
  );
}