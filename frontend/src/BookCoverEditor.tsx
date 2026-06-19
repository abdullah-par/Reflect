import { useState } from 'react';
import { updateBook, createBook } from './api';

interface BookCoverEditorProps {
  bookId?: number;
  initialTitle?: string;
  initialCoverUrl?: string;
  onClose: () => void;
  onSaved: () => void;
}

export default function BookCoverEditor({ bookId, initialTitle = '', initialCoverUrl = '', onClose, onSaved }: BookCoverEditorProps) {
  const [title, setTitle] = useState(initialTitle);
  const [coverUrl, setCoverUrl] = useState(initialCoverUrl);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setIsSaving(true);
    setError(null);
    try {
      if (bookId) {
        await updateBook(bookId, title, coverUrl);
      } else {
        await createBook(title, coverUrl);
      }
      onSaved();
    } catch (err: any) {
      setError(err.message || 'Could not save book details');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="modal-overlay" style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000
    }}>
      <div className="modal-content" style={{
        background: 'var(--bg)',
        padding: '2rem',
        borderRadius: 'var(--radius-lg)',
        width: '400px',
        maxWidth: '90vw',
        border: '1px solid var(--border)',
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ margin: '0 0 1.5rem', fontFamily: 'var(--font-head)' }}>
          {bookId ? 'Edit Journal' : 'New Journal'}
        </h2>
        {error && <p className="quiet-error" style={{ marginBottom: '1rem' }}>{error}</p>}
        <form onSubmit={handleSave}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-2)' }}>Title</label>
            <input 
              type="text" 
              value={title} 
              onChange={e => setTitle(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg-2)', color: 'var(--text-1)' }}
              autoFocus
            />
          </div>
          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-2)' }}>Cover Image URL (optional)</label>
            <input 
              type="text" 
              value={coverUrl} 
              onChange={e => setCoverUrl(e.target.value)}
              placeholder="https://..."
              style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg-2)', color: 'var(--text-1)' }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
            <button type="button" onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-2)', cursor: 'pointer' }}>Cancel</button>
            <button type="submit" disabled={isSaving || !title.trim()} style={{ background: 'var(--accent)', color: '#fff', border: 'none', padding: '0.5rem 1.5rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}>
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
