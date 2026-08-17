import { useEffect, useState } from 'react';
import { Plus, X, Trash2 } from 'lucide-react';
import * as api from '../services/api';
import type { Shift, StaffUser } from '../types';

const toISODate = (d: Date) => d.toISOString().slice(0, 10);
const startOfWeek = () => {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay());
  return toISODate(d);
};
const endOfWeek = () => {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay() + 6);
  return toISODate(d);
};

const EMPTY_DRAFT = { user_id: '', shift_date: toISODate(new Date()), start_time: '09:00', end_time: '17:00', label: '' };

export default function RosterPage() {
  const [from, setFrom] = useState(startOfWeek());
  const [to, setTo] = useState(endOfWeek());
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [isAdding, setIsAdding] = useState(false);
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const [actionError, setActionError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const load = () => {
    setIsLoading(true);
    api.getShifts({ from, to })
      .then(({ shifts }) => setShifts(shifts))
      .catch((err) => setError((err as Error).message))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => { load(); }, [from, to]);
  useEffect(() => { api.getStaff().then(({ staff }) => setStaff(staff)).catch(() => {}); }, []);

  const staffOutlet = staff.find((s) => s.id === Number(draft.user_id))?.outlet_id;
  const canSave = draft.user_id && draft.shift_date && draft.start_time && draft.end_time && staffOutlet;

  const save = async () => {
    setIsSubmitting(true);
    setActionError('');
    try {
      const { shift } = await api.createShift({ ...draft, user_id: Number(draft.user_id), outlet_id: staffOutlet });
      setShifts((prev) => [...prev, shift]);
      setIsAdding(false);
      setDraft(EMPTY_DRAFT);
    } catch (err) {
      setActionError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const remove = async (shift: Shift) => {
    if (!confirm(`Remove ${shift.user?.name}'s shift on ${shift.shift_date}?`)) return;
    try {
      await api.deleteShift(shift.id);
      setShifts((prev) => prev.filter((s) => s.id !== shift.id));
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const byDate = shifts.reduce<Record<string, Shift[]>>((acc, s) => {
    (acc[s.shift_date] ??= []).push(s);
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-extrabold text-xl text-ink-900">Shift roster</h1>
          <p className="text-xs text-ink-600 font-semibold mt-1">Schedule staff shifts across outlets</p>
        </div>
        <button onClick={() => setIsAdding(true)} className="flex items-center gap-1.5 h-10 px-4 rounded-[10px] bg-gradient-to-b from-[#3B3849] to-terra text-white font-bold text-xs">
          <Plus className="w-3.5 h-3.5" />
          Add shift
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div>
          <label className="block text-[10px] font-bold uppercase text-text-mute mb-1">From</label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-9 border border-line rounded-lg px-2.5 text-xs font-semibold" />
        </div>
        <div>
          <label className="block text-[10px] font-bold uppercase text-text-mute mb-1">To</label>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-9 border border-line rounded-lg px-2.5 text-xs font-semibold" />
        </div>
      </div>

      {error && <p className="text-xs font-semibold text-coral-deep bg-coral-bg rounded-lg px-3 py-2">{error}</p>}

      {isAdding && (
        <div className="bg-paper border border-line rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-ink-900">Add shift</h2>
            <button onClick={() => setIsAdding(false)}><X className="w-4 h-4 text-ink-600" /></button>
          </div>
          {actionError && <p className="text-xs font-semibold text-coral-deep bg-coral-bg rounded-lg px-3 py-2">{actionError}</p>}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-[10px] font-bold uppercase text-text-mute mb-1">Staff</label>
              <select value={draft.user_id} onChange={(e) => setDraft((d) => ({ ...d, user_id: e.target.value }))} className="w-full h-9 border border-line rounded-lg px-2.5 text-xs font-semibold">
                <option value="">Select staff…</option>
                {staff.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.staff_code})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-text-mute mb-1">Date</label>
              <input type="date" value={draft.shift_date} onChange={(e) => setDraft((d) => ({ ...d, shift_date: e.target.value }))} className="w-full h-9 border border-line rounded-lg px-2.5 text-xs font-semibold" />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-text-mute mb-1">Start</label>
              <input type="time" value={draft.start_time} onChange={(e) => setDraft((d) => ({ ...d, start_time: e.target.value }))} className="w-full h-9 border border-line rounded-lg px-2.5 text-xs font-semibold" />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-text-mute mb-1">End</label>
              <input type="time" value={draft.end_time} onChange={(e) => setDraft((d) => ({ ...d, end_time: e.target.value }))} className="w-full h-9 border border-line rounded-lg px-2.5 text-xs font-semibold" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[10px] font-bold uppercase text-text-mute mb-1">Label (optional)</label>
              <input value={draft.label} onChange={(e) => setDraft((d) => ({ ...d, label: e.target.value }))} placeholder="e.g. Lunch service" className="w-full h-9 border border-line rounded-lg px-2.5 text-xs font-semibold" />
            </div>
          </div>
          <button disabled={!canSave || isSubmitting} onClick={save} className="h-9 px-4 rounded-lg bg-gradient-to-b from-[#3B3849] to-terra text-white font-bold text-xs disabled:opacity-50">
            {isSubmitting ? 'Saving…' : 'Save'}
          </button>
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-ink-600">Loading…</p>
      ) : Object.keys(byDate).length === 0 ? (
        <p className="text-sm text-ink-600 bg-paper border border-line rounded-2xl p-6 text-center">No shifts scheduled in this range.</p>
      ) : (
        Object.entries(byDate).sort(([a], [b]) => a.localeCompare(b)).map(([date, dayShifts]) => (
          <div key={date} className="bg-paper border border-line rounded-2xl overflow-hidden">
            <div className="px-4 py-2.5 bg-terra/[0.04] font-bold text-xs text-ink-900 border-b border-line">
              {new Date(date + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
            </div>
            {dayShifts.map((s) => (
              <div key={s.id} className="flex items-center gap-3 px-4 py-3 border-b border-line last:border-b-0">
                <div className="font-mono text-xs font-bold text-terra-deep w-28 shrink-0">{s.start_time.slice(0, 5)}–{s.end_time.slice(0, 5)}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-xs text-ink-900">{s.user?.name}</div>
                  <div className="text-[10px] text-ink-600">{s.label || s.outlet?.name}</div>
                </div>
                <button onClick={() => remove(s)} className="text-ink-600 hover:text-coral-deep"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            ))}
          </div>
        ))
      )}
    </div>
  );
}
