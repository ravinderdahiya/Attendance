import { useState } from 'react';
import { ChefHat } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await login(username, password);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
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
