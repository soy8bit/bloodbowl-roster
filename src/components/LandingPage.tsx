import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { useLang } from '../i18n';
import logoImg from '../assets/logo.png';
import heroBg from '../assets/hero-bg.webp';

export default function LandingPage() {
  const navigate = useNavigate();
  const { t } = useLang();

  const features = [
    { icon: '\uD83C\uDFC8', title: t.landingFeature1Title, desc: t.landingFeature1Desc },
    { icon: '\uD83D\uDCCB', title: t.landingFeature2Title, desc: t.landingFeature2Desc },
    { icon: '\uD83C\uDFC6', title: t.landingFeature3Title, desc: t.landingFeature3Desc },
    { icon: '\u2B50', title: t.landingFeature4Title, desc: t.landingFeature4Desc },
    { icon: '\uD83C\uDFAE', title: t.landingFeature5Title, desc: t.landingFeature5Desc },
    { icon: '\uD83D\uDD17', title: t.landingFeature6Title, desc: t.landingFeature6Desc },
    { icon: '\uD83D\uDCC8', title: t.landingFeature7Title, desc: t.landingFeature7Desc },
    { icon: '\u2694\uFE0F', title: t.landingFeature8Title, desc: t.landingFeature8Desc },
  ];

  return (
    <div className="landing">
      {/* Hero */}
      <section className="landing-hero" style={{ backgroundImage: `url(${heroBg})` }}>
        <div className="landing-hero-overlay" />
        <div className="landing-hero-content">
          <motion.img
            src={logoImg}
            alt="BB Toolkit Dugout"
            className="landing-logo"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          />
          <motion.h2
            className="landing-title"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
          >
            {t.appTitle}
          </motion.h2>
          <motion.p
            className="landing-tagline"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.25 }}
          >
            {t.landingTagline}
          </motion.p>
          <motion.p
            className="landing-subtitle"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.35 }}
          >
            {t.landingSubtitle}
          </motion.p>
          <motion.span
            className="landing-subtitle2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.45 }}
          >
            {t.landingSubtitle2}
          </motion.span>
          <motion.div
            className="landing-cta-group"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.55 }}
          >
            <button className="landing-cta" onClick={() => navigate('/create')}>
              {t.landingCta}
            </button>
            <button className="landing-cta-secondary" onClick={() => navigate('/my-teams')}>
              {t.landingCtaSaved}
            </button>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="landing-features">
        <h3 className="landing-section-title">{t.landingFeaturesTitle}</h3>
        <div className="landing-features-grid">
          {features.map((f, i) => (
            <motion.div
              key={i}
              className="landing-feature-card"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.35, delay: i * 0.06 }}
            >
              <span className="landing-feature-icon">{f.icon}</span>
              <h4 className="landing-feature-title">{f.title}</h4>
              <p className="landing-feature-desc">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="landing-how">
        <h3 className="landing-section-title">{t.landingHowTitle}</h3>
        <div className="landing-steps">
          <motion.div className="landing-step" initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.3 }}>
            <span className="landing-step-num">1</span>
            <p>{t.landingStep1}</p>
          </motion.div>
          <div className="landing-step-arrow">&rarr;</div>
          <motion.div className="landing-step" initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.3, delay: 0.1 }}>
            <span className="landing-step-num">2</span>
            <p>{t.landingStep2}</p>
          </motion.div>
          <div className="landing-step-arrow">&rarr;</div>
          <motion.div className="landing-step" initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.3, delay: 0.2 }}>
            <span className="landing-step-num">3</span>
            <p>{t.landingStep3}</p>
          </motion.div>
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
