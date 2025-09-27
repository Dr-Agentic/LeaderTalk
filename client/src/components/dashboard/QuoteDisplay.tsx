import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import quotesData from '@assets/quotes.json';

interface Quote {
  quote: string;
  author: string;
}

export function QuoteDisplay() {
  const [currentQuote, setCurrentQuote] = useState<Quote | null>(null);

  useEffect(() => {
    try {
      // Get a random quote from imported data
      const randomIndex = Math.floor(Math.random() * quotesData.length);
      setCurrentQuote(quotesData[randomIndex]);
    } catch (error) {
      console.error('Error loading quotes:', error);
      // Fallback quote in case of error
      setCurrentQuote({
        quote: "Leadership is the capacity to translate vision into reality.",
        author: "Warren Bennis"
      });
    }
  }, []);

  if (!currentQuote) return null;

  return (
    <Card className="mb-6 glass-card">
      <CardContent className="pt-6 pb-4">
        <div className="flex flex-col gap-2">
          <p className="text-lg font-light italic card-title">&ldquo;{currentQuote.quote}&rdquo;</p>
          <p className="text-right text-sm font-medium card-title/70">— {currentQuote.author}</p>
        </div>
      </CardContent>
    </Card>
  );
}