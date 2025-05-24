import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAuth, getRedirectResult, signInWithRedirect, GoogleAuthProvider } from "firebase/auth";
import { logDebug, logInfo, logError } from "@/lib/debugLogger";

export default function IOSDebug() {
  const [debugInfo, setDebugInfo] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addDebugEntry = (message: string, data?: any) => {
    const entry = {
      timestamp: new Date().toISOString(),
      message,
      data: data ? JSON.stringify(data, null, 2) : null
    };
    setDebugInfo(prev => [entry, ...prev]);
    console.log(`[iOS Debug] ${message}`, data);
  };

  useEffect(() => {
    addDebugEntry("Page loaded", {
      userAgent: navigator.userAgent,
      url: window.location.href,
      search: window.location.search,
      hash: window.location.hash,
      isIOS: /iPad|iPhone|iPod/.test(navigator.userAgent),
      isSafari: /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
    });

    // Check for redirect result immediately
    checkRedirectResult();
  }, []);

  const checkRedirectResult = async () => {
    try {
      addDebugEntry("Checking for redirect result...");
      const auth = getAuth();
      const result = await getRedirectResult(auth);
      
      if (result) {
        addDebugEntry("✅ Redirect result found!", {
          user: {
            uid: result.user.uid,
            email: result.user.email,
            displayName: result.user.displayName
          }
        });
        
        // Try to authenticate with server
        await authenticateWithServer(result.user);
      } else {
        addDebugEntry("❌ No redirect result found");
        
        // iOS Safari fallback: Check if user is actually signed in
        const currentUser = auth.currentUser;
        if (currentUser) {
          addDebugEntry("🔄 But found current user in Firebase auth!", {
            user: {
              uid: currentUser.uid,
              email: currentUser.email,
              displayName: currentUser.displayName
            }
          });
          
          // Try to authenticate with server using current user
          await authenticateWithServer(currentUser);
        } else {
          addDebugEntry("❌ No current user either");
        }
      }
    } catch (error: any) {
      addDebugEntry("❌ Error checking redirect result", {
        code: error.code,
        message: error.message
      });
    }
  };

  const authenticateWithServer = async (user: any) => {
    try {
      addDebugEntry("Sending user data to server...");
      
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          googleId: user.uid,
          email: user.email || `user_${user.uid}@example.com`,
          username: user.displayName || `User ${user.uid.substring(0, 6)}`,
          photoUrl: user.photoURL
        }),
        credentials: 'include'
      });

      if (response.ok) {
        const userData = await response.json();
        addDebugEntry("✅ Server authentication successful", userData);
      } else {
        const errorText = await response.text();
        addDebugEntry("❌ Server authentication failed", {
          status: response.status,
          error: errorText
        });
      }
    } catch (error: any) {
      addDebugEntry("❌ Network error during server auth", {
        message: error.message
      });
    }
  };

  const testGoogleAuth = async () => {
    setIsLoading(true);
    try {
      addDebugEntry("Starting Google authentication test...");
      
      const auth = getAuth();
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account',
        display: 'popup'
      });
      
      addDebugEntry("Initiating redirect...");
      await signInWithRedirect(auth, provider);
      
    } catch (error: any) {
      addDebugEntry("❌ Error during Google auth", {
        code: error.code,
        message: error.message
      });
      setIsLoading(false);
    }
  };

  const clearDebugInfo = () => {
    setDebugInfo([]);
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>iOS Authentication Debug Tool</CardTitle>
          <div className="flex gap-2">
            <Button onClick={testGoogleAuth} disabled={isLoading}>
              {isLoading ? "Testing..." : "Test Google Auth"}
            </Button>
            <Button onClick={checkRedirectResult} variant="outline">
              Check Redirect Result
            </Button>
            <Button onClick={clearDebugInfo} variant="outline">
              Clear Debug Info
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {debugInfo.length === 0 ? (
              <p className="text-gray-500">No debug information yet. Try testing Google auth.</p>
            ) : (
              debugInfo.map((entry, index) => (
                <div key={index} className="border rounded p-3 bg-gray-50">
                  <div className="flex justify-between items-start mb-2">
                    <strong className="text-sm">{entry.message}</strong>
                    <span className="text-xs text-gray-500">
                      {new Date(entry.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  {entry.data && (
                    <pre className="text-xs bg-white p-2 rounded border overflow-x-auto">
                      {entry.data}
                    </pre>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}