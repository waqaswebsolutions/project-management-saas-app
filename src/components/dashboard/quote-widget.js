'use client';

import { useState, useEffect } from 'react';
import { Quote } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const quotes = [
  "Small steps every day",
  "One task at a time",
  "Done is better than perfect",
  "Progress, not perfection",
  "Make it happen today",
  "Clear mind, clear tasks",
  "Keep going, keep growing",
  "Be present, be productive",
  "Check it off, move on",
  "Less clutter, more clarity",
  "Focus on what matters",
  "Today's goals: no zero days",
  "Simple is powerful",
  "Start where you are",
  "Just keep swimming",
];

export function QuoteWidget() {
  const [quote, setQuote] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Get today's date to use as seed for consistent daily quote
    const today = new Date().toDateString();
    
    // Try to get from localStorage first (for consistent daily quote)
    const saved = localStorage.getItem('daily-quote');
    const savedDate = localStorage.getItem('quote-date');
    
    if (saved && savedDate === today) {
      setQuote(saved);
    } else {
      // Pick random quote
      const randomIndex = Math.floor(Math.random() * quotes.length);
      const newQuote = quotes[randomIndex];
      setQuote(newQuote);
      
      // Save to localStorage
      localStorage.setItem('daily-quote', newQuote);
      localStorage.setItem('quote-date', today);
    }
  }, []);

  if (!mounted) return null;

  return (
    <Card className="bg-gradient-to-r from-primary-50 to-transparent dark:from-primary-900/20 border-primary-100 dark:border-primary-800">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Quote className="w-5 h-5 text-primary-500 dark:text-primary-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm italic text-gray-700 dark:text-gray-300">
            "{quote}"
          </p>
        </div>
      </CardContent>
    </Card>
  );
}