import { useEffect, useState } from 'react';
import { Plus, Users, DoorOpen, Hourglass, X } from 'lucide-react';
import * as api from '../services/api';
import StatCard from '../components/StatCard';
import type { Outlet, StaffUser, Visitor, VisitorStats } from '../types';

const EMPTY_DRAFT = { outlet_id: '', name: '', purpose: '', host_user_id: '' };

export default function VisitorsPage() {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [stats, setStats] = useState<VisitorStats | null>(null);
  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [isAdding, setIsAdding] = useState(false);
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const [actionError, setActionError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const load = () => {
    setIsLoading(true);
    api.getVisitors()
      .then(({ visitors, stats }) => { setVisitors(visitors); setStats(stats); })
      .catch((err) => setError((err as Error).message))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => { load(); }, []);
  useEffect(() => {
    api.getStaff().then(({ staff }) => setStaff(staff)).catch(() => {});
    api.getOutlets().then(({ outlets }) => setOutlets(outlets)).catch(() => {});
  }, []);

  const save = async () => {
    setIsSubmitting(true);
    setActionError('');
    try {
      await api.logVisitor({
        outlet_id: Number(draft.outlet_id),
        name: draft.name,
        purpose: draft.purpose,
        host_user_id: draft.host_user_id ? Number(draft.host_user_id) : undefined,
      });
      setIsAdding(false);
      setDraft(EMPTY_DRAFT);
      load();
    } catch (err) {
      setActionError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const checkOut = async (visitor: Visitor) => {
    await api.checkOutVisitor(visitor.id);
    load();
  };

  const canSave = draft.outlet_id && draft.name.trim() && draft.purpose.trim();

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-extrabold text-xl text-ink-900">Visitor log</h1>
          <p className="text-xs text-ink-600 font-semibold mt-1">Every visitor at the gate, with purpose of visit</p>
        </div>
        <button onClick={() => setIsAdding(true)} className="flex items-center gap-1.5 h-10 px-4 rounded-[10px] bg-gradient-to-b from-[#3B3849] to-terra text-white font-bold text-xs">
          <Plus className="w-3.5 h-3.5" />
          Log visitor
        </button>
      </div>

      {error && <p className="text-xs font-semibold text-coral-deep bg-coral-bg rounded-lg px-3 py-2">{error}</p>}

      {stats && (
        <div className="grid grid-cols-3 gap-4">
          <StatCard label="Visitors today" value={stats.today} icon={Users} color="var(--color-terra)" />
          <StatCard label="Currently on-site" value={stats.onSite} icon={DoorOpen} color="var(--color-mint)" />
          <StatCard label="Avg visit duration" value={stats.avgDurationMinutes} icon={Hourglass} color="var(--color-amber)" />
        </div>
      )}

      {isAdding && (
        <div className="bg-paper border border-line rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-ink-900">Log visitor</h2>
            <button onClick={() => setIsAdding(false)}><X className="w-4 h-4 text-ink-600" /></button>
          </div>
          {actionError && <p className="text-xs font-semibold text-coral-deep bg-coral-bg rounded-lg px-3 py-2">{actionError}</p>}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase text-text-mute mb-1">Outlet</label>
              <select value={draft.outlet_id} onChange={(e) => setDraft((d) => ({ ...d, outlet_id: e.target.value }))} className="w-full h-9 border border-line rounded-lg px-2.5 text-xs font-semibold">
                <option value="">Select outlet…</option>
                {outlets.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-text-mute mb-1">Visitor name</label>
              <input value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} className="w-full h-9 border border-line rounded-lg px-2.5 text-xs font-semibold" />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-text-mute mb-1">Purpose</label>
              <input value={draft.purpose} onChange={(e) => setDraft((d) => ({ ...d, purpose: e.target.value }))} placeholder="e.g. Supplier delivery" className="w-full h-9 border border-line rounded-lg px-2.5 text-xs font-semibold" />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-text-mute mb-1">Host (optional)</label>
              <select value={draft.host_user_id} onChange={(e) => setDraft((d) => ({ ...d, host_user_id: e.target.value }))} className="w-full h-9 border border-line rounded-lg px-2.5 text-xs font-semibold">
                <option value="">No host</option>
                {staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>
          <button disabled={!canSave || isSubmitting} onClick={save} className="h-9 px-4 rounded-lg bg-gradient-to-b from-[#3B3849] to-terra text-white font-bold text-xs disabled:opacity-50">
            {isSubmitting ? 'Saving…' : 'Save'}
          </button>
        </div>
      )}

      <div className="bg-paper border border-line rounded-2xl overflow-x-auto">
        {isLoading ? (
          <p className="text-sm text-ink-600 p-6">Loading…</p>
        ) : visitors.length === 0 ? (
          <p className="text-sm text-ink-600 p-6 text-center">No visitors logged today.</p>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="text-ink-600 uppercase text-[10px]">
                <th className="text-left p-3 font-bold border-b-2 border-ink-300">Visitor</th>
                <th className="text-left p-3 font-bold border-b-2 border-ink-300">Purpose</th>
                <th className="text-left p-3 font-bold border-b-2 border-ink-300">Host</th>
                <th className="text-left p-3 font-bold border-b-2 border-ink-300">Check-in</th>
                <th className="text-left p-3 font-bold border-b-2 border-ink-300">Status</th>
                <th className="p-3 border-b-2 border-ink-300"></th>
              </tr>
            </thead>
            <tbody>
              {visitors.map((v) => (
                <tr key={v.id} className="border-b border-paper">
                  <td className="p-3 font-semibold text-ink-900">{v.name}</td>
                  <td className="p-3 text-ink-600">{v.purpose}</td>
                  <td className="p-3 text-ink-600">{v.host?.name ?? '—'}</td>
                  <td className="p-3 text-ink-600">{new Date(v.check_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                  <td className="p-3">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg ${v.check_out_at ? 'bg-ink-300 text-ink-600' : 'bg-mint-bg text-mint-deep'}`}>
                      {v.check_out_at ? 'Checked out' : 'On-site'}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    {!v.check_out_at && (
                      <button onClick={() => checkOut(v)} className="text-[11px] font-bold text-terra">Check out</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
