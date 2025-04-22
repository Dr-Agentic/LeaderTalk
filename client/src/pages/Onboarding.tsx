import { useState, useEffect } from "react";
import GoogleSignUp from "@/components/onboarding/GoogleSignUp";
import AdditionalInformation from "@/components/onboarding/AdditionalInformation";
import { handleRedirectResult } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [user, setUser] = useState(null);
  const [isRedirecting, setIsRedirecting] = useState(true);
  const { toast } = useToast();

  // Handle Google redirect result
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const redirectUser = await handleRedirectResult();
        if (redirectUser) {
          // Check if user exists in database
          try {
            const userResponse = await apiRequest('GET', '/api/users/me');
            const userData = await userResponse.json();
            
            // If user already has profile info complete, redirect to dashboard
            if (userData.dateOfBirth && userData.profession && userData.goals) {
              window.location.href = '/';
            } else {
              // User exists but needs to complete profile
              setStep(2);
            }
          } catch (error) {
            // User needs to be created
            try {
              const createResponse = await apiRequest('POST', '/api/users', {
                googleId: redirectUser.uid,
                email: redirectUser.email,
                username: redirectUser.displayName || redirectUser.email.split('@')[0],
                photoUrl: redirectUser.photoURL || '',
                selectedLeaders: [1, 2, 3] // Pre-select some default leaders
              });
              
              if (createResponse.ok) {
                setStep(2);
                toast({
                  title: "Account created",
                  description: "Your account has been created successfully!",
                });
              }
            } catch (createError) {
              toast({
                title: "Error creating account",
                description: "There was an error creating your account. Please try again.",
                variant: "destructive",
              });
            }
          }
        }
        
        setUser(redirectUser);
        setIsRedirecting(false);
      } catch (error) {
        console.error("Error handling redirect:", error);
        setIsRedirecting(false);
        toast({
          title: "Authentication Error",
          description: "There was an error with the authentication. Please try again.",
          variant: "destructive",
        });
      }
    };

    checkAuth();
  }, [toast]);

  // Check if user is already logged in
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const res = await apiRequest('GET', '/api/users/me');
        if (res.ok) {
          const userData = await res.json();
          
          // If profile is already complete, redirect to dashboard
          if (userData.dateOfBirth && userData.profession && userData.goals) {
            window.location.href = '/';
          } else {
            // User needs to complete profile
            setStep(2);
          }
        }
      } catch (error) {
        // User is not logged in, stay on login page
        setIsRedirecting(false);
      }
    };
    
    checkLoginStatus();
  }, []);

  if (isRedirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin h-8 w-8 text-primary">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {step === 1 && <GoogleSignUp />}
      
      {step === 2 && (
        <AdditionalInformation 
          onComplete={() => {
            // After completing profile, redirect straight to dashboard
            window.location.href = '/';
          }}
        />
      )}
    </div>
  );
}
