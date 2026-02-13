import { useNavigate } from 'react-router-dom';
import { useLang } from '../i18n';
import logoImg from '../assets/logo.png';

export default function LandingPage() {
  const navigate = useNavigate();
  const { t } = useLang();

  const features = [
    { icon: '\uD83C\uDFC8', title: t.landingFeature1Title, desc: t.landingFeature1Desc },
    { icon: '\uD83D\uDCCA', title: t.landingFeature2Title, desc: t.landingFeature2Desc },
    { icon: '\u2694\uFE0F', title: t.landingFeature3Title, desc: t.landingFeature3Desc },
    { icon: '\u2B50', title: t.landingFeature4Title, desc: t.landingFeature4Desc },
    { icon: '\uD83C\uDFAE', title: t.landingFeature5Title, desc: t.landingFeature5Desc },
    { icon: '\uD83D\uDCC4', title: t.landingFeature6Title, desc: t.landingFeature6Desc },
  ];

  return (
    <div className="landing">
      {/* Hero */}
      <section className="landing-hero">
        <img src={logoImg} alt="BB Roster Maker" className="landing-logo" />
        <h2 className="landing-title">{t.appTitle}</h2>
        <p className="landing-subtitle">{t.landingSubtitle}</p>
        <div className="landing-cta-group">
          <button className="landing-cta" onClick={() => navigate('/create')}>
            {t.landingCta}
          </button>
          <button className="landing-cta-secondary" onClick={() => navigate('/create?v=saved')}>
            {t.landingCtaSaved}
          </button>
        </div>
      </section>

      {/* Features */}
      <section className="landing-features">
        <h3 className="landing-section-title">{t.landingFeaturesTitle}</h3>
        <div className="landing-features-grid">
          {features.map((f, i) => (
            <div key={i} className="landing-feature-card">
              <span className="landing-feature-icon">{f.icon}</span>
              <h4 className="landing-feature-title">{f.title}</h4>
              <p className="landing-feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="landing-how">
        <h3 className="landing-section-title">{t.landingHowTitle}</h3>
        <div className="landing-steps">
          <div className="landing-step">
            <span className="landing-step-num">1</span>
            <p>{t.landingStep1}</p>
          </div>
          <div className="landing-step-arrow">&rarr;</div>
          <div className="landing-step">
            <span className="landing-step-num">2</span>
            <p>{t.landingStep2}</p>
          </div>
          <div className="landing-step-arrow">&rarr;</div>
          <div className="landing-step">
            <span className="landing-step-num">3</span>
            <p>{t.landingStep3}</p>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="landing-bottom-cta">
        <p className="landing-bottom-text">{t.landingBottomText}</p>
        <button className="landing-cta" onClick={() => navigate('/create')}>
          {t.landingCta}
        </button>
      </section>
    </div>
  );
}
