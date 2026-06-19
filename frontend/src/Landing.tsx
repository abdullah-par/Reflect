import { Link, Navigate } from 'react-router-dom';
import { Theme } from './useTheme';

interface Props {
  theme: Theme;
  toggleTheme: () => void;
}

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

// Simple check icon for feature lists
function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export default function Landing({ theme, toggleTheme }: Props) {
  const token = localStorage.getItem('antigravity_token');
  if (token) {
    return <Navigate to="/app" replace />;
  }

  return (
    <div className="lp-root">

      {/* ── NAV ── */}
      <header className="lp-nav">
        <div className="lp-nav-inner">
          <div className="lp-nav-left">
            <Link to="/" className="lp-logo">Reflect</Link>
            <nav className="lp-nav-links">
              <a href="#features">Features</a>
              <a href="#how-it-works">How it works</a>
              <a href="#pricing">Pricing</a>
            </nav>
          </div>
          <div className="lp-nav-right">
            <button
              type="button"
              onClick={toggleTheme}
              className="lp-theme-btn"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
            </button>
            <Link to="/auth" className="lp-nav-link">Log in</Link>
            <Link to="/auth" className="lp-nav-cta">Get started</Link>
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="lp-hero">
        <div className="lp-container">
          <div className="lp-hero-layout">
            <div className="lp-hero-text">
              <p className="lp-hero-label">Personal AI Journal</p>
              <h1 className="lp-hero-title">
                A journal that remembers everything you've written
              </h1>
              <p className="lp-hero-desc">
                Reflect connects your daily entries to your past writing, surfaces behavioral patterns over time, and helps you understand yourself better, privately.
              </p>
              <div className="lp-hero-actions">
                <Link to="/auth" className="lp-btn-primary">Start for free</Link>
                <Link to="/auth" className="lp-btn-secondary">Sign in</Link>
              </div>
              <p className="lp-hero-note">No credit card required. Your data stays on your device.</p>
            </div>

            <div className="lp-hero-preview">
              <div className="lp-app-window">
                <div className="lp-window-bar">
                  <span className="lp-window-dot" />
                  <span className="lp-window-dot" />
                  <span className="lp-window-dot" />
                  <span className="lp-window-url">reflect.app/journal</span>
                </div>
                <div className="lp-window-body">
                  <div className="lp-mock-sidebar">
                    <div className="lp-mock-logo">Reflect</div>
                    <div className="lp-mock-nav-item active">Journal</div>
                    <div className="lp-mock-nav-item">Chapters</div>
                    <div className="lp-mock-nav-item">Patterns</div>
                    <div className="lp-mock-divider" />
                    <div className="lp-mock-entry-list">
                      <div className="lp-mock-entry-item active">
                        <span className="lp-mock-entry-date">Today</span>
                        <span className="lp-mock-entry-preview">I've been waking up tired...</span>
                      </div>
                      <div className="lp-mock-entry-item">
                        <span className="lp-mock-entry-date">Yesterday</span>
                        <span className="lp-mock-entry-preview">The meeting went better than...</span>
                      </div>
                      <div className="lp-mock-entry-item">
                        <span className="lp-mock-entry-date">Mon</span>
                        <span className="lp-mock-entry-preview">I keep second-guessing my...</span>
                      </div>
                    </div>
                  </div>
                  <div className="lp-mock-content">
                    <div className="lp-mock-content-header">
                      <span className="lp-mock-content-date">Thursday, June 19</span>
                    </div>
                    <div className="lp-mock-text">
                      I've been waking up tired lately, even after a full night's sleep. I keep thinking it's the project, but maybe it's something else...
                    </div>
                    <div className="lp-mock-insight">
                      <div className="lp-mock-insight-label">Reflect noticed</div>
                      <div className="lp-mock-insight-text">
                        You've written about fatigue on deadline weeks 4 times this month. This may be anxiety, not tiredness.
                      </div>
                    </div>
                    <div className="lp-mock-echo">
                      <div className="lp-mock-echo-label">3 weeks ago</div>
                      <div className="lp-mock-echo-text">"The project feels too large to hold in my head at once."</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SOCIAL PROOF BAR ── */}
      <div className="lp-proof-bar">
        <div className="lp-container">
          <div className="lp-proof-inner">
            <span className="lp-proof-text">Trusted by writers, therapists, and people who want to know themselves better</span>
            <div className="lp-proof-stats">
              <div className="lp-stat">
                <span className="lp-stat-num">12,000+</span>
                <span className="lp-stat-label">entries analyzed</span>
              </div>
              <div className="lp-stat-divider" />
              <div className="lp-stat">
                <span className="lp-stat-num">94%</span>
                <span className="lp-stat-label">notice patterns within 2 weeks</span>
              </div>
              <div className="lp-stat-divider" />
              <div className="lp-stat">
                <span className="lp-stat-num">Private</span>
                <span className="lp-stat-label">data never leaves your account</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── FEATURES ── */}
      <section className="lp-section" id="features">
        <div className="lp-container">
          <div className="lp-section-header">
            <h2 className="lp-section-title">Everything a journal should do, and more</h2>
            <p className="lp-section-desc">Reflect is built around one idea: your past writing is the most valuable context for understanding your present.</p>
          </div>

          <div className="lp-features-grid">
            <div className="lp-feature-row">
              <div className="lp-feature-text">
                <h3 className="lp-feature-title">Pattern recognition across all your entries</h3>
                <p className="lp-feature-desc">
                  After each entry, Reflect runs analysis across your full writing history. It identifies recurring emotional patterns, behavioral loops, and themes you return to automatically, without you doing anything.
                </p>
                <ul className="lp-feature-list">
                  <li><CheckIcon /> Emotional tone tracking over time</li>
                  <li><CheckIcon /> Relationship impact mapping</li>
                  <li><CheckIcon /> Recurring situation detection</li>
                </ul>
              </div>
              <div className="lp-feature-visual">
                <div className="lp-feature-card">
                  <div className="lp-card-label">Patterns · Last 30 days</div>
                  <div className="lp-pattern-row">
                    <span className="lp-pattern-name">Work anxiety</span>
                    <div className="lp-pattern-bar-wrap">
                      <div className="lp-pattern-bar" style={{ width: '78%' }} />
                    </div>
                    <span className="lp-pattern-count">14×</span>
                  </div>
                  <div className="lp-pattern-row">
                    <span className="lp-pattern-name">Procrastination</span>
                    <div className="lp-pattern-bar-wrap">
                      <div className="lp-pattern-bar" style={{ width: '55%' }} />
                    </div>
                    <span className="lp-pattern-count">9×</span>
                  </div>
                  <div className="lp-pattern-row">
                    <span className="lp-pattern-name">Creative energy</span>
                    <div className="lp-pattern-bar-wrap">
                      <div className="lp-pattern-bar lp-pattern-bar-positive" style={{ width: '40%' }} />
                    </div>
                    <span className="lp-pattern-count">7×</span>
                  </div>
                  <div className="lp-pattern-row">
                    <span className="lp-pattern-name">Social withdrawal</span>
                    <div className="lp-pattern-bar-wrap">
                      <div className="lp-pattern-bar" style={{ width: '28%' }} />
                    </div>
                    <span className="lp-pattern-count">5×</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="lp-feature-row lp-feature-row-reverse">
              <div className="lp-feature-text">
                <h3 className="lp-feature-title">Your past entries, surfaced in context</h3>
                <p className="lp-feature-desc">
                  When you write about something, Reflect finds what you've written about it before, not just keywords, but semantic meaning. You'll see how the same thought has evolved over months.
                </p>
                <ul className="lp-feature-list">
                  <li><CheckIcon /> Semantic similarity matching</li>
                  <li><CheckIcon /> Chronological evolution view</li>
                  <li><CheckIcon /> Cross-period pattern linking</li>
                </ul>
              </div>
              <div className="lp-feature-visual">
                <div className="lp-feature-card">
                  <div className="lp-card-label">Memory echo · Similar entries</div>
                  <div className="lp-echo-list">
                    <div className="lp-echo-item">
                      <div className="lp-echo-date">6 weeks ago</div>
                      <div className="lp-echo-content">"I don't feel like I'm making progress, even when I technically am."</div>
                    </div>
                    <div className="lp-echo-item">
                      <div className="lp-echo-date">3 months ago</div>
                      <div className="lp-echo-content">"Hard to stay motivated when the output is invisible. Nobody sees the work that doesn't ship."</div>
                    </div>
                    <div className="lp-echo-item">
                      <div className="lp-echo-date">5 months ago</div>
                      <div className="lp-echo-content">"I need external validation more than I want to admit."</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="lp-feature-row">
              <div className="lp-feature-text">
                <h3 className="lp-feature-title">AI-written summaries of any period</h3>
                <p className="lp-feature-desc">
                  Pick a date range like a week, a month, or a year, and Reflect generates a coherent narrative summary of that period based on your actual entries. It reads like a chapter of your life.
                </p>
                <ul className="lp-feature-list">
                  <li><CheckIcon /> Configurable time periods</li>
                  <li><CheckIcon /> Key themes and events extracted</li>
                  <li><CheckIcon /> Narrative prose, not bullet points</li>
                </ul>
              </div>
              <div className="lp-feature-visual">
                <div className="lp-feature-card lp-chapter-card">
                  <div className="lp-card-label">Chapter · June 1–14</div>
                  <div className="lp-chapter-text">
                    The first two weeks of June were shaped by the tension between ambition and exhaustion. You started the period with a clear goal to ship the feature, but by the end of the first week, fatigue had become the dominant note...
                  </div>
                  <div className="lp-chapter-meta">
                    <span>14 entries · 3,200 words analyzed</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="lp-how" id="how-it-works">
        <div className="lp-container">
          <div className="lp-section-header">
            <h2 className="lp-section-title">How Reflect works</h2>
            <p className="lp-section-desc">No setup. No configuration. Just start writing.</p>
          </div>
          <div className="lp-steps">
            <div className="lp-step">
              <div className="lp-step-num">1</div>
              <div className="lp-step-body">
                <h3>Write an entry</h3>
                <p>Open Reflect and write. No prompts, no templates. Type or dictate. A few sentences or several paragraphs, it works either way.</p>
              </div>
            </div>
            <div className="lp-step">
              <div className="lp-step-num">2</div>
              <div className="lp-step-body">
                <h3>Reflect analyzes it</h3>
                <p>When you save, Reflect reads your entry alongside your full writing history. It identifies tone, patterns, and pulls up the most relevant past entries.</p>
              </div>
            </div>
            <div className="lp-step">
              <div className="lp-step-num">3</div>
              <div className="lp-step-body">
                <h3>See the connections</h3>
                <p>Immediately after saving, you see an observer note and any related past entries. Over time, a pattern view shows you what keeps recurring across weeks and months.</p>
              </div>
            </div>
            <div className="lp-step">
              <div className="lp-step-num">4</div>
              <div className="lp-step-body">
                <h3>Generate chapters</h3>
                <p>At any point, generate a narrative summary of a period, useful for reflection, therapy prep, or simply understanding where you've been.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section className="lp-section lp-pricing-section" id="pricing">
        <div className="lp-container">
          <div className="lp-section-header">
            <h2 className="lp-section-title">Simple pricing</h2>
            <p className="lp-section-desc">One plan. Everything included.</p>
          </div>
          <div className="lp-pricing-card">
            <div className="lp-pricing-left">
              <div className="lp-pricing-tier">Free while in beta</div>
              <div className="lp-pricing-price">$0<span>/month</span></div>
              <p className="lp-pricing-desc">Full access to all features during the beta period. No payment information required.</p>
              <Link to="/auth" className="lp-btn-primary">Create an account</Link>
            </div>
            <div className="lp-pricing-right">
              <ul className="lp-pricing-features">
                <li><CheckIcon /> Unlimited journal entries</li>
                <li><CheckIcon /> AI pattern analysis after every entry</li>
                <li><CheckIcon /> Memory echo: past entry surfacing</li>
                <li><CheckIcon /> Patterns dashboard (moods, people, topics)</li>
                <li><CheckIcon /> Chapter generation for any date range</li>
                <li><CheckIcon /> Voice input</li>
                <li><CheckIcon /> Dark and light mode</li>
                <li><CheckIcon /> Your data is never sold or shared</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="lp-footer">
        <div className="lp-container">
          <div className="lp-footer-layout">
            <div className="lp-footer-brand">
              <span className="lp-logo">Reflect</span>
              <p>A personal AI journal. Private by design.</p>
            </div>
            <div className="lp-footer-cols">
              <div className="lp-footer-col">
                <div className="lp-footer-col-title">Product</div>
                <a href="#features">Features</a>
                <a href="#how-it-works">How it works</a>
                <a href="#pricing">Pricing</a>
              </div>
              <div className="lp-footer-col">
                <div className="lp-footer-col-title">Account</div>
                <Link to="/auth">Sign in</Link>
                <Link to="/auth">Create account</Link>
              </div>
            </div>
          </div>
          <div className="lp-footer-bottom">
            <span>© {new Date().getFullYear()} Reflect. All rights reserved.</span>
            <div className="lp-footer-bottom-links">
              <a href="#">Privacy</a>
              <a href="#">Terms</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
