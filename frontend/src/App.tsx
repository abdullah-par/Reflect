import { useEffect, useRef, useState } from 'react'
import './index.css'

function App() {
  const navRef = useRef<HTMLElement>(null)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('reflct-theme') as 'light' | 'dark') || 'light'
    }
    return 'light'
  })

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === 'light' ? 'dark' : 'light'
      localStorage.setItem('reflct-theme', next)
      return next
    })
  }

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  useEffect(() => {
    const handleScroll = () => {
      if (navRef.current) {
        navRef.current.classList.toggle('scrolled', window.scrollY > 20)
      }
    }
    window.addEventListener('scroll', handleScroll)

    // Intersection Observer for fade-in animations
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
          }
        })
      },
      { threshold: 0.15 }
    )
    document.querySelectorAll('.fade-in').forEach((el) => observer.observe(el))

    return () => {
      window.removeEventListener('scroll', handleScroll)
      observer.disconnect()
    }
  }, [])

  return (
    <>
      {/* ===== NAVBAR ===== */}
      <nav className="navbar" ref={navRef} id="navbar">
        <div className="navbar-left">
          <a href="#" className="navbar-logo">
            <img src="/logo.png" alt="Reflct logo" />
          </a>
          <button className="theme-toggle-btn" onClick={toggleTheme} aria-label="Toggle theme" title="Toggle theme">
            {theme === 'light' ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
            )}
          </button>
        </div>
        <div className="navbar-right">
          <a href="#features">Features</a>
          <a href="#how-it-works">How it works</a>
          <a href="#preview">Preview</a>
          <a href="#stack">Stack</a>
          <a href="#cta" className="btn-cta">Start Writing</a>
        </div>
      </nav>

      {/* ===== HERO ===== */}
      <section className="hero" id="hero">
        <img src="/logo.png" alt="Reflct" className="hero-logo" />
        <h1>Your journal remembers<br />what you forget.</h1>
        <p className="hero-tagline">
          AI-powered journaling that spots patterns, tracks emotions, and surfaces
          lessons hidden in your own words.
        </p>
        <div className="hero-cta-group">
          <a href="#cta" className="btn-cta-large">Start Journaling Free</a>
          <a href="#how-it-works" className="btn-ghost">See How It Works</a>
        </div>
        <div className="hero-scroll-hint">↓</div>
      </section>

      {/* ===== FEATURES ===== */}
      <section className="features-section" id="features">
        <div className="section section-center">
          <p className="section-label fade-in">Core Features</p>
          <h2 className="section-title fade-in">Four ways Reflct reads between your lines</h2>
          <p className="section-subtitle fade-in">
            Not another notes app. This is a mirror that shows you what you can't see yourself.
          </p>
        </div>
        <div className="features-grid">
          <div className="feature-card fade-in">
            <div className="feature-icon">🔁</div>
            <h3>Patterns</h3>
            <h5>Repeating mistakes</h5>
            <p>AI spots the same struggles showing up across weeks or months — the loops you're stuck in without knowing it.</p>
          </div>
          <div className="feature-card fade-in">
            <div className="feature-icon">🌊</div>
            <h3>Emotions</h3>
            <h5>Mood over time</h5>
            <p>Detect emotional tone and map how your feelings shift across entries. See the arc of your inner world.</p>
          </div>
          <div className="feature-card fade-in">
            <div className="feature-icon">⚡</div>
            <h3>Action</h3>
            <h5>Practical lessons</h5>
            <p>Psychology-backed steps — not generic advice, but rooted in your words. Real guidance from your real life.</p>
          </div>
          <div className="feature-card fade-in">
            <div className="feature-icon">💭</div>
            <h3>Memory</h3>
            <h5>Past lessons</h5>
            <p>Surfaces entries from months ago that are eerily relevant right now. Your past self, speaking to your present.</p>
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="section section-center" id="how-it-works">
        <p className="section-label fade-in">How It Works</p>
        <h2 className="section-title fade-in">Write. Reflect. Grow.</h2>
        <p className="section-subtitle fade-in">
          Four simple steps from raw thoughts to actionable self-awareness.
        </p>
        <div className="steps-timeline">
          <div className="step-item fade-in">
            <div className="step-number">1</div>
            <div className="step-content">
              <h3>Write an entry</h3>
              <p>Free-form text, like a real diary. No prompts, no structure — just you.</p>
            </div>
          </div>
          <div className="step-item fade-in">
            <div className="step-number">2</div>
            <div className="step-content">
              <h3>AI processes silently</h3>
              <p>Tags emotions, themes, and named patterns behind the scenes.</p>
            </div>
          </div>
          <div className="step-item fade-in">
            <div className="step-number">3</div>
            <div className="step-content">
              <h3>Weekly insight report</h3>
              <p>Patterns, mood arc, and one key lesson — delivered every Sunday.</p>
            </div>
          </div>
          <div className="step-item fade-in">
            <div className="step-number">4</div>
            <div className="step-content">
              <h3>Daily nudge</h3>
              <p>"3 months ago you said this…" — your past wisdom, resurfaced.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== JOURNAL PREVIEW ===== */}
      <section className="journal-preview-section" id="preview">
        <div className="section section-center">
          <p className="section-label fade-in">Live Preview</p>
          <h2 className="section-title fade-in">What a journal entry looks like</h2>
          <p className="section-subtitle fade-in">
            Write naturally. The AI does the rest.
          </p>
        </div>
        <div className="journal-mockup fade-in">
          <div className="journal-ai-badge">✨ AI Analyzed</div>
          <p className="journal-date">Monday, June 9, 2026</p>
          <div className="journal-text">
            I keep saying yes to things I don't want to do. It happened again today at work — someone asked me to take on
            an extra project and I just... agreed. I felt that familiar tightness in my chest. The same thing happened
            last month with the volunteering thing. I think I'm afraid that saying no means people won't like me.
            But I'm exhausted. Something has to change.
          </div>
          <div className="journal-tags">
            <span className="journal-tag">🔁 people-pleasing</span>
            <span className="journal-tag">😰 anxiety</span>
            <span className="journal-tag">🪞 self-awareness</span>
            <span className="journal-tag">⚡ boundary-setting</span>
            <span className="journal-tag">🔄 recurring pattern</span>
          </div>
        </div>
      </section>

      {/* ===== TECH STACK ===== */}
      <section className="section section-center" id="stack">
        <p className="section-label fade-in">Built With</p>
        <h2 className="section-title fade-in">The stack behind the magic</h2>
        <p className="section-subtitle fade-in">
          Modern, fast, and built for privacy.
        </p>
        <div className="tech-grid">
          {[
            { icon: '⚛️', name: 'React + Vite', desc: 'Frontend' },
            { icon: '🔐', name: 'Supabase', desc: 'Auth + Storage' },
            { icon: '🧠', name: 'Claude API', desc: 'Analysis Engine' },
            { icon: '📊', name: 'Recharts', desc: 'Mood Timeline' },
            { icon: '⚙️', name: 'Edge Functions', desc: 'AI Processing' },
            { icon: '📬', name: 'Resend', desc: 'Email Digest' },
          ].map((tech) => (
            <div className="tech-item fade-in" key={tech.name}>
              <div className="tech-item-icon">{tech.icon}</div>
              <h4>{tech.name}</h4>
              <p>{tech.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="cta-section" id="cta">
        <h2 className="fade-in">Start understanding yourself.</h2>
        <p className="section-subtitle fade-in">
          Your journal already holds the answers. Let Reflct help you find them.
        </p>
        <a href="#" className="btn-cta-light fade-in">Start Writing — It's Free</a>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="footer">
        <img src="/logo.png" alt="Reflct" className="footer-logo" />
        <div className="footer-links">
          <a href="#features">Features</a>
          <a href="#how-it-works">How it works</a>
          <a href="#preview">Preview</a>
          <a href="#stack">Stack</a>
        </div>
        <p style={{ marginTop: '1.5rem' }}>
          © 2026 Reflct. Your journal remembers what you forget.
        </p>
      </footer>
    </>
  )
}

export default App
