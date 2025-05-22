import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";

interface OnboardingFeaturesProps {
  onComplete: () => void;
}

export default function OnboardingFeatures({ onComplete }: OnboardingFeaturesProps) {
  return (
    <div className="max-w-4xl mx-auto my-8 px-4">
      <Card className="bg-white p-8 rounded-lg shadow-md">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">You're all set!</h2>
          <p className="text-gray-600 mt-2">Here's what you can do with LeaderTalk</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
          {/* Feature 1: Record Conversations */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2c-1.7 0-3 1.2-3 2.6v6.8c0 1.4 1.3 2.6 3 2.6s3-1.2 3-2.6V4.6C15 3.2 13.7 2 12 2z"/>
                  <path d="M19 10v1a7 7 0 0 1-14 0v-1M12 18.4v3.3M8 22h8"/>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-800">Record Conversations</h3>
            </div>
            <div className="rounded-lg overflow-hidden bg-white shadow-sm mb-4">
              <img 
                src="https://static.thenounproject.com/png/4138758-200.png" 
                alt="Recording icon" 
                className="w-full h-24 object-contain p-2"
              />
            </div>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm">Record up to 50 minutes of conversation</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm">Transcribe your recordings accurately</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm">Get instant analysis of your communication</span>
              </li>
            </ul>
          </div>

          {/* Feature 2: Get Leader-Inspired Feedback */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-6 shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 14v6m-3-3h6M10 3v6m-3-3h6M3 10v6m-3-3h6"/>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-800">Leadership Alternatives</h3>
            </div>
            <div className="rounded-lg overflow-hidden bg-white shadow-sm mb-4">
              <img 
                src="https://image.flaticon.com/icons/png/512/813/813371.png" 
                alt="Leadership icon" 
                className="w-full h-24 object-contain p-2"
              />
            </div>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm">See how your chosen leaders would communicate</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm">Transform negative moments into powerful communication</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm">Learn from different leadership styles</span>
              </li>
            </ul>
          </div>

          {/* Feature 3: Training Modules */}
          <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-lg p-6 shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 9h.01"/>
                  <path d="M12 12h.01"/>
                  <path d="M12 15h.01"/>
                  <path d="M12 3c7.2 0 9 1.8 9 9s-1.8 9-9 9-9-1.8-9-9 1.8-9 9-9"/>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-800">Interactive Training</h3>
            </div>
            <div className="rounded-lg overflow-hidden bg-white shadow-sm mb-4">
              <img 
                src="https://image.flaticon.com/icons/png/512/1048/1048966.png" 
                alt="Training icon" 
                className="w-full h-24 object-contain p-2"
              />
            </div>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm">Structured modules to practice leadership communication</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm">Practice with realistic scenarios through text or voice</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm">Track your progress as you improve</span>
              </li>
            </ul>
          </div>

          {/* Feature 4: Progress Tracking */}
          <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-lg p-6 shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-800">Progress Tracking</h3>
            </div>
            <div className="rounded-lg overflow-hidden bg-white shadow-sm mb-4">
              <img 
                src="https://image.flaticon.com/icons/png/512/4305/4305512.png" 
                alt="Analytics icon" 
                className="w-full h-24 object-contain p-2"
              />
            </div>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm">Visualize your communication improvements</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm">Track your word usage and subscription details</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm">Get insights on your communication patterns over time</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex justify-center">
          <Button 
            onClick={onComplete} 
            className="px-8 py-6 text-lg"
          >
            Start Your Journey
          </Button>
        </div>
      </Card>
    </div>
  );
}