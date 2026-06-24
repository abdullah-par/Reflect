import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { fetchEntry, saveEntry } from './api';
import { formatWatermarkDate, formatPastEchoLabel, buildObserverNote } from './utils/format';
import { Theme } from './useTheme';
import TypewriterText from './TypewriterText';
import { BlockEditor } from './components/editor/BlockEditor';
import './components/editor/editor.css';
import { ContentBlock } from './api';
import { v4 as uuidv4 } from 'uuid';
import { useSettings } from './useSettings';

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

// Procedural Audio Engine
let audioCtx: AudioContext | null = null;
const getAudioContext = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
};

let noiseBuffer: AudioBuffer | null = null;
const getNoiseBuffer = (ctx: AudioContext) => {
  if (noiseBuffer) return noiseBuffer;
  const bufferSize = ctx.sampleRate * 0.1; // 100ms
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  noiseBuffer = buffer;
  return noiseBuffer;
};

const playTypewriterSound = (type: 'clack' | 'return' | 'backspace', pitchVariance: number) => {
  try {
    const ctx = getAudioContext();
    const noise = getNoiseBuffer(ctx);

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noise;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';

    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();

    const mainGain = ctx.createGain();
    
    noiseSource.connect(filter);
    filter.connect(mainGain);
    
    osc.connect(oscGain);
    oscGain.connect(mainGain);
    
    mainGain.connect(ctx.destination);

    const now = ctx.currentTime;
    const rate = pitchVariance;

    if (type === 'return') {
      filter.frequency.setValueAtTime(450 * rate, now);
      filter.Q.setValueAtTime(3, now);
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(150 * rate, now);
      oscGain.gain.setValueAtTime(0.5, now);
      oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

      mainGain.gain.setValueAtTime(0.6, now);
      mainGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      
      noiseSource.playbackRate.setValueAtTime(0.7 * rate, now);
      
      osc.start(now);
      noiseSource.start(now);
      osc.stop(now + 0.15);
      noiseSource.stop(now + 0.15);
    } else if (type === 'backspace') {
      filter.frequency.setValueAtTime(800 * rate, now);
      filter.Q.setValueAtTime(5, now);

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(280 * rate, now);
      oscGain.gain.setValueAtTime(0.3, now);
      oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

      mainGain.gain.setValueAtTime(0.4, now);
      mainGain.gain.exponentialRampToValueAtTime(0.01, now + 0.07);
      
      noiseSource.playbackRate.setValueAtTime(0.9 * rate, now);

      osc.start(now);
      noiseSource.start(now);
      osc.stop(now + 0.08);
      noiseSource.stop(now + 0.08);
    } else {
      filter.frequency.setValueAtTime(1400 * rate, now);
      filter.Q.setValueAtTime(4, now);

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(400 * rate, now);
      oscGain.gain.setValueAtTime(0.4, now);
      oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.04);

      mainGain.gain.setValueAtTime(0.5, now);
      mainGain.gain.exponentialRampToValueAtTime(0.01, now + 0.06);

      noiseSource.playbackRate.setValueAtTime(rate, now);

      osc.start(now);
      noiseSource.start(now);
      osc.stop(now + 0.07);
      noiseSource.stop(now + 0.07);
    }
  } catch (err) {
    console.error('Audio synthesis failed', err);
  }
};

export default function Editor({ theme, toggleTheme }: Props) {
  const { settings, updateSettings } = useSettings();
  const [searchParams] = useSearchParams();
  const entryId = searchParams.get('id');
  const bookId = searchParams.get('book_id');
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const content = blocks.map(b => b.text).join('\n');
  const [isSaving, setIsSaving] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [insight, setInsight] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingEntry, setIsLoadingEntry] = useState(Boolean(entryId));
  const navigate = useNavigate();
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  useEffect(() => {
    if (!entryId) {
      setIsLoadingEntry(false);
      return;
    }

    let cancelled = false;
    setIsLoadingEntry(true);
    fetchEntry(entryId)
      .then((entry) => {
        if (cancelled) return;
        if (entry.content_blocks?.length) {
          setBlocks(entry.content_blocks);
        } else if (entry.content) {
          setBlocks([{ id: uuidv4(), type: 'paragraph', text: entry.content, marks: [] }]);
        }
      })
      .catch(() => {
        if (!cancelled) setError('Could not load that entry.');
      })
      .finally(() => {
        if (!cancelled) setIsLoadingEntry(false);
      });

    return () => {
      cancelled = true;
    };
  }, [entryId]);

  const handleSave = useCallback(async () => {
    if (!content.trim() || isSaving) return;

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    setIsSaving(true);
    setError(null);
    try {
      const data = await saveEntry(
        {
          content,
          content_blocks: blocks,
          book_id: bookId ? Number(bookId) : undefined,
        },
        entryId
      );

      if (entryId) {
        navigate('/app');
        return;
      }

      setInsight(data.insight);
    } catch {
      setError('Could not save. Try again when you are ready.');
      setIsSaving(false);
    }
  }, [content, isListening, isSaving, blocks, bookId, entryId, navigate]);

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

  const handleGlobalKeyDown = (e: React.KeyboardEvent) => {
    if (!settings.typewriterMode) return;
    
    if (settings.typewriterSound) {
      let type: 'clack' | 'return' | 'backspace' = 'clack';
      if (e.key === 'Enter') {
        type = 'return';
      } else if (e.key === 'Backspace') {
        type = 'backspace';
      }

      const ignoreKeys = [
        'Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Escape', 
        'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 
        'Tab', 'Home', 'End', 'PageUp', 'PageDown'
      ];
      
      if (!ignoreKeys.includes(e.key)) {
        const pitch = 0.92 + Math.random() * 0.16;
        playTypewriterSound(type, pitch);
      }
    }
  };

  if (isLoadingEntry || (isSaving && !insight)) {
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
          <h2 className="overview-greeting">Entry saved.</h2>
          <p className="entry-written" style={{ marginTop: '1rem', color: 'var(--text-2)' }}>{content.length > 150 ? content.slice(0, 150) + '...' : content}</p>

          {observerNote && (
            <div className="ai-insight-card animate-up delay-1" style={{ marginTop: '2rem' }}>
              <div className="overview-section-header">
                <h3>✦ AI insight</h3>
              </div>
              <div className="insight-content">
                <div className="insight-label">OBSERVATION</div>
                <p className="insight-text">{observerNote}</p>
              </div>
            </div>
          )}

          {pastEntries.length > 0 && (
            <div className="mood-mirror-card animate-up delay-2" style={{ marginTop: '2rem' }}>
              <div className="overview-section-header">
                <h3>↺ Memory echoes</h3>
              </div>
              <div className="mood-list">
                {pastEntries.map((past: any, idx: number) => {
                  const echoDate = past.metadata?.created_at || past.created_at;
                  return (
                    <div key={idx} className="past-echo" style={{ padding: '1rem', background: 'var(--bg-3)', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border)' }}>
                      <p className="past-echo-label" style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                        {formatPastEchoLabel(echoDate)}
                      </p>
                      <p className="past-echo-text" style={{ fontSize: '0.85rem', color: 'var(--text-1)' }}>&ldquo;{past.content}&rdquo;</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="insight-actions" style={{ borderTop: 'none', display: 'flex', justifyContent: 'center' }}>
            <button
              type="button"
              className="editor-done"
              style={{ padding: '0.75rem 2rem', fontSize: '0.95rem' }}
              onClick={() => navigate('/app')}
            >
              Continue to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`editor-page ${settings.typewriterMode ? 'typewriter-mode-active' : ''}`}
      onKeyDown={handleGlobalKeyDown}
      style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}
    >
      <div className="editor-content" style={{ maxWidth: '900px', margin: '0 auto', width: '100%', padding: '0 1rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <div className="editor-chrome">
          <button
            type="button"
            className="editor-back"
            onClick={() => navigate('/app')}
            aria-label="Go back"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}>
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            Dashboard
          </button>
          <div className="editor-actions">
            {/* Typewriter Mode Toggle */}
            <button
              type="button"
              onClick={() => updateSettings({ typewriterMode: !settings.typewriterMode })}
              className={`chrome-btn ${settings.typewriterMode ? 'active' : ''}`}
              aria-label={settings.typewriterMode ? 'Disable Typewriter Mode' : 'Enable Typewriter Mode'}
              title="Typewriter Mode"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2" ry="2" />
                <line x1="6" y1="8" x2="6" y2="8" />
                <line x1="10" y1="8" x2="10" y2="8" />
                <line x1="14" y1="8" x2="14" y2="8" />
                <line x1="18" y1="8" x2="18" y2="8" />
                <line x1="6" y1="12" x2="6" y2="12" />
                <line x1="10" y1="12" x2="10" y2="12" />
                <line x1="14" y1="12" x2="14" y2="12" />
                <line x1="18" y1="12" x2="18" y2="12" />
                <line x1="7" y1="16" x2="17" y2="16" />
              </svg>
            </button>
            {/* Mute Toggle */}
            {settings.typewriterMode && (
              <button
                type="button"
                onClick={() => updateSettings({ typewriterSound: !settings.typewriterSound })}
                className="chrome-btn"
                aria-label={settings.typewriterSound ? 'Mute sounds' : 'Unmute sounds'}
                title={settings.typewriterSound ? 'Mute Sounds' : 'Unmute Sounds'}
              >
                {settings.typewriterSound ? (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                  </svg>
                ) : (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                    <line x1="23" y1="9" x2="17" y2="15" />
                    <line x1="17" y1="9" x2="23" y2="15" />
                  </svg>
                )}
              </button>
            )}
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
            typewriterMode={settings.typewriterMode}
          />
        </div>
      </div>
    </div>
  );
}
