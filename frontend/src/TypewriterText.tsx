import React, { useState, useEffect } from 'react';

interface Props {
  text: string;
  speed?: number; // ms per char
  delay?: number; // delay in ms before starting
  onComplete?: () => void;
}

export default function TypewriterText({ text, speed = 15, delay = 0, onComplete }: Props) {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    let index = 0;
    setDisplayedText('');
    
    if (!text) return;
    
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setDisplayedText(text);
      if (onComplete) onComplete();
      return;
    }

    const startTyping = () => {
      const intervalId = setInterval(() => {
        setDisplayedText(text.slice(0, index + 1));
        index++;
        if (index === text.length) {
          clearInterval(intervalId);
          if (onComplete) onComplete();
        }
      }, speed);
      return intervalId;
    };

    let intervalId: any;
    let timeoutId: any;

    if (delay > 0) {
      timeoutId = setTimeout(() => {
        intervalId = startTyping();
      }, delay);
    } else {
      intervalId = startTyping();
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [text, speed, delay, onComplete]);

  return <span>{displayedText}</span>;
}

