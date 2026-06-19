import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { fetchWithAuth } from './api';

export default function Dashboard() {
  const [entries, setEntries] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadEntries() {
      const res = await fetchWithAuth('/entries/');
      if (res.ok) {
        const data = await res.json();
        setEntries(data);
      }
    }
    loadEntries();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('antigravity_token');
    navigate('/');
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <h1>Antigravity Dashboard</h1>
        <div>
          <Link to="/editor" style={{ marginRight: '20px', padding: '10px 20px', backgroundColor: '#333', color: 'white', textDecoration: 'none', borderRadius: '4px' }}>
            New Entry
          </Link>
          <button onClick={handleLogout} style={{ padding: '10px 20px', cursor: 'pointer' }}>Logout</button>
        </div>
      </header>
      
      <div>
        <h2>Your Entries</h2>
        {entries.length === 0 ? (
          <p>No entries yet. Start journaling!</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {entries.map(entry => (
              <div key={entry.id} style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '8px' }}>
                <p style={{ fontSize: '0.8em', color: '#666' }}>{new Date(entry.created_at).toLocaleString()}</p>
                <p style={{ marginTop: '10px', whiteSpace: 'pre-wrap' }}>{entry.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
