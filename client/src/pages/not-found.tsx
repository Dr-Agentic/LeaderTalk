import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Home, ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";

export default function NotFound() {
  const [, setLocation] = useLocation();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    // Log the error with detailed path information
    const currentPath = window.location.pathname;
    const referrer = document.referrer;
    const timestamp = new Date().toISOString();

    console.error(`
🚨 404 ERROR - PAGE NOT FOUND 🚨
═══════════════════════════════════
📍 Path: ${currentPath}
🔗 Referrer: ${referrer || "Direct access"}
⏰ Timestamp: ${timestamp}
🌐 Full URL: ${window.location.href}
═══════════════════════════════════
    `);

    // Countdown timer
    const countdownTimer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          console.log("🏠 Auto-redirecting to home page...");
          setLocation("/");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdownTimer);
  }, [setLocation]);

  const handleGoHome = () => {
    setLocation("/");
  };

  const handleGoBack = () => {
    window.history.back();
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900/20 via-gray-900 to-gray-900"></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10"
      >
        <Card className="w-full max-w-lg mx-4 bg-gray-800/50 border-gray-700/50 backdrop-blur-xl">
          <CardContent className="pt-8 pb-8 text-center">
            {/* Logo */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="mb-6 flex justify-center"
            >
              <img
                src="/assets/images/LeaderTalk-2025-05-30.png"
                alt="LeaderTalk Logo"
                className="h-16 w-auto"
              />
            </motion.div>

            {/* Error Icon and Title */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="mb-6"
            >
              <div className="flex justify-center mb-4">
                <div className="p-3 rounded-full bg-red-500/20 border border-red-500/30">
                  <AlertCircle className="h-8 w-8 text-red-400" />
                </div>
              </div>
              <h1 className="text-3xl font-bold card-title mb-2">
                Even Leaders make mistakes...
              </h1>
              <h2 className="text-xl font-semibold card-description mb-2">
                It's how they learn, grow, and become even stronger.
              </h2>
              <p className="card-description max-w-sm mx-auto">
                Be The Leader That you Inspire To Be.
              </p>
            </motion.div>

            {/* Countdown */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="mb-6"
            >
              <p className="text-sm card-description mb-3">
                Redirecting to home in {countdown} seconds...
              </p>

              <div className="w-full bg-gray-700 rounded-full h-2 mb-4">
                <div
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${((5 - countdown) / 5) * 100}%` }}
                ></div>
              </div>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="flex flex-col sm:flex-row gap-3 justify-center"
            >
              <Button
                onClick={handleGoHome}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 card-title border-0 shadow-lg"
                size="lg"
              >
                <Home className="h-4 w-4 mr-2" />
                Go Home
              </Button>

              <Button
                onClick={handleGoBack}
                variant="outline"
                className="border-gray-600 bg-gray-700/50 card-description hover:bg-gray-600/50 hover:card-title"
                size="lg"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
