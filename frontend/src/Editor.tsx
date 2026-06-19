import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchWithAuth } from './api';
import { formatWatermarkDate, formatPastEchoLabel, buildObserverNote } from './utils/format';
import { Theme } from './useTheme';

interface Props {
  theme: Theme;
  toggleTheme: () => void;
}

function MoonIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

export default function Editor({ theme, toggleTheme }: Props) {
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [insight, setInsight] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const recognitionRef = useRef<any>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;

      if (document.activeElement === textareaRef.current) {
        const caret = textareaRef.current.selectionEnd;
        const sub = content.substring(0, caret);
        const newlines = (sub.match(/\n/g) || []).length;
        const style = window.getComputedStyle(textareaRef.current);
        const fontSize = parseFloat(style.fontSize) || 16;
        const lhRaw = style.lineHeight;
        const lineHeight = lhRaw === 'normal' ? fontSize * 1.5 : parseFloat(lhRaw);
        const padding = parseFloat(style.paddingTop) || 0;
        const caretY = textareaRef.current.offsetTop + padding + (newlines * lineHeight) + (lineHeight / 2);
        const targetScroll = caretY - (window.innerHeight / 2);
        
        window.scrollTo({
          top: Math.max(0, targetScroll),
          behavior: 'smooth'
        });
      }
    }
  }, [content]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const handleSave = useCallback(async () => {
    if (!content.trim() || isSaving) return;

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    setIsSaving(true);
    setError(null);
    try {
      const res = await fetchWithAuth('/entries/', {
        method: 'POST',
        body: JSON.stringify({ content }),
      });

      if (res.ok) {
        const data = await res.json();
        setInsight(data.insight);
      } else {
        setError('Could not save. Try again when you are ready.');
        setIsSaving(false);
      }
    } catch {
      setError('Could not save. Try again when you are ready.');
      setIsSaving(false);
    }
  }, [content, isListening, isSaving]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && content.trim() && !isSaving) {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [content, isSaving, handleSave]);

  const toggleListening = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Voice input is not available in this browser.');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onstart = () => setIsListening(true);
      rec.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join('');
        if (transcript) {
          setContent((prev) => prev + (prev.endsWith(' ') || prev === '' ? '' : ' ') + transcript);
        }
      };
      rec.onerror = () => setIsListening(false);
      rec.onend = () => setIsListening(false);

      recognitionRef.current = rec;
      rec.start();
    }
  };

  if (isSaving && !insight) {
    return (
      <div className="silent-saving">
        <p className="silent-saving-text">One moment.</p>
      </div>
    );
  }

  if (insight) {
    const observerNote = buildObserverNote(insight);
    const pastEntries = insight.relevant_past_entries ?? [];

    return (
      <div className="insight-view">
        <div className="insight-view-inner animate-up">
          <p className="entry-written">{content}</p>

          {observerNote && (
            <p className="observer-note animate-up delay-1">{observerNote}</p>
          )}

          {pastEntries.map((past: any, idx: number) => {
            const echoDate =
              past.metadata?.created_at || past.created_at;
            return (
              <div key={idx} className="past-echo animate-up delay-2">
                <p className="past-echo-label">
                  {formatPastEchoLabel(echoDate)}
                </p>
                <p className="past-echo-text">&ldquo;{past.content}&rdquo;</p>
              </div>
            );
          })}

          <div className="insight-actions">
            <button
              type="button"
              className="quiet-link"
              onClick={() => navigate('/app')}
            >
              continue
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="editor-page">
      <div className="editor-chrome">
        <button
          type="button"
          className="editor-back"
          onClick={() => navigate('/app')}
          aria-label="Go back"
        >
          ← Back
        </button>
        <div className="editor-actions">
          <button
            type="button"
            onClick={toggleListening}
            className={`mic-btn ${isListening ? 'active' : ''}`}
            aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
          </button>
          <button
            type="button"
            onClick={toggleTheme}
            className="theme-toggle-btn"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>
          {content.trim() && (
            <button
              type="button"
              className="editor-done"
              onClick={handleSave}
              disabled={isSaving}
            >
              done
            </button>
          )}
        </div>
      </div>

      {isListening && (
        <p className="voice-hint">listening&hellip;</p>
      )}

      {error && <p className="quiet-error">{error}</p>}

      <p className="watermark-date">{formatWatermarkDate()}</p>

      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder=""
        className="editor-textarea"
        autoFocus
        style={{ overflow: 'hidden' }}
      />
    </div>
  );
}