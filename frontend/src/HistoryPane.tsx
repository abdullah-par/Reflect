import { useEffect, useState } from 'react';
import { fetchWithAuth } from './api';
import { formatEntryTime } from './utils/format';
import './HistoryPane.css';

type Edit = {
  id: number;
  title: string;
  content: string;
  edited_at: string;
};

interface Props {
  selectedEntryId: string | null;
}

export default function HistoryPane({ selectedEntryId }: Props) {
  const [edits, setEdits] = useState<Edit[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedEntryId) return;
    setLoading(true);
    fetchWithAuth(`/entries/${selectedEntryId}/edits`)
      .then((res) => res.json())
      .then((data) => setEdits(data))
      .catch((err) => console.error('Failed to load edit history', err))
      .finally(() => setLoading(false));
  }, [selectedEntryId]);

  if (!selectedEntryId) return null;
  if (loading) return <p className="loading">Loading edit history…</p>;

  return (
    <section className="history-pane">
      <h2 className="history-title">Edit History</h2>
      {edits.length === 0 ? (
        <p className="history-empty">No edits recorded yet.</p>
      ) : (
        <ul className="history-list">
          {edits.map((e) => (
            <li key={e.id} className="history-item animate-fade-in">
              <div className="edit-meta">
                <span className="edit-date">{formatEntryTime(e.edited_at)}</span>
                {e.title && <span className="edit-title">Title: {e.title}</span>}
              </div>
              <p className="edit-content">{e.content}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
