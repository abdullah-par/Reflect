import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from './Landing';
import Dashboard from './Dashboard';
import Editor from './Editor';
import Auth from './Auth';
import { useTheme } from './useTheme';

function App() {
  const [theme, toggleTheme] = useTheme();

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing theme={theme} toggleTheme={toggleTheme} />} />
        <Route path="/auth" element={<Auth theme={theme} toggleTheme={toggleTheme} />} />
        <Route path="/app" element={<Dashboard theme={theme} toggleTheme={toggleTheme} />} />
        <Route path="/editor" element={<Editor theme={theme} toggleTheme={toggleTheme} />} />
      </Routes>
    </Router>
  );
}

export default App;
