import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";

interface OnboardingFeaturesProps {
  onComplete: () => void;
}

export default function OnboardingFeatures({ onComplete }: OnboardingFeaturesProps) {
  return (
    <div className="max-w-4xl mx-auto my-8 px-4">
      <Card className="bg-gray-800 p-8 rounded-lg shadow-md border border-gray-700">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white">You're all set!</h2>
          <p className="text-gray-300 mt-2">Here's what you can do with LeaderTalk</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
          {/* Feature 1: Record Conversations */}
          <div className="bg-gradient-to-br from-blue-900/20 to-indigo-900/20 rounded-lg p-6 shadow border border-blue-800/30">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2c-1.7 0-3 1.2-3 2.6v6.8c0 1.4 1.3 2.6 3 2.6s3-1.2 3-2.6V4.6C15 3.2 13.7 2 12 2z"/>
                  <path d="M19 10v1a7 7 0 0 1-14 0v-1M12 18.4v3.3M8 22h8"/>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white">Record Conversations</h3>
            </div>
            <div className="rounded-lg overflow-hidden bg-gray-700/50 shadow-sm mb-4">
              <div className="w-full h-24 flex items-center justify-center text-blue-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2c-1.7 0-3 1.2-3 2.6v6.8c0 1.4 1.3 2.6 3 2.6s3-1.2 3-2.6V4.6C15 3.2 13.7 2 12 2z"/>
                  <path d="M19 10v1a7 7 0 0 1-14 0v-1M12 18.4v3.3M8 22h8"/>
                </svg>
              </div>
            </div>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-300">Record up to 50 minutes of conversation</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-300">Transcribe your recordings accurately</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-300">Get instant analysis of your communication</span>
              </li>
            </ul>
          </div>

          {/* Feature 2: Get Leader-Inspired Feedback */}
          <div className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 rounded-lg p-6 shadow border border-purple-800/30">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-purple-600/20 flex items-center justify-center text-purple-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 14v6m-3-3h6M10 3v6m-3-3h6M3 10v6m-3-3h6"/>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white">Leadership Alternatives</h3>
            </div>
            <div className="rounded-lg overflow-hidden bg-gray-700/50 shadow-sm mb-4">
              <div className="w-full h-24 flex items-center justify-center text-purple-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="m22 21-3-3m0 0a5.5 5.5 0 1 0-7.78-7.78 5.5 5.5 0 0 0 7.78 7.78Z"/>
                </svg>
              </div>
            </div>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-300">See how your chosen leaders would communicate</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-300">Transform negative moments into powerful communication</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-300">Learn from different leadership styles</span>
              </li>
            </ul>
          </div>

          {/* Feature 3: Training Modules */}
          <div className="bg-gradient-to-br from-amber-900/20 to-yellow-900/20 rounded-lg p-6 shadow border border-amber-800/30">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-amber-600/20 flex items-center justify-center text-amber-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 9h.01"/>
                  <path d="M12 12h.01"/>
                  <path d="M12 15h.01"/>
                  <path d="M12 3c7.2 0 9 1.8 9 9s-1.8 9-9 9-9-1.8-9-9 1.8-9 9-9"/>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white">Interactive Training</h3>
            </div>
            <div className="rounded-lg overflow-hidden bg-gray-700/50 shadow-sm mb-4">
              <div className="w-full h-24 flex items-center justify-center text-amber-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 3v4a1 1 0 0 0 1 1h4"/>
                  <path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z"/>
                  <path d="M9 9h1"/>
                  <path d="M9 13h6"/>
                  <path d="M9 17h6"/>
                </svg>
              </div>
            </div>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-300">Structured modules to practice leadership communication</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-300">Practice with realistic scenarios through text or voice</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-300">Track your progress as you improve</span>
              </li>
            </ul>
          </div>

          {/* Feature 4: Progress Tracking */}
          <div className="bg-gradient-to-br from-green-900/20 to-teal-900/20 rounded-lg p-6 shadow border border-green-800/30">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-green-600/20 flex items-center justify-center text-green-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white">Progress Tracking</h3>
            </div>
            <div className="rounded-lg overflow-hidden bg-gray-700/50 shadow-sm mb-4">
              <div className="w-full h-24 flex items-center justify-center text-green-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 3v5h5"/>
                  <path d="M3 3a9 9 0 0 1 18 9"/>
                  <path d="M21 21v-5h-5"/>
                  <path d="M21 21a9 9 0 0 1-18-9"/>
                  <path d="M8 12l2 2 4-4"/>
                </svg>
              </div>
            </div>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-300">Visualize your communication improvements</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-300">Track your word usage and subscription details</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-300">Get insights on your communication patterns over time</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex justify-center">
          <button 
            onClick={onComplete} 
            className="cta-button px-8 py-6 text-lg"
          >
            Start Your Journey
          </button>
        </div>
      </Card>
    </div>
  );
}