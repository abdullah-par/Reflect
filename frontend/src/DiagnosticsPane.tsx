// DiagnosticsPane.tsx – renders on‑demand cognitive diagnostics
import React, { useEffect, useState } from "react";
import { fetchDiagnostic, runDiagnostic } from "./api";
import "./DiagnosticsPane.css";
import TypewriterText from "./TypewriterText";

// Types matching the backend schema
export type Diagnostic = {
  mental_architecture: string;
  behavioral_blindspot: string;
  tactical_fix: string;
  loop_frequency?: number;
  flagged_people?: Record<string, any>;
  dominant_pattern?: string;
};

interface Props {
  entryId: string | null;
}

const DiagnosticsPane: React.FC<Props> = ({ entryId }) => {
  const [diagnostic, setDiagnostic] = useState<Diagnostic | null>(null);
  const [running, setRunning] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // On mount – attempt to load a cached diagnostic
  useEffect(() => {
    if (!entryId) return;
    setLoaded(false);
    setDiagnostic(null);
    fetchDiagnostic(entryId)
      .then(setDiagnostic)
      .finally(() => setLoaded(true));
  }, [entryId]);

  const handleRun = async () => {
    if (!entryId) return;
    setRunning(true);
    try {
      const result = await runDiagnostic(entryId);
      setDiagnostic(result);
    } finally {
      setRunning(false);
    }
  };

  // Parse tactical fix helper
  const parsedTacticalFix = (text: string) => {
    if (!text) return [];
    return text.split(/Step \d+:/i).map(s => s.trim()).filter(Boolean);
  };

  // Main render ----------------------------------------------------------
  if (!loaded) {
    return <div className="diagnostic-loading">Loading diagnostics…</div>;
  }

  if (running) {
    return <div className="diagnostic-loading">Running diagnostics…</div>;
  }

  if (!diagnostic) {
    return (
      <div className="diagnostic-empty">
        <p>No diagnostic cached for this entry.</p>
        <button className="run-btn" onClick={handleRun} disabled={running}>
          Run Diagnostics
        </button>
      </div>
    );
  }

  return (
    <div className="diagnostics-container">
      {/* Re‑run link */}
      <div className="diagnostic-header">
        <h2>AI Diagnostic</h2>
        <button className="re-run-btn" onClick={handleRun} disabled={running}>
          Re‑run
        </button>
      </div>

      {/* 1. Mental Architecture */}
      <div className="diagnostic-panel">
        <h3 className="panel-title">Current Mental Architecture</h3>
        <p className="panel-content"><TypewriterText text={diagnostic.mental_architecture} /></p>
        
        {diagnostic.dominant_pattern && (
          <div className="pill-container">
            <span className="pattern-pill">{diagnostic.dominant_pattern}</span>
          </div>
        )}
        
        {diagnostic.loop_frequency !== undefined && (
          <p className="loop-frequency-text">
            This pattern appeared in {diagnostic.loop_frequency} of your last 10 entries.
          </p>
        )}
      </div>

      {/* 2. Behavioral Blind-spots */}
      <div className="diagnostic-panel">
        <h3 className="panel-title">Behavioral Blind-spots</h3>
        <p className="panel-content"><TypewriterText text={diagnostic.behavioral_blindspot} /></p>
        
        {diagnostic.flagged_people && Object.keys(diagnostic.flagged_people).length > 0 && (
          <table className="flagged-people-table">
            <thead>
              <tr>
                <th>Person/Entity</th>
                <th>Dynamic</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(diagnostic.flagged_people).map(([name, dynamic], idx) => (
                <tr key={idx}>
                  <td className="person-name">{name}</td>
                  <td>
                    <span className={`dynamic-label ${String(dynamic).toLowerCase().replace(/[^a-z0-9]/g, '-')}`}>
                      {String(dynamic)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 3. The Tactical Fix */}
      <div className="diagnostic-panel">
        <h3 className="panel-title">The Tactical Fix</h3>
        <ol className="tactical-fix-list">
          {parsedTacticalFix(diagnostic.tactical_fix).map((step, idx) => (
            <li key={idx} className="tactical-step"><TypewriterText text={step} /></li>
          ))}
        </ol>
      </div>
    </div>
  );
};

export default DiagnosticsPane;
