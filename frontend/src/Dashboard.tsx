import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { fetchWithAuth, fetchSummaries, generateSummary } from './api';
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
import HistoryPane from "./HistoryPane.tsx";
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

export default function Dashboard({ theme, toggleTheme }: Props) {
  const [entries, setEntries] = useState<any[]>([]);
  const [summaries, setSummaries] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'journal' | 'chapters' | 'mirror' | 'manuscript' | 'settings' | 'history'>('journal');
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [suggestedTitle, setSuggestedTitle] = useState<string | null>(null);
  const [suggesting, setSuggesting] = useState(false);

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

  const navigate = useNavigate();

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
      const res = await fetchWithAuth('/entries/');
      if (res.ok) {
        setEntries(await res.json());
      }
      setSummaries(await fetchSummaries());
    } catch (err) {
      console.error('Error loading data:', err);
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('antigravity_token');
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
              onClick={() => setActiveTab('journal')}
              className={`ds-nav-item ${activeTab === 'journal' ? 'active' : ''}`}
            >
              Journal
            </button>
            <button
              onClick={() => setActiveTab('chapters')}
              className={`ds-nav-item ${activeTab === 'chapters' ? 'active' : ''}`}
            >
              Chapters
            </button>
            <button
              onClick={() => setActiveTab('mirror')}
              className={`ds-nav-item ${activeTab === 'mirror' ? 'active' : ''}`}
            >
              Patterns
            </button>
            <button
              onClick={() => setActiveTab('manuscript')}
              className={`ds-nav-item ${activeTab === 'manuscript' ? 'active' : ''}`}
            >
              Book
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`ds-nav-item ${activeTab === 'settings' ? 'active' : ''}`}
            >
              Settings
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`ds-nav-item ${activeTab === 'history' ? 'active' : ''}`}
            >
              History
            </button>
          </nav>
        </div>

        {activeTab === 'journal' && groupedEntries.length > 0 && (
          <>
            <div className="ds-divider" />
            <div className="ds-entry-list">
              {groupedEntries.map(({ label, entries: periodEntries }) => (
                <div key={label} style={{ marginBottom: '1rem' }}>
                  <div className="ds-entry-date" style={{ padding: '0 12px', marginBottom: '6px' }}>{label}</div>
                  {periodEntries.map(entry => (
                    <button
                      key={entry.id}
                      onClick={() => setSelectedEntryId(entry.id)}
                      className={`ds-entry-item ${selectedEntryId === entry.id ? 'active' : ''}`}
                    >
                      <div className="ds-entry-preview">{entry.content}</div>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </>
        )}
      </aside>

      {/* ───────────────── MAIN PANE ───────────────── */}
      <main className="ds-main">
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
          <button onClick={handleLogout} className="quiet-link muted">Sign out</button>
        </div>

        <div className="ds-content-inner animate-up">
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
                <p className="empty-state">No chapters yet.</p>
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

          {activeTab === 'history' && (
            <HistoryPane selectedEntryId={selectedEntryId} />
          )}

          {activeTab === 'manuscript' && (
            <div>
              <div className="manuscript-controls">
                <p className="chapter-compile-intro">
                  Bundle your entire journal chronologically into a beautifully typeset book. Ready to print or export as PDF.
                </p>
                <button type="button" onClick={() => window.print()} className="chapter-compile-btn">
                  ✦ Print / Export to PDF
                </button>
              </div>
              <div className="manuscript-preview print-area">
                <h1 className="manuscript-title">My Reflections</h1>
                {groupedEntries.map(({ label, entries: periodEntries }) => (
                  <div key={label} className="manuscript-chapter">
                    <h2 className="manuscript-chapter-title">{label}</h2>
                    <div className="manuscript-chapter-content">
                      {periodEntries.map(entry => (
                        <div key={entry.id} className="manuscript-entry">
                          <span className="manuscript-date">{formatEntryTime(entry.created_at)}: </span>
                          {entry.content}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="settings-panel">
              <section className="notebook-period">
                <h2 className="period-title">Typography</h2>
                <div className="settings-group">
                  <label className="settings-label">Font Style</label>
                  <select
                    className="settings-select"
                    value={settings.fontStyle}
                    onChange={(e) => updateSettings({ fontStyle: e.target.value as any })}
                  >
                    <option value="editorial">Editorial (Serif)</option>
                    <option value="typewriter">Typewriter (Monospace)</option>
                    <option value="sans">Modern (Sans-serif)</option>
                  </select>
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
