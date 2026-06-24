import React from 'react';
import { formatEntryTime } from './utils/format';
import { Link } from 'react-router-dom';

interface OverviewPaneProps {
  user: { email: string } | null;
  entriesByBook: Record<number, any[]>;
  patterns: Record<string, number>;
  toneCounts: Record<string, number>;
  onEntrySelect: (entryId: string | number, bookId: number) => void;
}

export default function OverviewPane({ user, entriesByBook, patterns, toneCounts, onEntrySelect }: OverviewPaneProps) {
  const allEntries = Object.values(entriesByBook).flat().sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const totalEntries = allEntries.length;
  const numJournals = Object.keys(entriesByBook).length;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };
  
  const name = user?.email ? user.email.split('@')[0] : 'Writer';
  const capitalizedName = name.charAt(0).toUpperCase() + name.slice(1);

  // Dominant Mood
  let dominantMood = 'None';
  let maxMoodCount = 0;
  Object.entries(toneCounts).forEach(([mood, count]) => {
    if (count > maxMoodCount) {
      maxMoodCount = count;
      dominantMood = mood;
    }
  });

  // Top Pattern
  let topPattern = 'None';
  let maxPatternCount = 0;
  Object.entries(patterns).forEach(([pattern, count]) => {
    if (count > maxPatternCount) {
      maxPatternCount = count;
      topPattern = pattern;
    }
  });

  // Mood Mirror array
  const moodMirrorData = Object.entries(toneCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([mood, count]) => ({ mood, count }));

  // Writing streak logic (basic)
  let streak = 0;
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  const dates = [...new Set(allEntries.map(e => {
    const d = new Date(e.created_at);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }))].sort((a, b) => b - a);

  let checkDate = new Date(currentDate);
  if (dates.length > 0 && dates[0] === checkDate.getTime()) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
      for (let i = 1; i < dates.length; i++) {
          if (dates[i] === checkDate.getTime()) {
              streak++;
              checkDate.setDate(checkDate.getDate() - 1);
          } else {
              break;
          }
      }
  } else {
    // maybe check if they wrote yesterday
    checkDate.setDate(checkDate.getDate() - 1);
    if (dates.length > 0 && dates[0] === checkDate.getTime()) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
        for (let i = 1; i < dates.length; i++) {
            if (dates[i] === checkDate.getTime()) {
                streak++;
                checkDate.setDate(checkDate.getDate() - 1);
            } else {
                break;
            }
        }
    }
  }

  const recentEntries = allEntries.slice(0, 3);

  return (
    <div className="overview-pane">
      <div className="overview-header">
        <h1 className="overview-greeting">{getGreeting()}, {capitalizedName}</h1>
      </div>

      <div className="overview-metrics">
        <div className="metric-card">
          <div className="metric-icon">↻</div>
          <div className="metric-title">Writing streak</div>
          <div className="metric-value">{streak}</div>
          <div className="metric-sub">days in a row</div>
        </div>
        <div className="metric-card">
          <div className="metric-icon">📄</div>
          <div className="metric-title">Total entries</div>
          <div className="metric-value">{totalEntries}</div>
          <div className="metric-sub">across {numJournals} journal{numJournals !== 1 ? 's' : ''}</div>
        </div>
        <div className="metric-card">
          <div className="metric-icon">☺</div>
          <div className="metric-title">Dominant mood</div>
          <div className="metric-pill mood-pill mt-auto">{dominantMood}</div>
          <div className="metric-sub">overall</div>
        </div>
        <div className="metric-card">
          <div className="metric-icon">⤨</div>
          <div className="metric-title">Top pattern</div>
          <div className="metric-pill pattern-pill mt-auto">{topPattern}</div>
          <div className="metric-sub">seen {maxPatternCount} times</div>
        </div>
      </div>

      <div className="overview-grid">
        <div className="overview-recent">
          <div className="overview-section-header">
            <h3>🕒 Recent entries</h3>
            <span className="view-all">View all →</span>
          </div>
          <div className="recent-entries-list">
            {recentEntries.map(entry => {
              const date = new Date(entry.created_at);
              const day = date.getDate();
              const month = date.toLocaleString('default', { month: 'short' }).toUpperCase();
              
              const title = entry.title?.trim() || 'Untitled';
              const snippet = entry.content?.substring(0, 80) + '...';
              const tone = entry.insight?.emotional_tone;
              const pattern = entry.insight?.pattern_name;

              return (
                <div key={entry.id} className="recent-entry-card" onClick={() => onEntrySelect(entry.id, entry.book_id)}>
                  <div className="recent-date">
                    <span className="recent-day">{day}</span>
                    <span className="recent-month">{month}</span>
                  </div>
                  <div className="recent-details">
                    <h4 className="recent-title">{title}</h4>
                    <p className="recent-snippet">{snippet}</p>
                    <div className="recent-pills">
                      {tone && tone !== 'Unknown' && <span className="metric-pill mood-pill small">{tone}</span>}
                      {pattern && pattern !== 'Unknown' && pattern !== 'Analysis Pending' && <span className="metric-pill pattern-pill small">{pattern}</span>}
                    </div>
                  </div>
                </div>
              );
            })}
            {recentEntries.length === 0 && <p className="overview-empty">No entries yet.</p>}
          </div>
        </div>

        <div className="overview-sidebar">
          <div className="mood-mirror-card">
            <div className="overview-section-header">
              <h3>👁 Mood mirror</h3>
              <span className="view-all">Full view →</span>
            </div>
            <div className="mood-list">
              {moodMirrorData.map((item, i) => (
                <div key={i} className="mood-item">
                  <span className="mood-name">{item.mood}</span>
                  <div className="mood-bar-container">
                    <div className="mood-dot" style={{ opacity: Math.max(0.3, item.count / maxMoodCount) }}></div>
                  </div>
                  <span className="mood-count">{item.count}</span>
                </div>
              ))}
              {moodMirrorData.length === 0 && <p className="overview-empty">Not enough data.</p>}
            </div>
          </div>

          <div className="ai-insight-card">
            <div className="overview-section-header">
              <h3>✦ AI insight</h3>
            </div>
            {topPattern !== 'None' ? (
              <div className="insight-content">
                <div className="insight-label">PATTERN SPOTTED</div>
                <p className="insight-text">
                  You've written about <strong>{topPattern}</strong> {maxPatternCount} times overall.
                </p>
              </div>
            ) : (
              <p className="overview-empty">Keep writing to uncover patterns.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
