import { useEffect, useRef, useState } from 'react';
import { ChefHat } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { DEV_USERNAME, DEV_PASSWORD, SKIP_AUTOLOGIN_KEY } from '../auth/devAutoLogin';

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#3B3849] via-terra to-terra-deep px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8">
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-terra text-white flex items-center justify-center shadow-md">
            <ChefHat className="w-7 h-7" />
          </div>
          <h1 className="mt-4 font-extrabold text-xl text-terra-deep">ShiftTrack</h1>
          <p className="text-xs text-text-mute font-semibold mt-1">Manager panel</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wide text-text-mute mb-1.5">Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full h-11 border border-line rounded-xl px-3.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-gold"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wide text-text-mute mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-11 border border-line rounded-xl px-3.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-gold"
            />
          </div>

          {error && <p className="text-xs font-semibold text-coral-deep bg-coral-bg rounded-lg px-3 py-2">{error}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-11 rounded-xl bg-gradient-to-b from-[#3B3849] to-terra text-white font-bold text-sm shadow-md disabled:opacity-60"
          >
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
