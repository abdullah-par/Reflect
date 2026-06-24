import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { fetchWithAuth, fetchSummaries, generateSummary, fetchBooks, fetchCurrentUser, fetchEntries, createBook } from './api';
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

import {
  Activity,
  Book,
  BookOpen,
  Bookmark,
  ChevronRight,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Search,
  Settings,
  Stethoscope,
} from 'lucide-react';
import DiagnosticsPane from "./DiagnosticsPane";
import LibraryPane from "./LibraryPane";
import MirrorPane from "./MirrorPane";
import OverviewPane from "./OverviewPane";
import { useSettings } from './useSettings';

interface Props {
  theme: Theme;
  toggleTheme: () => void;
}

type SidebarBook = {
  id: number;
  title: string;
  cover_image_url?: string;
  created_at: string;
};

type SidebarEntry = {
  id: number | string;
  title?: string | null;
  content?: string | null;
  created_at: string;
};

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

export default function Dashboard({ theme, toggleTheme }: Props) {
  const [entries, setEntries] = useState<any[]>([]);
  const [summaries, setSummaries] = useState<any[]>([]);
  const [books, setBooks] = useState<SidebarBook[]>([]);
  const [entriesByBook, setEntriesByBook] = useState<Record<number, SidebarEntry[]>>({});
  const [activeTab, setActiveTab] = useState<'journal' | 'chapters' | 'patterns'>('journal');
  const [activeBookId, setActiveBookId] = useState<number | null>(null);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [suggestedTitle, setSuggestedTitle] = useState<string | null>(null);
  const [suggesting, setSuggesting] = useState(false);
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem('reflect_sidebar_collapsed') === 'true');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 760px)').matches);
  const [expandedBooks, setExpandedBooks] = useState<Set<number>>(() => new Set());
  const [treeFilter, setTreeFilter] = useState('');

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
    localStorage.setItem('reflect_sidebar_collapsed', String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 760px)');
    const syncMobile = () => setIsMobile(media.matches);
    syncMobile();
    media.addEventListener('change', syncMobile);
    return () => media.removeEventListener('change', syncMobile);
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
      const bookEntryPairs = await Promise.all(
        resBooks.map(async (book: SidebarBook) => [book.id, await fetchEntries(book.id)] as const)
      );
      const nextEntriesByBook = Object.fromEntries(bookEntryPairs);
      setEntriesByBook(nextEntriesByBook);
      setExpandedBooks((prev) => {
        if (prev.size > 0 || resBooks.length === 0) return prev;
        return new Set([resBooks[0].id]);
      });
      if (resBooks.length > 0 && !activeBookId) {
        setActiveBookId(resBooks[0].id);
        setEntries(nextEntriesByBook[resBooks[0].id] || []);
      }
      setSummaries(await fetchSummaries());
    } catch (err) {
      console.error('Error loading data:', err);
    }
  }

  useEffect(() => {
    if (activeBookId) {
      const bookEntries = entriesByBook[activeBookId] || [];
      setEntries(bookEntries);
      if (bookEntries.length > 0 && !bookEntries.some(entry => String(entry.id) === String(selectedEntryId))) {
        setSelectedEntryId(String(bookEntries[0].id));
      }
    }
  }, [activeBookId, entriesByBook, selectedEntryId]);

  const handleLogout = () => {
    localStorage.removeItem('reflect_token');
    navigate('/');
  };

  const closeMobileSidebar = () => setMobileSidebarOpen(false);

  const toggleBookExpanded = (bookId: number) => {
    setExpandedBooks((prev) => {
      const next = new Set(prev);
      if (next.has(bookId)) next.delete(bookId);
      else next.add(bookId);
      return next;
    });
  };

  const handleBookSelect = (bookId: number) => {
    setActiveBookId(bookId);
    setActiveTab('journal');
    closeMobileSidebar();
  };

  const handleEntrySelect = (entryId: string | number, bookId: number) => {
    setActiveBookId(bookId);
    setSelectedEntryId(String(entryId));
    closeMobileSidebar();
    navigate(`/editor?id=${entryId}`);
  };

  const handleCreateEntry = (bookId: number) => {
    closeMobileSidebar();
    navigate(`/editor?book_id=${bookId}`);
  };

  const handleCreateBook = async () => {
    try {
      const book = await createBook('Untitled Journal');
      await loadData();
      setActiveBookId(book.id);
      setActiveTab('journal');
      setExpandedBooks((prev) => new Set(prev).add(book.id));
      closeMobileSidebar();
    } catch (err) {
      console.error('Error creating journal:', err);
    }
  };

  const getEntryTitle = (entry: SidebarEntry) => {
    const title = entry.title?.trim() || entry.content?.trim() || 'Untitled';
    return title.length > 48 ? `${title.slice(0, 48)}...` : title;
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
  const visibleBooks = books
    .map((book) => ({
      ...book,
      entries: entriesByBook[book.id] || [],
    }))
    .filter((book) => {
      const q = treeFilter.trim().toLowerCase();
      if (!q) return true;
      return (
        book.title.toLowerCase().includes(q) ||
        book.entries.some((entry) => getEntryTitle(entry).toLowerCase().includes(q))
      );
    });

  const selectedEntry = entries.find(e => String(e.id) === String(selectedEntryId)) || entries[0];
  const observerNote = selectedEntry?.insight ? buildObserverNote(selectedEntry.insight) : null;
  const pastEchoes = selectedEntry?.insight?.relevant_past_entries ?? [];

  return (
    <div className={`ds-split ${sidebarCollapsed ? 'sidebar-collapsed' : ''} ${mobileSidebarOpen ? 'sidebar-open' : ''}`}>
      {isMobile && mobileSidebarOpen && <button className="ds-sidebar-scrim" onClick={closeMobileSidebar} aria-label="Close sidebar" />}
      {/* ───────────────── SIDEBAR ───────────────── */}
      <aside className="ds-sidebar">
        <Link to="/" className="ds-brand-link" onClick={closeMobileSidebar}>Reflect</Link>
        <nav className="ds-sidebar-nav">
          <div className="ds-sidebar-group">
            <button onClick={() => { setActiveTab('journal'); closeMobileSidebar(); }} className={`ds-tree-row ${activeTab === 'journal' ? 'active' : ''}`}>
              <span className="ds-row-label">Journal</span>
            </button>
            <button onClick={() => { setActiveTab('chapters'); closeMobileSidebar(); }} className={`ds-tree-row ${activeTab === 'chapters' ? 'active' : ''}`}>
              <span className="ds-row-label">Chapters</span>
            </button>
            <button onClick={() => { setActiveTab('patterns'); closeMobileSidebar(); }} className={`ds-tree-row ${activeTab === 'patterns' ? 'active' : ''}`}>
              <span className="ds-row-label">Patterns</span>
            </button>
          </div>

          <div className="ds-divider"></div>

          {groupedEntries.length > 0 ? (
            <div className="ds-entry-list">
              {groupedEntries.map(({ label, entries: periodEntries }) => (
                <div key={label} style={{ marginBottom: '1.25rem' }}>
                  <div className="ds-entry-date">{label}</div>
                  {periodEntries.map(entry => (
                    <button
                      key={entry.id}
                      onClick={() => {
                        setSelectedEntryId(String(entry.id));
                      }}
                      className={`ds-entry-item ${selectedEntryId === String(entry.id) ? 'active' : ''}`}
                    >
                      <div className="ds-entry-preview">{getEntryTitle(entry)}</div>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <p className="ds-empty-state" style={{ padding: '0 1.25rem' }}>No entries yet.</p>
          )}
        </nav>

        <div className="ds-sidebar-bottom-profile">
          <div className="ds-account-wrap">
            <button type="button" onClick={() => setAccountMenuOpen(!accountMenuOpen)} className="ds-account-button" aria-label="Account menu">
              <span className="ds-avatar">{user?.email.charAt(0).toUpperCase() || 'R'}</span>
              <div className="ds-account-info">
                <span className="ds-account-name">{user?.email.split('@')[0] || 'Reflect User'}</span>
                <span className="ds-account-email">{user?.email || 'user@reflect.com'}</span>
              </div>
            </button>
            {accountMenuOpen && (
              <div className="ds-account-menu" style={{ bottom: '100%', top: 'auto', marginBottom: '8px' }}>
                <button type="button" onClick={handleLogout}>Sign out</button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ───────────────── MAIN PANE ───────────────── */}
      <main className="ds-main">


        {/* Top Right Controls */}
        <div style={{ position: 'absolute', top: '1.5rem', right: '2rem', display: 'flex', gap: '1rem', alignItems: 'center', zIndex: 10 }}>
          {isMobile && (
            <button type="button" onClick={() => setMobileSidebarOpen(true)} className="theme-toggle-btn" aria-label="Open sidebar">
              <Menu size={16} />
            </button>
          )}
          <button
            type="button"
            onClick={toggleTheme}
            className="theme-toggle-btn"
            style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-2)' }}
          >
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>
          <Link to="/editor" className="quiet-link">✦ Write</Link>
          
        </div>

        <div className="ds-content-inner animate-up">
          {activeTab === 'overview' && (
            <OverviewPane 
              user={user} 
              entriesByBook={entriesByBook} 
              patterns={patterns} 
              toneCounts={toneCounts} 
              onEntrySelect={(entryId, bookId) => {
                setActiveTab('journal');
                handleEntrySelect(entryId, bookId);
              }}
            />
          )}

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
                  <div className="ds-entry-date-large">{formatEntryTime(selectedEntry.created_at)}</div>
                </div>
                
                <div className="ds-entry-text">{selectedEntry.content}</div>

                {settings.enableObserverNotes && observerNote && (
                  <div className="observer-note-card">
                    <div className="observer-note-label">REFLECT NOTICED</div>
                    <div className="observer-note-content">{observerNote}</div>
                  </div>
                )}

                {settings.enableMemoryEcho && pastEchoes.length > 0 && (
                  <div className="past-echo-container">
                    {pastEchoes.map((past: any, idx: number) => {
                      const echoDate = past.metadata?.created_at || past.created_at;
                      return (
                        <div key={idx} className="past-echo-block">
                          <div className="past-echo-label">{formatPastEchoLabel(echoDate)}</div>
                          <div className="past-echo-text">"{past.content}"</div>
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
              <section className="notebook-period">
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
