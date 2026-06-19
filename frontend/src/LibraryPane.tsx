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

      <div className="library-grid">
        {books.map(book => (
          <div 
            key={book.id} 
            className="book-card"
            onClick={() => onSelectBook(book.id)}
          >
            <div className="book-cover" style={{
              backgroundColor: book.cover_image_url ? 'transparent' : 'var(--accent-2)',
              backgroundImage: book.cover_image_url ? `url(${book.cover_image_url})` : 'none',
            }}>
              {!book.cover_image_url && (
                <div className="book-cover-text">
                  <div className="book-cover-spine"></div>
                  <span className="book-cover-title">{book.title}</span>
                </div>
              )}
              <button 
                className="book-edit-btn"
                onClick={(e) => { e.stopPropagation(); setEditingBook(book); }}
              >
                Edit
              </button>
            </div>
            <div className="book-info">
              <h3 className="book-info-title">{book.title}</h3>
              <p className="book-info-date">
                {new Date(book.created_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
              </p>
            </div>
          </div>
        ))}
        
        {/* Placeholder for creating a new book */}
        <div className="book-card new-book" onClick={() => setIsCreating(true)}>
          <div className="book-cover new-book-cover">
            <span className="new-book-icon">+</span>
          </div>
          <div className="book-info">
            <h3 className="book-info-title">New Journal</h3>
          </div>
        </div>
      </div>
    </div>
  );
}
