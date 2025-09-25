import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { GlassCard } from '../ui/GlassCard';
import { ThemedText } from '../ThemedText';
import { useTheme } from '../../hooks/useTheme';

interface Quote {
  quote: string;
  author: string;
}

// Fallback quotes in case we can't fetch from server
const FALLBACK_QUOTES = [
  {
    quote: "Leadership is the capacity to translate vision into reality.",
    author: "Warren Bennis"
  },
  {
    quote: "The greatest leader is not necessarily the one who does the greatest things. He is the one that gets the people to do the greatest things.",
    author: "Ronald Reagan"
  },
  {
    quote: "A leader is one who knows the way, goes the way, and shows the way.",
    author: "John C. Maxwell"
  },
  {
    quote: "Leadership is not about being in charge. It is about taking care of those in your charge.",
    author: "Simon Sinek"
  },
  {
    quote: "The function of leadership is to produce more leaders, not more followers.",
    author: "Ralph Nader"
  }
];

export function QuoteDisplay() {
  const theme = useTheme();
  const [currentQuote, setCurrentQuote] = useState<Quote | null>(null);

  useEffect(() => {
    // Get a random quote from our fallback quotes
    const randomIndex = Math.floor(Math.random() * FALLBACK_QUOTES.length);
    setCurrentQuote(FALLBACK_QUOTES[randomIndex]);
    
    // In a real app, we would fetch from the server:
    // const fetchQuotes = async () => {
    //   try {
    //     const response = await fetch('https://app.leadertalk.app/assets/quotes.json');
    //     if (!response.ok) {
    //       throw new Error('Failed to fetch quotes');
    //     }
    //     const quotes = await response.json();
    //     const randomIndex = Math.floor(Math.random() * quotes.length);
    //     setCurrentQuote(quotes[randomIndex]);
    //   } catch (error) {
    //     console.error('Error fetching quotes:', error);
    //     // Use fallback quote
    //     setCurrentQuote(FALLBACK_QUOTES[0]);
    //   }
    // };
    // fetchQuotes();
  }, []);

  if (!currentQuote) return null;

  return (
    <GlassCard style={styles.container}>
      <View style={styles.content}>
        <ThemedText style={styles.quoteText}>"{currentQuote.quote}"</ThemedText>
        <ThemedText style={styles.authorText}>— {currentQuote.author}</ThemedText>
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  content: {
    padding: 24,
    paddingBottom: 16,
  },
  quoteText: {
    fontSize: 16,
    fontStyle: 'italic',
    fontWeight: '300',
    marginBottom: 8,
    lineHeight: 24,
  },
  authorText: {
    fontSize: 14,
    textAlign: 'right',
    fontWeight: '500',
  },
});
