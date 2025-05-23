import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { useEffect } from "react";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Log the error with detailed path information
    const currentPath = window.location.pathname;
    const referrer = document.referrer;
    const timestamp = new Date().toISOString();
    
    console.error(`
🚨 404 ERROR - PAGE NOT FOUND 🚨
═══════════════════════════════════
📍 Path: ${currentPath}
🔗 Referrer: ${referrer || 'Direct access'}
⏰ Timestamp: ${timestamp}
🌐 Full URL: ${window.location.href}
═══════════════════════════════════
    `);

    // Auto-redirect to home after 3 seconds
    const timer = setTimeout(() => {
      console.log('🏠 Auto-redirecting to home page...');
      setLocation('/');
    }, 3000);

    return () => clearTimeout(timer);
  }, [setLocation]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <h1 className="text-2xl font-bold text-gray-900">404 Page Not Found</h1>
          </div>

          <p className="mt-4 text-sm text-gray-600">
            Page not found. Redirecting to home in 3 seconds...
          </p>
          
          <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{
              animation: 'progress 3s linear forwards',
              width: '0%'
            }}></div>
          </div>
        </CardContent>
      </Card>
      
      <style jsx>{`
        @keyframes progress {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </div>
  );
}
