import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface Quote {
  quote: string;
  author: string;
}

export function QuoteDisplay() {
  const [currentQuote, setCurrentQuote] = useState<Quote | null>(null);

  useEffect(() => {
    // Fetch quotes from the JSON file
    const fetchQuotes = async () => {
      try {
        const response = await fetch('/assets/quotes.json');
        if (!response.ok) {
          throw new Error('Failed to fetch quotes');
        }
        const quotes = await response.json();
        
        // Get a random quote
        const randomIndex = Math.floor(Math.random() * quotes.length);
        setCurrentQuote(quotes[randomIndex]);
      } catch (error) {
        console.error('Error fetching quotes:', error);
        // Fallback quote in case of error
        setCurrentQuote({
          quote: "Leadership is the capacity to translate vision into reality.",
          author: "Warren Bennis"
        });
      }
    };
    
    fetchQuotes();
  }, []);

  if (!currentQuote) return null;

  return (
    <Card className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-none shadow-sm">
      <CardContent className="pt-6 pb-4">
        <div className="flex flex-col gap-2">
          <p className="text-lg font-light italic text-gray-700">&ldquo;{currentQuote.quote}&rdquo;</p>
          <p className="text-right text-sm font-medium text-gray-600">— {currentQuote.author}</p>
        </div>
      </CardContent>
    </Card>
  );
}