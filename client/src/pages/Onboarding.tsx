import { useState, useEffect } from "react";
import GoogleSignUp from "@/components/onboarding/GoogleSignUp";
import AdditionalInformation from "@/components/onboarding/AdditionalInformation";
import LeaderSelection from "@/components/onboarding/LeaderSelection";
import { handleRedirectResult } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [user, setUser] = useState(null);
  const [isRedirecting, setIsRedirecting] = useState(true);
  const { toast } = useToast();

  const { data: leaders, isLoading: loadingLeaders } = useQuery({
    queryKey: ['/api/leaders'],
    enabled: step === 3,
  });

  // Handle Google redirect result
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const redirectUser = await handleRedirectResult();
        if (redirectUser) {
          // Check if user exists in database
          try {
            await apiRequest('GET', '/api/users/me');
            setStep(2); // User exists, start onboarding
          } catch (error) {
            // User needs to be created
            try {
              const createResponse = await apiRequest('POST', '/api/users', {
                googleId: redirectUser.uid,
                email: redirectUser.email,
                username: redirectUser.displayName || redirectUser.email.split('@')[0],
                photoUrl: redirectUser.photoURL || ''
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

  // Check if onboarding is needed
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        const res = await apiRequest('GET', '/api/users/me');
        const userData = await res.json();
        
        if (userData.dateOfBirth && userData.profession && userData.goals) {
          setStep(3);
          
          if (userData.selectedLeaders && userData.selectedLeaders.length > 0) {
            // Onboarding is complete, redirect to dashboard
            window.location.href = '/';
          }
        }
      } catch (error) {
        // User needs onboarding
      }
    };
    
    if (!isRedirecting && user) {
      checkOnboardingStatus();
    }
  }, [isRedirecting, user]);

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
          onComplete={() => setStep(3)}
        />
      )}
      
      {step === 3 && (
        loadingLeaders ? (
          <div className="max-w-4xl mx-auto my-10 p-8">
            <Skeleton className="h-12 w-3/4 mx-auto mb-6" />
            <Skeleton className="h-6 w-1/2 mx-auto mb-8" />
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mt-8">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-80 rounded-lg" />
              ))}
            </div>
          </div>
        ) : (
          <LeaderSelection 
            leaders={leaders || []}
            onComplete={() => {
              // Redirect to dashboard
              window.location.href = '/';
            }}
          />
        )
      )}
    </div>
  );
}
