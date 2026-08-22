import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { DEV_USERNAME, DEV_PASSWORD, SKIP_AUTOLOGIN_KEY } from '../auth/devAutoLogin';

const SITE_URL = (import.meta as { env?: { VITE_SITE_URL?: string } }).env?.VITE_SITE_URL || 'http://localhost:5182';

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState(DEV_USERNAME);
  const [password, setPassword] = useState(DEV_PASSWORD);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const attemptedAutoLogin = useRef(false);

  const doLogin = async (user: string, pass: string) => {
    setError('');
    setIsSubmitting(true);
    try {
      await login(user, pass);
      sessionStorage.removeItem(SKIP_AUTOLOGIN_KEY);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Auto-submit once on mount with the pre-filled dev credentials - but not
  // right after an explicit logout, otherwise logout can never "stick".
  useEffect(() => {
    if (attemptedAutoLogin.current) return;
    attemptedAutoLogin.current = true;
    if (!DEV_USERNAME || !DEV_PASSWORD) return;
    if (sessionStorage.getItem(SKIP_AUTOLOGIN_KEY)) return;
    doLogin(DEV_USERNAME, DEV_PASSWORD);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await doLogin(username, password);
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#131019] text-[#f4ede1]">
      <img
        src="/brand/facade.png"
        alt=""
        className="absolute inset-0 w-full h-full object-cover object-center animate-ken"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#131019] via-[#131019]/45 to-[#131019]/25" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#131019]/80 via-[#131019]/25 to-[#131019]/55" />

      <header className="relative z-10 bg-[#131019]/90 backdrop-blur-[10px] border-b border-white/10">
        <div className="max-w-[1180px] mx-auto px-5 md:px-7 h-[76px] flex items-center justify-between gap-4">
          <a href={SITE_URL} className="shrink-0">
            <img src="/brand/logo.png" alt="म्हारी ढाणी" className="h-11 w-auto object-contain" />
          </a>

          <nav className="hidden lg:flex items-center gap-8 text-[15px] text-[#a79fae]">
            {[
              ['#story', 'हमारी कहानी'],
              ['#menu', 'मेन्यू'],
              ['#gallery', 'गैलरी'],
              ['#testimonials', 'रिव्यू'],
              ['#reserve', 'संपर्क'],
            ].map(([hash, label]) => (
              <a
                key={hash}
                href={`${SITE_URL}${hash}`}
                className="relative py-1 hover:text-[#f4ede1] after:absolute after:left-0 after:bottom-0 after:h-0.5 after:w-0 after:bg-[#E2637E] hover:after:w-full after:transition-all"
              >
                {label}
              </a>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-3 shrink-0">
            <span className="h-10 px-4 rounded-full border border-[#E2637E] text-[#E2637E] text-sm font-semibold inline-flex items-center">
              Admin Login
            </span>
            <a
              href={`${SITE_URL}#reserve`}
              className="h-10 px-[22px] rounded-full bg-[#E2637E] text-[#131019] font-semibold text-[15px] hover:bg-[#ef7a92] inline-flex items-center"
            >
              टेबल बुक करें
            </a>
          </div>

          <a
            href={SITE_URL}
            className="lg:hidden h-10 px-4 rounded-full border border-white/20 text-sm font-semibold inline-flex items-center"
          >
            Website
          </a>
        </div>
      </header>

      <div className="relative z-10 min-h-[calc(100vh-76px)] max-w-[1180px] mx-auto px-6 md:px-10 py-12 grid lg:grid-cols-2 gap-10 items-center">
        <div className="hidden lg:block">
          <p className="font-kalam text-[#E2637E] text-lg -rotate-2 inline-block">— आओ चिल करें</p>
          <h1 className="font-yatra text-5xl xl:text-6xl leading-tight mt-3">
            म्हारी ढाणी
          </h1>
          <p className="mt-2 text-xl text-[#f4ede1]/80">Manager panel</p>
          <p className="mt-5 max-w-md text-[#a79fae] leading-relaxed">
            SCO 22, Red Square, Mehta Nagar · HAU kitchen near Gangotri Hostel.
            नाम बदला है, जगह नहीं।
          </p>
          <p className="mt-8 text-[11px] tracking-[0.22em] uppercase text-[#d9a441]">Hisar · Cafe · 4.8★ · ₹1–200</p>
        </div>

        <div className="w-full max-w-md mx-auto lg:ml-auto bg-[#f4ede1] text-[#131019] rounded-2xl p-7 md:p-8 shadow-[0_24px_60px_rgba(0,0,0,0.35)]">
          <div className="bg-[#131019] rounded-xl px-4 py-3 flex justify-center mb-5">
            <img src="/brand/logo.png" alt="म्हारी ढाणी" className="h-11 w-auto object-contain" />
          </div>
          <p className="text-center text-sm text-[#8C8078] font-semibold mb-5">Manager sign in</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wide text-[#8C8078] mb-1.5">Username</label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full h-11 border border-[#eae0d2] bg-white rounded-xl px-3.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#E2637E]"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wide text-[#8C8078] mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-11 border border-[#eae0d2] bg-white rounded-xl px-3.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#E2637E]"
              />
            </div>

            {error && <p className="text-xs font-semibold text-coral-deep bg-coral-bg rounded-lg px-3 py-2">{error}</p>}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 rounded-full bg-[#E2637E] text-[#131019] font-bold text-sm hover:bg-[#ef7a92] disabled:opacity-60"
            >
              {isSubmitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
