import { Link } from "react-router-dom";
import Icon from "../components/Icon";
import Logo from "../components/Logo";

const FEATURES = [
  {
    icon: "shield",
    title: "SOS Alert",
    body: "One tap sends your live location and a message to your trusted contacts, instantly.",
  },
  {
    icon: "route",
    title: "Safe Route Map",
    body: "See community-reported safe, unsafe and well-lit spots before you head out.",
  },
  {
    icon: "checkin",
    title: "Scheduled Check-ins",
    body: "Set a timer for your walk home. Miss it, and your circle is alerted automatically.",
  },
  {
    icon: "pin",
    title: "Helper Network",
    body: "Find the nearest verified helper, police station or safe house, wherever you are.",
  },
  {
    icon: "voice",
    title: "AI Companion",
    body: "Ask SafeStep for guidance hands-free, by voice, in English, Sinhala or Tamil.",
  },
  {
    icon: "heart",
    title: "Trusted Circle",
    body: "Add the people you trust. They see your status only when it matters.",
  },
];

export default function Landing() {
  return (
    <div className="landing">
      <header className="landing-nav">
        <Link to="/" className="landing-brand">
          <Logo size={30} />
          <span>SafeStep</span>
        </Link>
        <div className="landing-nav-actions">
          <Link to="/login" className="btn-pill-ghost">Log in</Link>
          <Link to="/register" className="btn-pill-primary">Get SafeStep</Link>
        </div>
      </header>

      <section className="landing-hero">
        <div className="landing-hero-copy">
          <div className="landing-eyebrow">Walk safer, together</div>
          <h1>Your city, with someone always in your corner.</h1>
          <p>
            SafeStep pairs live location sharing, one-tap SOS and voice assist with routes your
            community has already marked safe — so getting there feels lighter.
          </p>
          <div className="landing-hero-actions">
            <Link to="/register" className="btn-pill-primary">Get SafeStep</Link>
            <Link to="/login" className="btn-pill-ghost">I already have an account</Link>
          </div>
        </div>
        <div className="landing-hero-visual">
          {FEATURES.slice(0, 6).map((f) => (
            <div key={f.icon} className="landing-mini-icon">
              <Icon name={f.icon} />
            </div>
          ))}
        </div>
      </section>

      <section className="landing-features">
        {FEATURES.map((f) => (
          <div key={f.title} className="landing-feature-card">
            <div className="landing-feature-icon">
              <Icon name={f.icon} />
            </div>
            <h3>{f.title}</h3>
            <p>{f.body}</p>
          </div>
        ))}
      </section>

      <section className="landing-stats">
        <div className="landing-stat">
          <div className="landing-stat-num">1 tap</div>
          <div className="landing-stat-label">to send an SOS</div>
        </div>
        <div className="landing-stat">
          <div className="landing-stat-num">24/7</div>
          <div className="landing-stat-label">voice assist, hands-free</div>
        </div>
        <div className="landing-stat">
          <div className="landing-stat-num">3</div>
          <div className="landing-stat-label">languages: English, Sinhala, Tamil</div>
        </div>
      </section>

      <section className="landing-cta">
        <h2>Free to start. Set up your trusted circle in under two minutes.</h2>
        <Link to="/register" className="btn-pill-primary">Get SafeStep</Link>
      </section>

      <footer className="landing-footer">
        <div className="landing-brand">
          <Logo size={22} />
          <span>SafeStep</span>
        </div>
        <span>© 2026 SafeStep. Walk safer, together.</span>
      </footer>
    </div>
  );
}
