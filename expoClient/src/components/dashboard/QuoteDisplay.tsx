import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';

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
    <View style={styles.container}>
      <BlurView intensity={20} tint="dark" style={styles.blurContainer}>
        <View style={styles.content}>
          <Text style={styles.quoteText}>"{currentQuote.quote}"</Text>
          <Text style={styles.authorText}>— {currentQuote.author}</Text>
        </View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  blurContainer: {
    overflow: 'hidden',
    borderRadius: 16,
  },
  content: {
    padding: 20,
  },
  quoteText: {
    fontSize: 16,
    fontStyle: 'italic',
    color: '#fff',
    marginBottom: 8,
    lineHeight: 24,
  },
  authorText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'right',
  },
});
