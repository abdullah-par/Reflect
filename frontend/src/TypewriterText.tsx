import React, { useState, useEffect } from 'react';

interface Props {
  text: string;
  speed?: number; // ms per char
  onComplete?: () => void;
}

export default function TypewriterText({ text, speed = 15, onComplete }: Props) {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    let index = 0;
    setDisplayedText('');
    
    if (!text) return;
    
    const intervalId = setInterval(() => {
      setDisplayedText(text.slice(0, index + 1));
      index++;
      if (index === text.length) {
        clearInterval(intervalId);
        if (onComplete) onComplete();
      }
    }, speed);

    return () => clearInterval(intervalId);
  }, [text, speed, onComplete]);

  return <span>{displayedText}</span>;
}
