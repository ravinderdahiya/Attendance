const VISITOR_KEY = 'md_visitor_id';
let sentThisLoad = false;

function visitorId(): string {
  try {
    const existing = localStorage.getItem(VISITOR_KEY);
    if (existing) return existing;
    const id = crypto.randomUUID();
    localStorage.setItem(VISITOR_KEY, id);
    return id;
  } catch {
    return crypto.randomUUID();
  }
}

function apiBase(): string {
  const raw = import.meta.env.VITE_API_BASE_URL;
  if (typeof raw === 'string' && raw.trim() !== '') return raw.trim().replace(/\/$/, '');
  return import.meta.env.DEV ? 'http://127.0.0.1:8000' : '';
}

/** Records one page view. Failures are ignored so tracking never blocks the site. */
export function trackVisit(): void {
  if (sentThisLoad) return;
  sentThisLoad = true;
  const payload = JSON.stringify({
    visitor_id: visitorId(),
    referrer: document.referrer || null,
    path: `${window.location.pathname}${window.location.hash}`,
    utm_source: new URLSearchParams(window.location.search).get('utm_source'),
  });

  const url = `${apiBase()}/api/website/visit`;
  const blob = new Blob([payload], { type: 'application/json' });

  try {
    if (navigator.sendBeacon(url, blob)) return;
  } catch {
    // fall through to fetch
  }

  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: payload,
    keepalive: true,
  }).catch(() => {});
}
