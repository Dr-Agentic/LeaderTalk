import React from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';

interface WordLimitErrorProps {
  errorMessage?: string | null;
}

/**
 * Component to display word limit retrieval errors with an option to upgrade subscription
 */
export const WordLimitErrorMessage: React.FC<WordLimitErrorProps> = ({ errorMessage }) => {
  if (!errorMessage) return null;
  
  return (
    <Alert variant="destructive" className="mb-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Unable to determine word limit</AlertTitle>
      <AlertDescription className="mt-2">
        <p className="mb-2">{errorMessage}</p>
        <p className="mb-4">This is a temporary issue with our subscription service. You can try again later or contact support if this persists.</p>
        <div className="flex space-x-2">
          <Button variant="default" asChild className="bg-primary text-white hover:bg-primary/90">
            <Link to="/subscription">
              Upgrade Subscription
            </Link>
          </Button>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
};

export default WordLimitErrorMessage;