import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useLang } from '../i18n';

interface Section {
  id: string;
  title: string;
  content: string[];
}

export default function HelpPage() {
  const { t } = useLang();
  const location = useLocation();
  const sectionsRef = useRef<HTMLDivElement>(null);

  const sections: Section[] = [
    {
      id: 'getting-started',
      title: t.helpGettingStartedTitle,
      content: t.helpGettingStartedContent,
    },
    {
      id: 'roster',
      title: t.helpRosterTitle,
      content: t.helpRosterContent,
    },
    {
      id: 'budget',
      title: t.helpBudgetTitle,
      content: t.helpBudgetContent,
    },
    {
      id: 'staff',
      title: t.helpStaffTitle,
      content: t.helpStaffContent,
    },
    {
      id: 'stars',
      title: t.helpStarsTitle,
      content: t.helpStarsContent,
    },
    {
      id: 'inducements',
      title: t.helpInducementsTitle,
      content: t.helpInducementsContent,
    },
    {
      id: 'skills',
      title: t.helpSkillsTitle,
      content: t.helpSkillsContent,
    },
    {
      id: 'game-mode',
      title: t.helpGameModeTitle,
      content: t.helpGameModeContent,
    },
    {
      id: 'export',
      title: t.helpExportTitle,
      content: t.helpExportContent,
    },
    {
      id: 'saved',
      title: t.helpSavedTitle,
      content: t.helpSavedContent,
    },
    {
      id: 'shortcuts',
      title: t.helpShortcutsTitle,
      content: t.helpShortcutsContent,
    },
  ];

  // Scroll to section from hash
  useEffect(() => {
    const hash = location.hash.replace('#', '');
    if (hash) {
      const el = document.getElementById(`help-${hash}`);
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
      }
    }
  }, [location.hash]);

  const scrollTo = (id: string) => {
    const el = document.getElementById(`help-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      window.history.replaceState(null, '', `#${id}`);
    }
  };

  return (
    <div className="help-page">
      <div className="help-page-layout">
        {/* Sidebar navigation */}
        <nav className="help-sidebar">
          <h3 className="help-sidebar-title">{t.helpTitle}</h3>
          <ul className="help-nav-list">
            {sections.map(s => (
              <li key={s.id}>
                <button
                  className="help-nav-link"
                  onClick={() => scrollTo(s.id)}
                >
                  {s.title}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Main content */}
        <div className="help-content" ref={sectionsRef}>
          <h2 className="help-page-title">{t.helpPageTitle}</h2>
          <p className="help-page-intro">{t.helpPageIntro}</p>

          {sections.map(s => (
            <section key={s.id} id={`help-${s.id}`} className="help-doc-section">
              <h3 className="help-doc-title">{s.title}</h3>
              {s.content.map((paragraph, i) => (
                <p key={i} className="help-doc-text">{paragraph}</p>
              ))}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
