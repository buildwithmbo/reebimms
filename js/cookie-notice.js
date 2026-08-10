// Cookie notice + consent-gated analytics. Google Analytics is not
// loaded, and no cookie is set, until "Accept" is clicked — the choice
// itself lives in localStorage so storing it needs no consent either.
// See DESIGN.md, Cookie notice.

const ANALYTICS_ID = 'G-G8D4P1377C';
const CONSENT_KEY = 'cookie-consent';

const readConsent = () => {
  try {
    return localStorage.getItem(CONSENT_KEY);
  } catch {
    // Private browsing / storage disabled: treat as undecided, ask again.
    return null;
  }
};

const storeConsent = (value) => {
  try {
    localStorage.setItem(CONSENT_KEY, value);
  } catch {
    // Nothing to do — the session still honours the choice in memory.
  }
};

const loadAnalytics = () => {
  if (document.querySelector('[data-analytics]')) return;

  const tag = document.createElement('script');
  tag.async = true;
  tag.src = `https://www.googletagmanager.com/gtag/js?id=${ANALYTICS_ID}`;
  tag.dataset.analytics = '';
  document.head.append(tag);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    window.dataLayer.push(arguments);
  };
  window.gtag('js', new Date());
  window.gtag('config', ANALYTICS_ID);
};

const buildNotice = () => {
  const notice = document.createElement('aside');
  notice.className = 'cookie-notice';
  notice.setAttribute('aria-label', 'Cookies');
  notice.innerHTML = `
    <p class="cookie-notice__text">We use cookies to measure how this site is
      used, so we can keep making it easier to book. Nothing is set unless you
      accept. <a class="text-link text-link--on-dark" href="/privacy/">Read our
      privacy notice</a>.</p>
    <div class="cookie-notice__actions">
      <button class="button button--fill" type="button" data-consent="accepted">Accept</button>
      <button class="button button--outline" type="button" data-consent="declined">Decline</button>
    </div>
  `;
  return notice;
};

const initCookieNotice = () => {
  const notice = buildNotice();

  const showNotice = () => document.body.append(notice);

  notice.addEventListener('click', (event) => {
    const choice = event.target.dataset.consent;
    if (!choice) return;
    storeConsent(choice);
    notice.remove();
    if (choice === 'accepted') loadAnalytics();
  });

  const consent = readConsent();
  if (consent === 'accepted') loadAnalytics();
  if (!consent) showNotice();

  addSettingsLink(showNotice);
};

// Consent has to be as easy to withdraw as it was to give, so the footer
// carries a link that brings the notice back.
const addSettingsLink = (showNotice) => {
  const credit = document.querySelector('.site-footer__credit');
  if (!credit) return;

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'cookie-settings text-link text-link--on-dark';
  button.textContent = 'Cookies';
  button.addEventListener('click', () => {
    try {
      localStorage.removeItem(CONSENT_KEY);
    } catch {
      // Storage unavailable — showing the notice again is still correct.
    }
    showNotice();
  });

  credit.append(' · ', button);
};

export default initCookieNotice;
