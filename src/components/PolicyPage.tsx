import { useLang } from '../i18n';

export default function PolicyPage() {
  const { t } = useLang();

  const sections = [
    { title: t.policyIntroTitle, paragraphs: t.policyIntroContent },
    { title: t.policyCookiesTitle, paragraphs: t.policyCookiesContent },
    { title: t.policyLocalStorageTitle, paragraphs: t.policyLocalStorageContent },
    { title: t.policyDataTitle, paragraphs: t.policyDataContent },
    { title: t.policyThirdPartyTitle, paragraphs: t.policyThirdPartyContent },
    { title: t.policyRightsTitle, paragraphs: t.policyRightsContent },
    { title: t.policyContactTitle, paragraphs: t.policyContactContent },
  ];

  return (
    <div className="policy-page">
      <h2 className="policy-title">{t.policyTitle}</h2>
      <p className="policy-updated">{t.policyUpdated}</p>

      {sections.map((s, i) => (
        <section key={i} className="policy-section">
          <h3 className="policy-section-title">{s.title}</h3>
          {s.paragraphs.map((p, j) => (
            <p key={j} className="policy-text">{p}</p>
          ))}
        </section>
      ))}
    </div>
  );
}
