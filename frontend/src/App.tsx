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

  return (
    <>
      <div className="notebook-margin-line"></div>
      {/* ===== NAVBAR ===== */}
      <nav className="navbar" ref={navRef}>
        <div className="nav-container">
          <a href="#" className="navbar-logo">
            <span className="logo-wordmark">Reflct</span>
          </a>
          
          <div className="navbar-right">
            <div className="nav-links desktop-only">
              <a href="#features">Features</a>
              <a href="#how-it-works">How it works</a>
              <a href="#preview">Preview</a>
            </div>
            
            <button className="theme-toggle-btn" onClick={toggleTheme} aria-label="Toggle theme">
              <div className="toggle-icon-wrapper">
                {theme === 'light' ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="sun-icon"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="moon-icon"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
                )}
              </div>
            </button>
            <a href="#cta" className="btn-nav-cta">Start Writing</a>
          </div>
        </div>
      </nav>

      {/* ===== HERO ===== */}
      <section className="hero">
        <div className="hero-container">
          <h1 className="animate-up delay-1">
            Your journal <span className="impasto-gradient">already</span><br />
            holds the <span className="marker-h marker-blue">answers.</span>
          </h1>
          <div className="hero-sticky-note desktop-only animate-up delay-3">
            ✦ Finally, a mirror for your mind. No filters, just the truth.
          </div>
        </div>
        <p className="hero-tagline animate-up delay-2">
          Reflct reads your entries and surfaces the patterns, emotions, and lessons you keep missing.
        </p>
        <div className="hero-cta-group animate-up delay-3">
          <a href="#cta" className="btn-primary">Start Writing</a>
          <a href="#how-it-works" className="btn-secondary">See how it works</a>
        </div>
        <div className="hero-trust animate-up delay-3">
          Free to start · Private by default · No credit card
        </div>
      </section>

      <div className="scribble-divider"></div>

      {/* ===== FEATURES ===== */}
      <section className="features-section" id="features">
        <div className="section-container" style={{ position: 'relative' }}>
          <span className="section-label">Core Features</span>
          <h2 className="section-title">Four ways Reflct <span className="sketch-underline">reads between your lines</span></h2>
          <div className="annotation desktop-only" style={{ left: '-60px', top: '120px', transform: 'rotate(-10deg)', textAlign: 'right' }}>
            <p>Built for<br/>clarity</p>
            <div className="arrow-sketch" style={{ transform: 'rotate(120deg) scaleX(-1)' }}></div>
          </div>
          <p className="section-subtitle">
            Not another notes app. This is a mirror that shows you what you can't see yourself.
          </p>
          
          <div className="features-grid">
            <div className="feature-item animate-up">
              <span className="feature-label">01 —</span>
              <h3>Patterns</h3>
              <p>AI spots the same struggles showing up across weeks or months — the loops you're stuck in without knowing it.</p>
            </div>
            <div className="feature-item animate-up delay-1">
              <span className="feature-label">02 —</span>
              <h3>Emotions</h3>
              <p>Detect emotional tone and map how your feelings shift across entries. See the arc of your inner world.</p>
            </div>
            <div className="feature-item animate-up delay-2">
              <span className="feature-label">03 —</span>
              <h3>Action</h3>
              <p>Psychology-backed steps — not generic advice, but rooted in your words. Real guidance from your real life.</p>
            </div>
            <div className="feature-item animate-up delay-3">
              <span className="feature-label">04 —</span>
              <h3>Memory</h3>
              <p>Surfaces entries from months ago that are eerily relevant right now. Your past self, speaking to your present.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="how-it-works-section" id="how-it-works">
        <div className="section-container section-center">
          <span className="section-label">How It Works</span>
          <h2 className="section-title">Write. Reflect. <span className="marker-h marker-pink">Grow.</span></h2>
          <p className="section-subtitle">
            Four simple steps from raw thoughts to actionable self-awareness.
          </p>
          
          <div className="how-it-works-grid">
            <div className="step-item animate-up">
              <span className="step-label">Step 01</span>
              <h3>Write</h3>
              <p>Free-form text, like a real diary. No prompts, no structure.</p>
            </div>
            <div className="step-item animate-up delay-1">
              <span className="step-label">Step 02</span>
              <h3>Analyze</h3>
              <p>AI processes themes and named patterns behind the scenes.</p>
            </div>
            <div className="step-item animate-up delay-2">
              <span className="step-label">Step 03</span>
              <h3>Review</h3>
              <p>Mood arcs and key lessons delivered every Sunday.</p>
            </div>
            <div className="step-item animate-up delay-3">
              <span className="step-label">Step 04</span>
              <h3>Recall</h3>
              <p>Resurfacing past wisdom exactly when it's relevant.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== JOURNAL PREVIEW ===== */}
      <section className="journal-preview-section" id="preview">
        <div className="section-container section-center">
          <span className="section-label">Live Preview</span>
          <h2 className="section-title">What a journal entry looks like</h2>
          <p className="section-subtitle">Write naturally. The AI does the rest.</p>
          
          <div className="journal-mockup">
            <div className="journal-content-wrap">
              <span className="journal-ai-status">✦ AI analyzed</span>
              <span className="journal-date">Monday, June 9, 2026</span>
              <div className="journal-text">
                I keep saying yes to things I don't want to do. It happened again today at work — someone asked me to take on
                an extra project and I just... agreed. I felt that <span className="marker-h">familiar tightness</span> in my chest. The same thing happened
                last month with the volunteering thing. I think I'm afraid that saying no means people won't like me.
                But I'm exhausted. Something has to change.
              </div>
              <div className="journal-tags">
                <span className="journal-tag">people-pleasing</span>
                <span className="journal-tag">anxiety</span>
                <span className="journal-tag">self-awareness</span>
                <span className="journal-tag">boundary-setting</span>
                <span className="journal-tag">recurring pattern</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="cta-section" id="cta">
        <h2>Start writing today.</h2>
        <p>Your first insight is one entry away.</p>
        <a href="#" className="btn-cta-large">Start Writing</a>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="footer">
        <div className="footer-container">
          <span className="navbar-logo">Reflct</span>
          <p className="footer-copyright">© 2026 Reflct</p>
        </div>
      </footer>
    </>
  )
}

export default App
