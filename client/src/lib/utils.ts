/**
 * Format a date string like '2023-04-15' to 'Apr 15, 2023'
 * @param dateString Date string to format
 * @returns Formatted date string
 */
export function formatDate(dateString: string): string {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  } catch (e) {
    console.error('Error formatting date:', e);
    return dateString; // Return the original string if parsing fails
  }
}

/**
 * Calculate the savings percentage between monthly and yearly pricing
 * @param monthlyPrice The monthly price
 * @param yearlyPrice The yearly price (for 12 months)
 * @returns Percentage saved with yearly plan
 */
export function calculateSavings(monthlyPrice: number, yearlyPrice: number): number {
  // Yearly price is for 12 months, so calculate the savings
  const monthlyTotal = monthlyPrice * 12;
  if (monthlyTotal === 0) return 0;
  return Math.round(((monthlyTotal - yearlyPrice) / monthlyTotal) * 100);
}

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combine class names with Tailwind's class merging
 * @param inputs Class values to combine
 * @returns Combined class string
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}