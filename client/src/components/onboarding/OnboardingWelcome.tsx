import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";

interface OnboardingWelcomeProps {
  onComplete: () => void;
  googleProfile: {
    displayName?: string;
    photoUrl?: string;
    firstName?: string;
  } | null;
}

export default function OnboardingWelcome({ onComplete, googleProfile }: OnboardingWelcomeProps) {
  const [isTestingMode, setIsTestingMode] = useState(false);

  const handleContinue = async () => {
    if (isTestingMode) {
      // Reset user onboarding data for testing
      try {
        await apiRequest('PATCH', '/api/users/me', {
          dateOfBirth: null,
          profession: null,
          goals: null,
          selectedLeaders: null,
          preferredLeadershipStyle: null,
        });
      } catch (error) {
        console.error("Error resetting user data:", error);
      }
    }
    onComplete();
  };

  return (
    <div className="max-w-3xl mx-auto my-8 px-4">
      <Card className="bg-gray-800 p-8 rounded-lg shadow-md border border-gray-700">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-4">
            Welcome to LeaderTalk
          </h1>
          
          {googleProfile?.photoUrl && (
            <div className="flex justify-center mb-6">
              <Avatar className="h-20 w-20 border-2 border-primary/20">
                <AvatarImage src={googleProfile.photoUrl} alt="Profile" />
                <AvatarFallback className="text-2xl">
                  {googleProfile.firstName?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
            </div>
          )}
          
          <h2 className="text-xl font-semibold text-white">
            {googleProfile?.displayName ? `Hi, ${googleProfile.firstName}!` : 'Welcome!'}
          </h2>
          
          <p className="text-gray-300 mt-2 max-w-lg mx-auto mb-1">
            LeaderTalk analyzes your communication and provides personalized coaching based on the world's greatest leaders.
          </p>
          <p className="font-semibold text-lg bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Talk like the leader you aspire to be
          </p>
        </div>
        
        <div className="space-y-6 mb-8">
          <div className="flex items-start gap-4 p-4 bg-blue-900/20 rounded-lg border border-blue-800/30">
            <div className="rounded-full bg-blue-600/20 p-2 text-blue-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="5" />
                <path d="M20 21a8 8 0 0 0-16 0" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-white">Create Your Profile</h3>
              <p className="text-gray-300 text-sm">Personalize your experience with your communication goals</p>
            </div>
          </div>
          
          <div className="flex items-start gap-4 p-4 bg-purple-900/20 rounded-lg border border-purple-800/30">
            <div className="rounded-full bg-purple-600/20 p-2 text-purple-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-white">Select Leadership Inspirations</h3>
              <p className="text-gray-300 text-sm">Choose leaders whose communication style you admire</p>
            </div>
          </div>
          
          <div className="flex items-start gap-4 p-4 bg-green-900/20 rounded-lg border border-green-800/30">
            <div className="rounded-full bg-green-600/20 p-2 text-green-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9"></path>
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-white">Improve Your Communication</h3>
              <p className="text-gray-300 text-sm">Record conversations and get personalized feedback</p>
            </div>
          </div>
        </div>
        
        {/* Testing mode checkbox */}
        <div className="flex items-center justify-center space-x-2 mb-6 p-3 bg-gray-700/50 rounded-lg border border-gray-600">
          <Checkbox 
            id="testing-mode" 
            checked={isTestingMode}
            onCheckedChange={(checked) => setIsTestingMode(checked === true)}
          />
          <label 
            htmlFor="testing-mode" 
            className="text-sm text-gray-300 cursor-pointer"
          >
            Test onboarding again (resets your profile data)
          </label>
        </div>
        
        <div className="flex justify-center">
          <Button 
            onClick={handleContinue} 
            className="cta-button px-6 py-6 text-lg gap-2"
          >
            Get Started <ArrowRight className="h-5 w-5" />
          </Button>
        </div>
      </Card>
    </div>
  );
}