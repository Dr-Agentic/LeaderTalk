import { useState, useEffect } from "react";
import GoogleSignUp from "@/components/onboarding/GoogleSignUp";
import AdditionalInformation from "@/components/onboarding/AdditionalInformation";
import LeaderSelection from "@/components/onboarding/LeaderSelection";
import { handleRedirectResult } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [user, setUser] = useState(null);
  const [isRedirecting, setIsRedirecting] = useState(true);
  const [leaders, setLeaders] = useState([]);
  const [isLoadingLeaders, setIsLoadingLeaders] = useState(false);
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
            
            // Determine which step to show
            if (userData.dateOfBirth && userData.profession && userData.goals) {
              if (userData.selectedLeaders) {
                // User has completed all onboarding steps
                window.location.href = '/';
              } else {
                // Has personal info but needs to select leaders
                setStep(3);
              }
            } else {
              // Needs to complete personal info
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
          console.log("User data received:", userData);
          
          // Check if it's the demo user and update UI accordingly
          if (userData.email === "demo@example.com") {
            console.log("Demo user detected, setting up demo experience");
            
            // For demo users, make sure fields are properly initialized
            if (!userData.dateOfBirth || !userData.profession || !userData.goals) {
              // Demo user missing profile data - set to step 2
              setStep(2);
            } else if (!userData.selectedLeaders || userData.selectedLeaders.length === 0) {
              // Demo user missing leader selections - set to step 3
              setStep(3);
            } else {
              // Demo user fully onboarded - redirect to dashboard
              console.log("Demo user fully onboarded, redirecting to dashboard");
              window.location.href = '/dashboard';
            }
          } else {
            // Regular user - normal flow
            // Determine which step to show
            if (userData.dateOfBirth && userData.profession && userData.goals) {
              if (userData.selectedLeaders && userData.selectedLeaders.length > 0) {
                // User has completed all onboarding steps
                console.log("User fully onboarded, redirecting to dashboard");
                window.location.href = '/dashboard';
              } else {
                // Has personal info but needs to select leaders
                console.log("User needs to select leaders");
                setStep(3);
              }
            } else {
              // Needs to complete personal info
              console.log("User needs to complete personal info");
              setStep(2);
            }
          }
          setIsRedirecting(false);
        } else {
          // Not logged in, stay on step 1 (login)
          console.log("User not logged in, showing login page");
          setStep(1);
          setIsRedirecting(false);
        }
      } catch (error) {
        console.error("Error checking login status:", error);
        // User is not logged in, stay on login page
        setStep(1);
        setIsRedirecting(false);
      }
    };
    
    checkLoginStatus();
  }, []);

  // Load leaders for the selection step
  useEffect(() => {
    if (step === 3) {
      const fetchLeaders = async () => {
        setIsLoadingLeaders(true);
        try {
          const response = await apiRequest('GET', '/api/leaders');
          if (response.ok) {
            const data = await response.json();
            setLeaders(data);
          }
        } catch (error) {
          console.error("Error fetching leaders:", error);
          toast({
            title: "Error",
            description: "Failed to load leaders. Please refresh the page.",
            variant: "destructive"
          });
        } finally {
          setIsLoadingLeaders(false);
        }
      };
      
      fetchLeaders();
    }
  }, [step, toast]);

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

  // Progress indicator
  const renderProgressSteps = () => {
    if (step === 1) return null; // Don't show on login page
    
    return (
      <div className="max-w-4xl mx-auto pt-6 px-4">
        <div className="flex items-center mb-8">
          <div className={`rounded-full h-8 w-8 flex items-center justify-center ${step >= 2 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'}`}>
            1
          </div>
          <div className={`h-1 w-24 mx-2 ${step >= 3 ? 'bg-primary' : 'bg-gray-200'}`}></div>
          <div className={`rounded-full h-8 w-8 flex items-center justify-center ${step >= 3 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'}`}>
            2
          </div>
        </div>
        <div className="flex text-sm mb-8">
          <div className="flex-1 text-center">
            <p className={step >= 2 ? 'text-primary font-medium' : 'text-gray-500'}>Personal Information</p>
          </div>
          <div className="flex-1 text-center">
            <p className={step >= 3 ? 'text-primary font-medium' : 'text-gray-500'}>Leader Selection</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {renderProgressSteps()}
      
      {step === 1 && <GoogleSignUp />}
      
      {step === 2 && (
        <AdditionalInformation 
          onComplete={() => {
            // After personal info, go to leader selection
            setStep(3);
          }}
        />
      )}
      
      {step === 3 && (
        isLoadingLeaders ? (
          <div className="max-w-4xl mx-auto my-10 bg-white p-8 rounded-lg shadow-md">
            <div className="text-center mb-6">
              <Skeleton className="h-8 w-3/4 mx-auto mb-4" />
              <Skeleton className="h-4 w-2/3 mx-auto mb-2" />
              <Skeleton className="h-4 w-1/2 mx-auto" />
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mt-8">
              {Array(6).fill(0).map((_, i) => (
                <div key={i} className="bg-white border border-gray-200 rounded-lg">
                  <Skeleton className="h-36 w-full rounded-t-md" />
                  <div className="p-4">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2 mb-4" />
                    <div className="flex gap-2 mb-4">
                      <Skeleton className="h-6 w-16 rounded-full" />
                      <Skeleton className="h-6 w-16 rounded-full" />
                    </div>
                    <Skeleton className="h-4 w-full mb-1" />
                    <Skeleton className="h-4 w-full mb-1" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <LeaderSelection 
            leaders={leaders}
            onComplete={() => {
              // Completed all onboarding steps, go to dashboard
              toast({
                title: "Welcome to LeaderTalk!",
                description: "Your profile is now complete. You can start improving your communication skills.",
              });
              window.location.href = '/dashboard';
            }}
          />
        )
      )}
    </div>
  );
}
