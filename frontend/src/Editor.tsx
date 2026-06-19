import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchWithAuth } from './api';

export default function Editor() {
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();

  const handleSave = async () => {
    if (!content.trim()) return;
    
    setIsSaving(true);
    const res = await fetchWithAuth('/entries/', {
      method: 'POST',
      body: JSON.stringify({ content }),
    });

    if (res.ok) {
      navigate('/app');
    } else {
      alert('Failed to save entry');
      setIsSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <button onClick={() => navigate('/app')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2em' }}>
          &larr; Back
        </button>
        <button 
          onClick={handleSave} 
          disabled={isSaving || !content.trim()}
          style={{ padding: '10px 20px', backgroundColor: '#333', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          {isSaving ? 'Saving...' : 'Save Entry'}
        </button>
      </header>
      
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Dump your thoughts here..."
        style={{
          flex: 1,
          width: '100%',
          padding: '20px',
          fontSize: '1.2em',
          border: 'none',
          outline: 'none',
          resize: 'none',
          backgroundColor: 'transparent',
          fontFamily: 'monospace'
        }}
        autoFocus
      />
    </div>
  );
}
