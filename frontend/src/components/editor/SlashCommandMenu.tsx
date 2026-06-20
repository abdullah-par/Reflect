import React, { useEffect, useRef, useState } from 'react';
import { Type, Heading1, Heading2, List, ListOrdered, Quote, Minus } from 'lucide-react';

export interface SlashCommandMenuProps {
  x: number;
  y: number;
  query: string;
  onSelect: (type: string) => void;
  onClose: () => void;
}

const OPTIONS = [
  { id: 'paragraph', label: 'Text', icon: Type },
  { id: 'heading1', label: 'Heading 1', icon: Heading1 },
  { id: 'heading2', label: 'Heading 2', icon: Heading2 },
  { id: 'bullet', label: 'Bulleted List', icon: List },
  { id: 'numbered', label: 'Numbered List', icon: ListOrdered },
  { id: 'quote', label: 'Quote', icon: Quote },
  { id: 'divider', label: 'Divider', icon: Minus },
];

export function SlashCommandMenu({ x, y, query, onSelect, onClose }: SlashCommandMenuProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  const filteredOptions = OPTIONS.filter(opt => 
    opt.label.toLowerCase().includes(query.toLowerCase()) || 
    opt.id.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (filteredOptions.length === 0) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(i => (i + 1) % filteredOptions.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(i => (i - 1 + filteredOptions.length) % filteredOptions.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        onSelect(filteredOptions[selectedIndex].id);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown, true); // Use capture phase to intercept before Tiptap
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [filteredOptions, selectedIndex, onSelect, onClose]);

  if (filteredOptions.length === 0) {
    return null; // hide if no matches
  }

  return (
    <div 
      ref={menuRef}
      className="slash-command-menu"
      style={{
        position: 'absolute',
        top: y + 24,
        left: x,
        zIndex: 1000,
      }}
    >
      {filteredOptions.map((opt, index) => (
        <button
          key={opt.id}
          className={`slash-command-item ${index === selectedIndex ? 'selected' : ''}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onSelect(opt.id);
          }}
          onMouseEnter={() => setSelectedIndex(index)}
        >
          <opt.icon size={16} className="slash-icon" />
          <span>{opt.label}</span>
        </button>
      ))}
    </div>
  );
}
