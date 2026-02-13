import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '../i18n';

const COOKIE_KEY = 'bb_cookies_accepted';

function isAccepted(): boolean {
  try {
    return localStorage.getItem(COOKIE_KEY) === '1';
  } catch {
    return false;
  }
}

export default function CookieBanner() {
  const [visible, setVisible] = useState(!isAccepted());
  const { t } = useLang();
  const navigate = useNavigate();

  if (!visible) return null;

  const accept = () => {
    try { localStorage.setItem(COOKIE_KEY, '1'); } catch {}
    setVisible(false);
  };

  return (
    <div className="cookie-banner">
      <p className="cookie-text">
        {t.cookieText}{' '}
        <button className="cookie-link" onClick={() => navigate('/privacy')}>
          {t.cookiePolicy}
        </button>
      </p>
      <button className="cookie-accept" onClick={accept}>
        {t.cookieAccept}
      </button>
    </div>
  );
}
