import React from "react";

/**
 * Component to display when the word limit is exceeded
 */
interface WordLimitExceededProps {
  currentUsage?: number;
  wordLimit?: number;
}

export const WordLimitExceededMessage: React.FC<WordLimitExceededProps> = ({ 
  currentUsage, 
  wordLimit 
}) => {
  return (
    <div className="rounded-lg bg-amber-50 p-4 border border-amber-200 mt-4">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-amber-800">Word limit exceeded</h3>
          <div className="mt-2 text-sm text-amber-700">
            <p>
              {currentUsage !== undefined && wordLimit !== undefined ? 
                `You've used ${currentUsage} words of your ${wordLimit} monthly word limit.` :
                "You've reached your monthly word limit."
              } To continue analyzing conversations, 
              please upgrade your subscription.
            </p>
          </div>
          <div className="mt-4">
            <div className="-mx-2 -my-1.5 flex">
              <a
                href="/subscription"
                className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              >
                Upgrade Subscription
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Component to display when there's an error fetching subscription data
 */
export const SubscriptionErrorMessage: React.FC = () => {
  return (
    <div className="rounded-lg bg-red-50 p-4 border border-red-200 mt-4">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-red-800">Subscription data unavailable</h3>
          <div className="mt-2 text-sm text-red-700">
            <p>
              We're having trouble retrieving your subscription information. Your recordings will
              still be processed, but we can't verify your current word usage.
            </p>
          </div>
          <div className="mt-4">
            <div className="-mx-2 -my-1.5 flex">
              <a
                href="/settings"
                className="inline-flex items-center rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                Check Account Status
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Component to display after analysis when word limit is exceeded
 */
export const PostAnalysisLimitMessage: React.FC = () => {
  return (
    <div className="rounded-lg bg-amber-50 p-6 border border-amber-200 my-8">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className="h-6 w-6 text-amber-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-4">
          <h3 className="text-lg font-medium text-amber-800">Monthly Word Limit Exceeded</h3>
          <div className="mt-2 text-md text-amber-700">
            <p>
              This analysis has pushed you over your monthly word limit. While this analysis is complete,
              you won't be able to analyze any more conversations until your subscription renews or you upgrade.
            </p>
          </div>
          <div className="mt-6 flex space-x-4">
            <a
              href="/subscription"
              className="inline-flex items-center rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
            >
              Upgrade Now
            </a>
            <a
              href="/dashboard"
              className="inline-flex items-center rounded-md bg-white px-4 py-2 text-sm font-medium text-amber-800 shadow-sm border border-amber-300 hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
            >
              Return to Dashboard
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};