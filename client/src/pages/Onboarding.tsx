import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
// Supabase auth removed - now using server-side session
import SimpleLeaderSelection from "@/components/onboarding/SimpleLeaderSelection";
import OnboardingWelcome from "@/components/onboarding/OnboardingWelcome";
import OnboardingPersonalInfo from "@/components/onboarding/OnboardingPersonalInfo";
import OnboardingFeatures from "@/components/onboarding/OnboardingFeatures";

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [user, setUser] = useState<any>(null);
  const [isRedirecting, setIsRedirecting] = useState(true);
  const [leaders, setLeaders] = useState<any[]>([]);
  const [isLoadingLeaders, setIsLoadingLeaders] = useState(false);
  const [googleProfile, setGoogleProfile] = useState<any>(null);
  const { toast } = useToast();

  // Check if user is already logged in and get Google profile data
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        // Check session status through server API
        const response = await apiRequest("GET", "/api/users/me");
        if (response.ok) {
          const userData = await response.json();
          console.log("Server user found:", {
            id: userData.id,
            email: userData.email,
            displayName: userData.username,
            hasPhotoUrl: !!userData.photoUrl
          });
          
          // Store user profile data
          setGoogleProfile({
            uid: userData.id,
            email: userData.email || '',
            displayName: userData.username || '',
            photoUrl: userData.photoUrl || '',
            firstName: userData.username?.split(' ')[0] || '',
            lastName: userData.username?.split(' ').slice(1).join(' ') || '',
          });
          
          // User data already retrieved above
          if (userData) {
            console.log("User data received:", userData);
            
            // Check if this is a forced onboarding test FIRST, before any other logic
            const forceOnboarding = userData.forceOnboarding === true;
            console.log("Checking database force onboarding flag:", forceOnboarding);
            
            if (forceOnboarding) {
              console.log("Force onboarding detected - starting from welcome step");
              
              // Reset the flag in the database so it doesn't persist
              try {
                await apiRequest('PATCH', '/api/users/me', { forceOnboarding: false });
                console.log("Reset force onboarding flag in database");
              } catch (error) {
                console.log("Failed to reset flag, but continuing");
              }
              
              setStep(1); // Start from the beginning
              setUser(userData);
              setIsRedirecting(false);
              return; // Exit immediately, don't run any other logic
            }
            
            // Normal logic: Determine which step to show based on completed onboarding steps
            if (!userData.dateOfBirth || !userData.profession || !userData.goals) {
              // Start at personal info step (welcome is skipped)
              console.log("User needs to complete personal info");
              setStep(2);
            } else if (!userData.selectedLeaders || userData.selectedLeaders.length === 0) {
              // Skip to leader selection
              console.log("User needs to select leaders");
              setStep(3);
            } else {
              // User has completed all required steps, go to dashboard
              console.log("User fully onboarded, redirecting to dashboard");
              window.location.href = '/dashboard';
            }
          } else {
            // User needs to be created
            try {
              const createResponse = await apiRequest('POST', '/api/users', {
                googleId: userData.id.toString(),
                email: userData.email || `user_${userData.id}@example.com`,
                username: userData.username || (userData.email ? userData.email.split('@')[0] : `User_${userData.id}`),
                photoUrl: userData.photoUrl || '',
              });
              
              if (createResponse.ok) {
                // Start with welcome step for new users
                setStep(1);
                toast({
                  title: "Account created",
                  description: "Welcome to LeaderTalk! Let's get you set up.",
                });
              }
            } catch (createError) {
              toast({
                title: "Error creating account",
                description: "There was an error creating your account. Please try again.",
                variant: "destructive",
              });
              // Send back to login
              window.location.href = '/login';
            }
          }
          
          setIsRedirecting(false);
        } else {
          // Not logged in, redirect to login
          console.log("No user session found, redirecting to login");
          window.location.href = '/login';
        }
      } catch (error) {
        console.error("Error checking login status:", error);
        // Error occurred, redirect to login
        window.location.href = '/login';
      }
    };
    
    checkLoginStatus();
  }, [toast]);

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
  const renderProgressIndicator = () => {
    const totalSteps = 4;
    const progress = (step / totalSteps) * 100;
    
    return (
      <div className="max-w-md mx-auto pt-6 px-4">
        <div className="flex justify-between text-xs text-gray-500 mb-2">
          <span>Step {step} of {totalSteps}</span>
          <span>{Math.round(progress)}% Complete</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {renderProgressIndicator()}
      
      {/* Step 1: Welcome Screen */}
      {step === 1 && (
        <OnboardingWelcome 
          onComplete={() => setStep(2)}
          googleProfile={googleProfile}
        />
      )}
      
      {/* Step 2: Personal Information */}
      {step === 2 && (
        <OnboardingPersonalInfo 
          onComplete={() => setStep(3)}
          googleProfile={googleProfile}
        />
      )}
      
      {/* Step 3: Leader Selection */}
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
          <SimpleLeaderSelection 
            leaders={leaders}
            onComplete={() => setStep(4)}
          />
        )
      )}
      
      {/* Step 4: Feature Overview & Get Started */}
      {step === 4 && (
        <OnboardingFeatures 
          onComplete={() => {
            toast({
              title: "Welcome to LeaderTalk!",
              description: "Your profile is now complete. You can start improving your communication skills.",
            });
            window.location.href = '/dashboard';
          }}
        />
      )}
    </div>
  );
}
