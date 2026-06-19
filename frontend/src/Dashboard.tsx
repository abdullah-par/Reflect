import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { fetchWithAuth, fetchSummaries, generateSummary, fetchBooks, fetchCurrentUser } from './api';
import { Theme } from './useTheme';
import {
  groupEntriesByPeriod,
  formatEntryTime,
  formatPastEchoLabel,
  buildObserverNote,
  describePatternOccurrence,
  describeTonePresence,
  describePersonPresence,
} from './utils/format';

import { Library, Book, Bookmark, Activity, BookOpen, Settings, Stethoscope } from 'lucide-react';
import DiagnosticsPane from "./DiagnosticsPane";
import LibraryPane from "./LibraryPane";
import MirrorPane from "./MirrorPane";
import { useSettings, FontStyle } from './useSettings';

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

const FONT_OPTIONS = [
  { value: 'editorial',    label: 'Crimson Text',    tag: 'editorial',  sample: 'Italic, warm. Classic diary feel.' },
  { value: 'lora',         label: 'Lora',            tag: 'literary',   sample: 'Balanced. Best for long entries.' },
  { value: 'playfair',     label: 'Playfair Display',tag: 'novel',      sample: 'High contrast. 19th-century diary.' },
  { value: 'baskerville',  label: 'Libre Baskerville',tag: 'paperback', sample: 'Neutral, highly legible.' },
  { value: 'merriweather', label: 'Merriweather',    tag: 'long-read',  sample: 'Comfortable at any length.' },
  { value: 'source-serif', label: 'Source Serif 4',  tag: 'editorial',  sample: 'Modern. Magazine quality.' },
  { value: 'typewriter',   label: 'Courier Prime',   tag: 'typewriter', sample: 'Raw draft energy.' },
  { value: 'sans',         label: 'Inter',           tag: 'modern',     sample: 'Minimal, distraction-free.' },
];

function getFontFamily(style: FontStyle): string {
  const map: Record<FontStyle, string> = {
    editorial:    "'Crimson Text', Georgia, serif",
    lora:         "'Lora', Georgia, serif",
    playfair:     "'Playfair Display', Georgia, serif",
    baskerville:  "'Libre Baskerville', Georgia, serif",
    merriweather: "'Merriweather', Georgia, serif",
    'source-serif': "'Source Serif 4', Georgia, serif",
    typewriter:   "'Courier Prime', 'Courier New', monospace",
    sans:         "'Inter', system-ui, sans-serif",
  };
  return map[style];
}

export default function Dashboard({ theme, toggleTheme }: Props) {
  const [entries, setEntries] = useState<any[]>([]);
  const [summaries, setSummaries] = useState<any[]>([]);
  const [books, setBooks] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'library' | 'journal' | 'chapters' | 'mirror' | 'manuscript' | 'settings' | 'history' | 'diagnostics'>('library');
  const [activeBookId, setActiveBookId] = useState<number | null>(null);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [suggestedTitle, setSuggestedTitle] = useState<string | null>(null);
  const [suggesting, setSuggesting] = useState(false);
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

  const handleSuggestTitle = async () => {
    if (!selectedEntryId) return;
    setSuggesting(true);
    try {
      const res = await fetchWithAuth(`/entries/${selectedEntryId}/suggest-title`);
      if (res.ok) {
        const data = await res.json();
        setSuggestedTitle(data.suggested_title);
      } else {
        console.error('Failed to suggest title');
      }
    } catch (err) {
      console.error('Error suggesting title', err);
    } finally {
      setSuggesting(false);
    }
  };

  const applySuggestedTitle = () => {
    // Optionally, you could send an update to backend. For now, just update UI.
    // Assuming selectedEntry has a title field, we could set it via state.
    // This placeholder demonstrates UI overwrite.
    // In a real app, you would call an update endpoint.
    // Here we just log.
    console.log('Applying suggested title:', suggestedTitle);
  };

  const [periodStart, setPeriodStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [periodEnd, setPeriodEnd] = useState(() => new Date().toISOString().split('T')[0]);
  const [summaryType, setSummaryType] = useState<'weekly' | 'monthly'>('weekly');
  const [isCompiling, setIsCompiling] = useState(false);
  const [compileMessage, setCompileMessage] = useState<string | null>(null);
  const [compileError, setCompileError] = useState<string | null>(null);
  const [isIndexOpen, setIsIndexOpen] = useState(false);

  // Book Builder State
  const [bookTitle, setBookTitle] = useState('My Reflections');
  const [bookAuthor, setBookAuthor] = useState('');
  const [coverStyle, setCoverStyle] = useState<'leather' | 'linen' | 'typewriter'>('leather');
  const [includeNotes, setIncludeNotes] = useState(true);
  const [includeEchoes, setIncludeEchoes] = useState(true);

  const navigate = useNavigate();
  const { settings, updateSettings } = useSettings();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (activeTab === 'journal' && entries.length > 0 && !selectedEntryId) {
      setSelectedEntryId(entries[0].id);
    }
  }, [activeTab, entries, selectedEntryId]);

  async function loadData() {
    try {
      fetchCurrentUser().then(setUser).catch(() => {});
      const resBooks = await fetchBooks();
      setBooks(resBooks);
      if (resBooks.length > 0 && !activeBookId) {
        setActiveBookId(resBooks[0].id);
      }
      setSummaries(await fetchSummaries());
    } catch (err) {
      console.error('Error loading data:', err);
    }
  }

  useEffect(() => {
    if (activeBookId) {
      fetchWithAuth(`/entries/?book_id=${activeBookId}`)
        .then(res => res.json())
        .then(data => {
          setEntries(data);
          if (data.length > 0 && !selectedEntryId) {
            setSelectedEntryId(data[0].id);
          }
        })
        .catch(err => console.error('Error loading entries:', err));
    }
  }, [activeBookId]);

  const handleLogout = () => {
    localStorage.removeItem('reflect_token');
    navigate('/');
  };


  const handleCompileSummary = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCompiling(true);
    setCompileMessage(null);
    setCompileError(null);
    try {
      const startIso = new Date(periodStart + 'T00:00:00').toISOString();
      const endIso = new Date(periodEnd + 'T23:59:59').toISOString();
      const newSummary = await generateSummary(startIso, endIso, summaryType);
      setSummaries((prev) => [newSummary, ...prev]);
      setCompileMessage('Your chapter is ready.');
    } catch (err: any) {
      setCompileError(err.message || 'Could not write that chapter. Try a different range.');
    } finally {
      setIsCompiling(false);
    }
  };

  const getAggregateInsights = () => {
    const relationships: Record<string, { positive: number; negative: number; neutral: number }> = {};
    const patterns: Record<string, number> = {};
    const toneCounts: Record<string, number> = {};

    entries.forEach((entry) => {
      if (!entry.insight) return;
      const ins = entry.insight;
      if (ins.pattern_name && ins.pattern_name !== 'Unknown' && ins.pattern_name !== 'Analysis Pending') {
        patterns[ins.pattern_name] = (patterns[ins.pattern_name] || 0) + 1;
      }
      if (ins.emotional_tone && ins.emotional_tone !== 'Unknown') {
        toneCounts[ins.emotional_tone] = (toneCounts[ins.emotional_tone] || 0) + 1;
      }
      if (ins.relationships_tracked) {
        Object.entries(ins.relationships_tracked).forEach(([name, impact]: [string, any]) => {
          if (!relationships[name]) {
            relationships[name] = { positive: 0, negative: 0, neutral: 0 };
          }
          if (impact === 'positive') relationships[name].positive += 1;
          else if (impact === 'negative') relationships[name].negative += 1;
          else relationships[name].neutral += 1;
        });
      }
    });

    return { relationships, patterns, toneCounts };
  };

  const { relationships, patterns, toneCounts } = getAggregateInsights();
  const groupedEntries = groupEntriesByPeriod(entries);

  const selectedEntry = entries.find(e => e.id === selectedEntryId) || entries[0];
  const observerNote = selectedEntry?.insight ? buildObserverNote(selectedEntry.insight) : null;
  const pastEchoes = selectedEntry?.insight?.relevant_past_entries ?? [];

  return (
    <div className="ds-split">
      {/* ───────────────── SIDEBAR ───────────────── */}
      <aside className="ds-sidebar">
        <div className="ds-sidebar-header">
          <Link to="/" className="ds-logo">Reflect</Link>
          <nav className="ds-nav">
            <button
              onClick={() => setActiveTab('library')}
              className={`ds-nav-item ${activeTab === 'library' ? 'active' : ''}`}
            >
              <Library size={16} /> Library
            </button>
            <button
              onClick={() => {
                setActiveTab('journal');
                if (activeTab === 'journal') setIsIndexOpen(!isIndexOpen);
              }}
              className={`ds-nav-item ${activeTab === 'journal' ? 'active' : ''}`}
            >
              <Book size={16} /> Journal
            </button>
            <button
              onClick={() => setActiveTab('chapters')}
              className={`ds-nav-item ${activeTab === 'chapters' ? 'active' : ''}`}
            >
              <Bookmark size={16} /> Chapters
            </button>
            <button
              onClick={() => setActiveTab('mirror')}
              className={`ds-nav-item ${activeTab === 'mirror' ? 'active' : ''}`}
            >
              <Activity size={16} /> Patterns
            </button>
            <button
              onClick={() => setActiveTab('manuscript')}
              className={`ds-nav-item ${activeTab === 'manuscript' ? 'active' : ''}`}
            >
              <BookOpen size={16} /> Book
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`ds-nav-item ${activeTab === 'settings' ? 'active' : ''}`}
            >
              <Settings size={16} /> Settings
            </button>

            <button
              onClick={() => setActiveTab('diagnostics')}
              className={`ds-nav-item ${activeTab === 'diagnostics' ? 'active' : ''}`}
              disabled={!selectedEntryId}
            >
              <Stethoscope size={16} /> Diagnostics
            </button>
          </nav>
        </div>
      </aside>

      {/* ───────────────── MAIN PANE ───────────────── */}
      <main className="ds-main">
        {/* Index Drawer Overlay */}
        <div className={`ds-index-drawer ${isIndexOpen && activeTab === 'journal' ? 'open' : ''}`}>
          <button className="ds-index-close" onClick={() => setIsIndexOpen(false)} aria-label="Close index">
            ✕
          </button>
          <h2 className="ds-index-title">Index</h2>
          {groupedEntries.length > 0 ? (
            <div className="ds-entry-list" style={{ padding: 0 }}>
              {groupedEntries.map(({ label, entries: periodEntries }) => (
                <div key={label} style={{ marginBottom: '1rem' }}>
                  <div className="ds-entry-date" style={{ padding: '0 12px', marginBottom: '6px', fontFamily: 'var(--font-ui)' }}>{label}</div>
                  {periodEntries.map(entry => (
                    <button
                      key={entry.id}
                      onClick={() => {
                        setSelectedEntryId(entry.id);
                        setIsIndexOpen(false); // Close on selection for mobile-friendly flow
                      }}
                      className={`ds-entry-item ${selectedEntryId === entry.id ? 'active' : ''}`}
                      style={{ padding: '8px 12px' }}
                    >
                      <div className="ds-entry-preview" style={{ fontFamily: 'var(--font-head)', fontSize: '1rem' }}>{entry.content}</div>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <p className="ds-empty-state" style={{ height: 'auto', marginTop: '2rem' }}>No entries yet.</p>
          )}
        </div>

        {/* Top Right Controls */}
        <div style={{ position: 'absolute', top: '1.5rem', right: '2rem', display: 'flex', gap: '1rem', alignItems: 'center', zIndex: 10 }}>
          <button
            type="button"
            onClick={toggleTheme}
            className="theme-toggle-btn"
            style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-2)' }}
          >
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>
          <Link to="/editor" className="quiet-link">✦ Write</Link>
          
          {user && (
            <div style={{ position: 'relative' }}>
              <button 
                onClick={() => setAccountMenuOpen(!accountMenuOpen)}
                style={{ 
                  width: '32px', height: '32px', borderRadius: 'var(--radius-full)',
                  background: 'var(--accent-2)', color: 'white', border: 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 'bold', cursor: 'pointer', boxShadow: 'var(--shadow-sm)'
                }}
              >
                {user.email.charAt(0).toUpperCase()}
              </button>
              
              {accountMenuOpen && (
                <div style={{
                  position: 'absolute', top: '100%', right: 0, marginTop: '8px',
                  background: 'var(--bg-2)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)', boxShadow: 'var(--shadow-lg)',
                  padding: '8px', minWidth: '150px', zIndex: 100
                }}>
                  <div style={{ padding: '8px', fontSize: '0.85rem', color: 'var(--text-2)', borderBottom: '1px solid var(--border)', marginBottom: '4px', wordBreak: 'break-all' }}>
                    {user.email}
                  </div>
                  <button onClick={handleLogout} style={{ width: '100%', textAlign: 'left', padding: '8px', background: 'transparent', border: 'none', color: 'var(--text-1)', cursor: 'pointer', borderRadius: 'var(--radius-xs)' }}>
                    Sign out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="ds-content-inner animate-up">
          {activeTab === 'library' && (
            <LibraryPane books={books} onSelectBook={(id) => {
              setActiveBookId(id);
              setActiveTab('journal');
            }} onBooksChanged={loadData} />
          )}

          {activeTab === 'journal' && (
            entries.length === 0 ? (
              <div className="ds-empty-state">
                <p>Nothing here yet.</p>
                <Link to="/editor" className="quiet-link" style={{ marginTop: '1rem' }}>Start writing →</Link>
              </div>
            ) : selectedEntry ? (
              <article>
                <div className="ds-entry-header">
                  {selectedEntry.title && <h2 className="ds-entry-title">{selectedEntry.title}</h2>}
                  <div className="ds-entry-date-large">{formatEntryTime(selectedEntry.created_at)}</div>
                </div>
                
                <div className="ds-entry-text">{selectedEntry.content}</div>

                <button onClick={handleSuggestTitle} disabled={suggesting} className="suggest-title-btn">
                  {suggesting ? 'Suggesting…' : 'Suggest Title'}
                </button>
                {suggestedTitle && (
                  <div className="suggested-title">
                    Suggested: <span className="clickable" onClick={applySuggestedTitle}>{suggestedTitle}</span>
                  </div>
                )}

                {settings.enableObserverNotes && observerNote && (
                  <div className="observer-note">
                    <div className="lp-mock-insight-label">Reflect Noticed</div>
                    {observerNote}
                  </div>
                )}

                {settings.enableMemoryEcho && pastEchoes.length > 0 && (
                  <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {pastEchoes.map((past: any, idx: number) => {
                      const echoDate = past.metadata?.created_at || past.created_at;
                      return (
                        <div key={idx} className="past-echo">
                          <p className="past-echo-label">{formatPastEchoLabel(echoDate)}</p>
                          <p className="past-echo-text">&ldquo;{past.content}&rdquo;</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </article>
            ) : null
          )}

          {activeTab === 'chapters' && (
            <div>
              <form onSubmit={handleCompileSummary} className="chapter-compile">
                <p className="chapter-compile-intro">
                  Choose a span of time. An observer will read those entries and write a chapter of your life.
                </p>
                <div className="chapter-compile-fields">
                  <input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} required />
                  <span className="chapter-compile-sep">to</span>
                  <input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} required />
                  <select value={summaryType} onChange={(e) => setSummaryType(e.target.value as 'weekly' | 'monthly')}>
                    <option value="weekly">a week</option>
                    <option value="monthly">a month</option>
                  </select>
                </div>
                <button type="submit" disabled={isCompiling} className="chapter-compile-btn">
                  {isCompiling ? 'Writing…' : '✦ Write chapter'}
                </button>
                {compileMessage && <p className="quiet-success">{compileMessage}</p>}
                {compileError && <p className="quiet-error">{compileError}</p>}
              </form>

              {summaries.length === 0 ? (
                <div className="ds-empty-state">
                  <p>No chapters yet.</p>
                  <button 
                    onClick={() => {
                      const startInput = document.querySelector('input[type="date"]');
                      if (startInput) (startInput as HTMLElement).focus();
                    }} 
                    className="quiet-link" 
                    style={{ marginTop: '1rem', cursor: 'pointer', background: 'transparent', border: 'none' }}
                  >
                    Select a date range above to compile one →
                  </button>
                </div>
              ) : (
                summaries.map((summary) => (
                  <article key={summary.id} className="book-chapter animate-up">
                    <h2 className="book-chapter-title">
                      {new Date(summary.period_start).toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}
                      {' to '}
                      {new Date(summary.period_end).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                    </h2>
                    <div className="book-chapter-body">{summary.content}</div>
                  </article>
                ))
              )}
            </div>
          )}

           {activeTab === 'mirror' && (
             <div className="ds-content-inner animate-up">
               <MirrorPane relationships={relationships} patterns={patterns} toneCounts={toneCounts} />
             </div>
           )}

           {activeTab === 'diagnostics' && selectedEntryId && (
             <DiagnosticsPane entryId={selectedEntryId} />
           )}

          {activeTab === 'manuscript' && (
            <div className="book-builder-split">
              <div className="book-settings-panel">
                <h2 className="period-title">Book Customization</h2>
                
                <div className="settings-group">
                  <label className="settings-label">Title
                    <input type="text" value={bookTitle} onChange={e => setBookTitle(e.target.value)} className="settings-input" />
                  </label>
                  <label className="settings-label" style={{marginTop: '1rem'}}>Author
                    <input type="text" value={bookAuthor} onChange={e => setBookAuthor(e.target.value)} className="settings-input" />
                  </label>
                </div>

                <div className="settings-group" style={{marginTop: '2rem'}}>
                  <h3 className="settings-subtitle">Cover Style</h3>
                  <div className="cover-style-options">
                    <button className={`cover-option ${coverStyle === 'leather' ? 'active' : ''}`} onClick={() => setCoverStyle('leather')}>Leather</button>
                    <button className={`cover-option ${coverStyle === 'linen' ? 'active' : ''}`} onClick={() => setCoverStyle('linen')}>Linen</button>
                    <button className={`cover-option ${coverStyle === 'typewriter' ? 'active' : ''}`} onClick={() => setCoverStyle('typewriter')}>Typewriter</button>
                  </div>
                </div>

                <div className="settings-group" style={{marginTop: '2rem'}}>
                  <h3 className="settings-subtitle">Content</h3>
                  <label className="settings-toggle">
                    <input type="checkbox" checked={includeNotes} onChange={e => setIncludeNotes(e.target.checked)} />
                    <span className="settings-toggle-text">Include AI Observer Notes</span>
                  </label>
                  <label className="settings-toggle">
                    <input type="checkbox" checked={includeEchoes} onChange={e => setIncludeEchoes(e.target.checked)} />
                    <span className="settings-toggle-text">Include Memory Echoes</span>
                  </label>
                </div>

                <button type="button" onClick={() => window.print()} className="chapter-compile-btn" style={{marginTop: '3rem'}}>
                  ✦ Print / Export to PDF
                </button>
              </div>

              <div className="book-preview-pane">
                <div className="book-preview-wrapper">
                  <div className={`book-cover-preview cover-${coverStyle}`}>
                    <h1 className="book-cover-title">{bookTitle}</h1>
                    {bookAuthor && <h2 className="book-cover-author">{bookAuthor}</h2>}
                  </div>
                  
                  <div className="manuscript-preview print-area">
                    <div className="print-cover-page">
                      <h1 className="manuscript-title">{bookTitle}</h1>
                      {bookAuthor && <p style={{textAlign: 'center', marginBottom: '4rem'}}>by {bookAuthor}</p>}
                    </div>
                    {groupedEntries.map(({ label, entries: periodEntries }) => (
                      <div key={label} className="manuscript-chapter">
                        <h2 className="manuscript-chapter-title">{label}</h2>
                        <div className="manuscript-chapter-content">
                          {periodEntries.map(entry => (
                            <div key={entry.id} className="manuscript-entry">
                              <span className="manuscript-date">{formatEntryTime(entry.created_at)}: </span>
                              {entry.content}
                              {includeNotes && entry.insight && <div className="print-insight" style={{marginTop: '8px', fontSize: '0.9em', color: 'var(--text-2)', fontStyle: 'italic'}}><b>Reflect Noticed:</b> {buildObserverNote(entry.insight)}</div>}
                              {includeEchoes && entry.insight?.relevant_past_entries?.length > 0 && (
                                <div className="print-echoes" style={{marginTop: '8px', fontSize: '0.9em', color: 'var(--text-3)'}}>
                                  {entry.insight.relevant_past_entries.map((past: any, idx: number) => (
                                    <p key={idx}><i>Echo ({formatPastEchoLabel(past.metadata?.created_at || past.created_at)}):</i> {past.content}</p>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="settings-panel">
              <section className="notebook-period typography-settings">
                <h2 className="period-title">Typography</h2>
                
                <div className="font-picker">
                  {FONT_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      className={`font-option ${settings.fontStyle === opt.value ? 'active' : ''}`}
                      onClick={() => updateSettings({ fontStyle: opt.value as FontStyle })}
                      style={{ fontFamily: getFontFamily(opt.value as FontStyle) }}
                    >
                      <span className="font-option-name">{opt.label}</span>
                      <span className="font-option-tag">{opt.tag}</span>
                      <span className="font-option-sample">{opt.sample}</span>
                    </button>
                  ))}
                </div>

                <label className="settings-slider-row">Size
                  <input type="range" min={14} max={22} step={1}
                    value={settings.fontSize}
                    onChange={e => updateSettings({ fontSize: Number(e.target.value) })}
                    style={{ flex: 1, margin: '0 1rem' }} />
                  <span className="settings-slider-value">{settings.fontSize}px</span>
                </label>

                <label className="settings-slider-row" style={{marginTop: '0.5rem'}}>Line height
                  <input type="range" min={1.4} max={2.2} step={0.1}
                    value={settings.lineHeight}
                    onChange={e => updateSettings({ lineHeight: Number(e.target.value) })}
                    style={{ flex: 1, margin: '0 1rem' }} />
                  <span className="settings-slider-value">{settings.lineHeight}</span>
                </label>

                <div className="settings-preview"
                  style={{ fontFamily: 'var(--font-body)',
                           fontSize: settings.fontSize,
                           lineHeight: settings.lineHeight,
                           marginTop: '2rem' }}>
                  I wrote this at midnight, unsure of everything
                  but the pen moving across the page.
                </div>
              </section>
              
              <section className="notebook-period" style={{ marginTop: '3rem' }}>
                <h2 className="period-title">AI Preferences</h2>
                <div className="settings-group">
                  <label className="settings-toggle">
                    <input type="checkbox" checked={settings.enableObserverNotes} onChange={(e) => updateSettings({ enableObserverNotes: e.target.checked })} />
                    <span className="settings-toggle-text">Show Observer Notes after entries</span>
                  </label>
                  <label className="settings-toggle">
                    <input type="checkbox" checked={settings.enableMemoryEcho} onChange={(e) => updateSettings({ enableMemoryEcho: e.target.checked })} />
                    <span className="settings-toggle-text">Show Memory Echoes (Semantic past matches)</span>
                  </label>
                  <label className="settings-toggle">
                    <input type="checkbox" checked={settings.enablePatterns} onChange={(e) => updateSettings({ enablePatterns: e.target.checked })} />
                    <span className="settings-toggle-text">Track emotional & behavioral patterns</span>
                  </label>
                </div>
                <p className="quiet-error" style={{ marginTop: '1rem', fontSize: '0.85rem' }}>
                  Note: Disabling these hides them from the UI to provide a quieter writing experience.
                </p>
              </section>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
