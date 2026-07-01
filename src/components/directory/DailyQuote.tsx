import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Leaf } from '@/lib/icons';

const quotes = [
  { text: "The wound is the place where the Light enters you.", author: "Rumi" },
  { text: "Healing is not a destination, but a journey of self-discovery.", author: "Anonymous" },
  { text: "Nature itself is the best physician.", author: "Hippocrates" },
  { text: "The greatest healing therapy is friendship and love.", author: "Hubert H. Humphrey" },
  { text: "To heal is to touch with love that which we previously touched with fear.", author: "Stephen Levine" },
  { text: "Your body has the ability to heal itself. Your mind just needs to be convinced.", author: "Anonymous" },
  { text: "The art of healing comes from nature, not from the physician.", author: "Paracelsus" },
  { text: "Embrace the journey of healing, for it is a path to your true self.", author: "Anonymous" },
  { text: "Every step taken in mindfulness is a step toward healing.", author: "Thich Nhat Hanh" },
  { text: "The human spirit is stronger than anything that can happen to it.", author: "C.C. Scott" },
];

export default function DailyQuote() {
  const [dailyQuote, setDailyQuote] = useState({ text: "", author: "" });

  useEffect(() => {
    // Get the day of the year (1-366)
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = (now - start) + ((start.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000);
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);
    
    const quoteIndex = dayOfYear % quotes.length;
    setDailyQuote(quotes[quoteIndex]);
  }, []);

  if (!dailyQuote.text) {
    return null; // Don't render if there's no quote
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.6 }}
      className="max-w-4xl mx-auto my-12 text-center"
    >
      <div className="relative p-6 bg-card/50 border border-primary/10 rounded-2xl shadow-sm backdrop-blur-sm">
        <Leaf className="absolute top-4 left-4 h-6 w-6 text-primary/80 opacity-50" />
        <Leaf className="absolute bottom-4 right-4 h-6 w-6 text-primary/80 opacity-50" />
        <p className="text-xl md:text-2xl font-serif italic text-foreground mb-3">
          "{dailyQuote.text}"
        </p>
        <p className="text-sm font-medium text-primary tracking-wide">
          — {dailyQuote.author}
        </p>
      </div>
    </motion.div>
  );
}