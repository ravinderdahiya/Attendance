import { useEffect, useState } from 'react';

const ADMIN_URL = (import.meta as { env?: { VITE_ADMIN_URL?: string } }).env?.VITE_ADMIN_URL || 'http://localhost:5180';

const LINKS = [
  { href: '#story', label: 'हमारी कहानी' },
  { href: '#menu', label: 'मेन्यू' },
  { href: '#gallery', label: 'गैलरी' },
  { href: '#testimonials', label: 'रिव्यू' },
  { href: '#reserve', label: 'संपर्क' },
];

export default function Nav({ onReserve }: { onReserve: () => void }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-ink/90 backdrop-blur-[10px] border-b border-line">
      <div className="max-w-[1180px] mx-auto px-5 md:px-7 h-[76px] flex items-center justify-between gap-4">
        <a href="#top" className="flex items-center shrink-0">
          <img src="/brand/logo.png" alt="म्हारी ढाणी" className="h-11 w-auto object-contain" />
        </a>

        <nav className="hidden lg:flex items-center gap-8 text-[15px] text-muted">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="relative py-1 hover:text-cream after:absolute after:left-0 after:bottom-0 after:h-0.5 after:w-0 after:bg-coral hover:after:w-full after:transition-all">
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-3 shrink-0">
          <a
            href={ADMIN_URL}
            className="h-10 px-4 rounded-full border border-line text-cream/85 text-sm font-semibold hover:border-coral hover:text-coral transition-colors inline-flex items-center"
          >
            Admin Login
          </a>
          <button
            onClick={onReserve}
            className="h-10 px-[22px] rounded-full bg-coral text-ink font-semibold text-[15px] hover:bg-[#ef7a92] hover:-translate-y-px transition-all"
          >
            टेबल बुक करें
          </button>
        </div>

        <button className="lg:hidden text-cream text-2xl leading-none px-1" onClick={() => setOpen((v) => !v)} aria-label="Menu">
          {open ? '✕' : '☰'}
        </button>
      </div>

      {open && (
        <div className="lg:hidden px-5 pb-6 flex flex-col gap-4 text-base bg-ink/95 border-t border-line">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="text-muted hover:text-cream pt-2">
              {l.label}
            </a>
          ))}
          <a href={ADMIN_URL} className="h-11 rounded-full border border-line text-cream font-semibold inline-flex items-center justify-center">
            Admin Login
          </a>
          <button
            onClick={() => { setOpen(false); onReserve(); }}
            className="h-11 rounded-full bg-coral text-ink font-semibold"
          >
            टेबल बुक करें
          </button>
        </div>
      )}
    </header>
  );
}
