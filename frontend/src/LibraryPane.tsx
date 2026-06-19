import { useState } from 'react';

interface Book {
  id: number;
  title: string;
  cover_image_url?: string;
  created_at: string;
}

interface Props {
  books: Book[];
  onSelectBook: (id: number) => void;
  onBooksChanged?: () => void;
}

import BookCoverEditor from './BookCoverEditor';

export default function LibraryPane({ books, onSelectBook, onBooksChanged }: Props) {
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  return (
    <div className="library-pane">
      {(isCreating || editingBook) && (
        <BookCoverEditor
          bookId={editingBook?.id}
          initialTitle={editingBook?.title}
          initialCoverUrl={editingBook?.cover_image_url}
          onClose={() => { setIsCreating(false); setEditingBook(null); }}
          onSaved={() => {
            setIsCreating(false);
            setEditingBook(null);
            if (onBooksChanged) onBooksChanged();
          }}
        />
      )}
      <div className="library-header" style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: 'var(--font-head)', fontSize: '2rem', fontWeight: 'normal', color: 'var(--text-1)' }}>
          My Library
        </h1>
        <p style={{ color: 'var(--text-3)', fontSize: '0.9rem' }}>
          Select a journal to open it.
        </p>
      </div>

      <div className="library-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: '2rem'
      }}>
        {books.map(book => (
          <div 
            key={book.id} 
            className="book-card"
            onClick={() => onSelectBook(book.id)}
            style={{
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              transition: 'transform 0.15s ease'
            }}
          >
            <div className="book-cover" style={{
              position: 'relative',
              aspectRatio: '3 / 4',
              backgroundColor: book.cover_image_url ? 'transparent' : 'var(--bg-3)',
              backgroundImage: book.cover_image_url ? `url(${book.cover_image_url})` : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
            }}>
              {!book.cover_image_url && (
                <span style={{ fontFamily: 'var(--font-head)', color: 'var(--text-2)', padding: '1rem', textAlign: 'center', fontSize: '1.2rem' }}>
                  {book.title}
                </span>
              )}
              <button 
                onClick={(e) => { e.stopPropagation(); setEditingBook(book); }}
                style={{ position: 'absolute', top: '10px', right: '10px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '4px 8px', cursor: 'pointer', fontSize: '0.8rem', color: 'var(--text-2)' }}
              >
                Edit
              </button>
            </div>
            <div className="book-info" style={{ textAlign: 'center' }}>
              <h3 style={{ margin: 0, fontFamily: 'var(--font-ui)', fontSize: '1rem', color: 'var(--text-1)' }}>{book.title}</h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-3)' }}>
                {new Date(book.created_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
              </p>
            </div>
          </div>
        ))}
        
        {/* Placeholder for creating a new book */}
        <div className="book-card new-book" onClick={() => setIsCreating(true)} style={{
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            opacity: 0.7
          }}>
            <div className="book-cover" style={{
              aspectRatio: '3 / 4',
              backgroundColor: 'transparent',
              borderRadius: 'var(--radius-md)',
              border: '1px dashed var(--text-3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <span style={{ fontSize: '2rem', color: 'var(--text-3)' }}>+</span>
            </div>
            <div className="book-info" style={{ textAlign: 'center' }}>
              <h3 style={{ margin: 0, fontFamily: 'var(--font-ui)', fontSize: '1rem', color: 'var(--text-2)' }}>New Journal</h3>
            </div>
          </div>
      </div>
    </div>
  );
}
