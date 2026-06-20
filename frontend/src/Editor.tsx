import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchWithAuth } from './api';
import { formatWatermarkDate, formatPastEchoLabel, buildObserverNote } from './utils/format';
import { Theme } from './useTheme';
import TypewriterText from './TypewriterText';
import { BlockEditor } from './components/editor/BlockEditor';
import './components/editor/editor.css';
import { ContentBlock } from './api';
import { v4 as uuidv4 } from 'uuid';

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
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const content = blocks.map(b => b.text).join('\n');
  const [isSaving, setIsSaving] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [insight, setInsight] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const recognitionRef = useRef<any>(null);

  // Removed textarea auto-resize effect as BlockEditor manages its own height

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
        body: JSON.stringify({ content, content_blocks: blocks }),
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
          setBlocks((prev) => {
            if (prev.length === 0) return [{ id: uuidv4(), type: 'paragraph', text: transcript, marks: [] }];
            const newBlocks = [...prev];
            const last = newBlocks[newBlocks.length - 1];
            newBlocks[newBlocks.length - 1] = {
              ...last,
              text: last.text + (last.text.endsWith(' ') || last.text === '' ? '' : ' ') + transcript
            };
            return newBlocks;
          });
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

      <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column' }}>
        {blocks.length === 0 || (blocks.length === 1 && blocks[0].text === '') ? (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            pointerEvents: 'none',
            color: 'var(--text-3)',
            fontFamily: 'var(--font-body)',
            fontSize: 'var(--reading-size, 1.05rem)',
            lineHeight: 'var(--reading-lh, 1.85)',
            padding: '0',
            opacity: 0.6
          }}>
            <TypewriterText text="I'm thinking about..." speed={40} />
          </div>
        ) : null}
        <BlockEditor 
          initialBlocks={blocks} 
          onChange={setBlocks} 
        />
      </div>
    </div>
  );
}