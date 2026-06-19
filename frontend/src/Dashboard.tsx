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
  const [activeTab, setActiveTab] = useState<'journal' | 'chapters' | 'mirror'>('journal');

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

  return (
    <div className="app-shell">
      {/* Header */}
      <header className="app-header animate-up">
        <Link to="/editor" className="app-wordmark">
          Reflect
        </Link>
        <div className="app-header-actions">
          <Link to="/editor" className="quiet-link">
            ✦ Write
          </Link>
          <button
            type="button"
            onClick={toggleTheme}
            className="theme-toggle-btn"
            aria-label="Toggle theme"
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>
          <button type="button" onClick={handleLogout} className="quiet-link muted">
            Sign out
          </button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="tabs-container animate-up delay-1">
        <button
          type="button"
          onClick={() => setActiveTab('journal')}
          className={`tab-btn ${activeTab === 'journal' ? 'active' : ''}`}
        >
          Journal
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('chapters')}
          className={`tab-btn ${activeTab === 'chapters' ? 'active' : ''}`}
        >
          Chapters
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('mirror')}
          className={`tab-btn ${activeTab === 'mirror' ? 'active' : ''}`}
        >
          Patterns
        </button>
      </nav>

      {/* Journal Tab */}
      {activeTab === 'journal' && (
        <div className="animate-up">
          {entries.length === 0 ? (
            <p className="empty-state">
              Nothing here yet.{' '}
              <Link to="/editor" className="quiet-link">
                Start writing →
              </Link>
            </p>
          ) : (
            groupedEntries.map(({ label, entries: periodEntries }) => (
              <section key={label} className="notebook-period">
                <h2 className="period-title">{label}</h2>
                {periodEntries.map((entry) => {
                  const observerNote = entry.insight ? buildObserverNote(entry.insight) : null;
                  const pastEntries = entry.insight?.relevant_past_entries ?? [];

                  return (
                    <article key={entry.id} className="notebook-entry">
                      <time className="entry-time">{formatEntryTime(entry.created_at)}</time>
                      <p className="entry-text">{entry.content}</p>

                      {observerNote && <p className="observer-note">{observerNote}</p>}

                      {pastEntries.map((past: any, idx: number) => {
                        const echoDate = past.metadata?.created_at || past.created_at;
                        return (
                          <div key={idx} className="past-echo">
                            <p className="past-echo-label">{formatPastEchoLabel(echoDate)}</p>
                            <p className="past-echo-text">&ldquo;{past.content}&rdquo;</p>
                          </div>
                        );
                      })}
                    </article>
                  );
                })}
              </section>
            ))
          )}
        </div>
      )}

      {/* Chapters Tab */}
      {activeTab === 'chapters' && (
        <div className="animate-up">
          <form onSubmit={handleCompileSummary} className="chapter-compile">
            <p className="chapter-compile-intro">
              Choose a span of time. An observer will read those entries and write a chapter of your life.
            </p>
            <div className="chapter-compile-fields">
              <input
                type="date"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
                aria-label="From"
                required
              />
              <span className="chapter-compile-sep">to</span>
              <input
                type="date"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
                aria-label="To"
                required
              />
              <select
                value={summaryType}
                onChange={(e) => setSummaryType(e.target.value as 'weekly' | 'monthly')}
                aria-label="Scope"
              >
                <option value="weekly">a week</option>
                <option value="monthly">a month</option>
              </select>
            </div>
            <button type="submit" disabled={isCompiling} className="chapter-compile-btn">
              {isCompiling ? (
                <>
                  <span style={{ display: 'inline-block', animation: 'breathe 1.5s infinite' }}>◌</span>
                  Writing…
                </>
              ) : (
                <>✦ Write chapter</>
              )}
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
                  {new Date(summary.period_start).toLocaleDateString(undefined, {
                    month: 'long',
                    day: 'numeric',
                  })}
                  {' — '}
                  {new Date(summary.period_end).toLocaleDateString(undefined, {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </h2>
                <div className="book-chapter-body">{summary.content}</div>
              </article>
            ))
          )}
        </div>
      )}

      {/* Patterns / Mirror Tab */}
      {activeTab === 'mirror' && (
        <div className="animate-up">
          <section className="mirror-section">
            <h2 className="mirror-section-title">What keeps showing up</h2>
            {Object.keys(patterns).length === 0 ? (
              <p className="mirror-empty">Keep writing. Patterns emerge slowly.</p>
            ) : (
              <ul className="mirror-list">
                {Object.entries(patterns).map(([name, count]) => (
                  <li key={name} className="mirror-list-item">
                    {describePatternOccurrence(name, count)}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="mirror-section">
            <h2 className="mirror-section-title">People and places</h2>
            {Object.keys(relationships).length === 0 ? (
              <p className="mirror-empty">
                Names and places from your entries will gather here over time.
              </p>
            ) : (
              <ul className="mirror-list">
                {Object.entries(relationships).map(([name, stats]) => (
                  <li key={name} className="mirror-list-item">
                    {describePersonPresence(name, stats)}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="mirror-section">
            <h2 className="mirror-section-title">Emotional weather</h2>
            {Object.keys(toneCounts).length === 0 ? (
              <p className="mirror-empty">Your moods will appear here as you write.</p>
            ) : (
              <ul className="mirror-list">
                {Object.entries(toneCounts).map(([tone, count]) => (
                  <li key={tone} className="mirror-list-item">
                    {describeTonePresence(tone, count)}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
