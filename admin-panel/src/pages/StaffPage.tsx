import { useEffect, useState } from 'react';
import { Plus, Search, X, Trash2 } from 'lucide-react';
import * as api from '../services/api';
import type { Outlet, StaffUser } from '../types';

const EMPTY_DRAFT = { name: '', mobile: '', staff_code: '', designation: '', department: '', outlet_id: '' };

export default function StaffPage() {
  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [isAdding, setIsAdding] = useState(false);
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const [actionError, setActionError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const load = () => {
    setIsLoading(true);
    api.getStaff(search ? { search } : undefined)
      .then(({ staff }) => setStaff(staff))
      .catch((err) => setError((err as Error).message))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => { load(); }, [search]);
  useEffect(() => { api.getOutlets().then(({ outlets }) => setOutlets(outlets)).catch(() => {}); }, []);

  const canSave = draft.name.trim() && draft.mobile.trim() && draft.staff_code.trim() && draft.outlet_id;

  const save = async () => {
    setIsSubmitting(true);
    setActionError('');
    try {
      const { staff: created } = await api.createStaff({ ...draft, outlet_id: Number(draft.outlet_id) });
      setStaff((prev) => [created, ...prev]);
      setIsAdding(false);
      setDraft(EMPTY_DRAFT);
    } catch (err) {
      setActionError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const remove = async (member: StaffUser) => {
    if (!confirm(`Remove ${member.name}?`)) return;
    try {
      await api.deleteStaff(member.id);
      setStaff((prev) => prev.filter((s) => s.id !== member.id));
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-extrabold text-xl text-ink-900">Staff management</h1>
          <p className="text-xs text-ink-600 font-semibold mt-1">{staff.length} staff</p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-1.5 h-10 px-4 rounded-[10px] bg-gradient-to-b from-[#3B3849] to-terra text-white font-bold text-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          Add staff
        </button>
      </div>

      <div className="relative max-w-xs">
        <Search className="w-3.5 h-3.5 text-text-mute absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or staff ID"
          className="w-full h-10 pl-8 pr-3 text-xs font-semibold border border-ink-300 rounded-[10px]"
        />
      </div>

      {error && <p className="text-xs font-semibold text-coral-deep bg-coral-bg rounded-lg px-3 py-2">{error}</p>}

      {isAdding && (
        <div className="bg-paper border border-line rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-ink-900">Add staff</h2>
            <button onClick={() => setIsAdding(false)}><X className="w-4 h-4 text-ink-600" /></button>
          </div>
          {actionError && <p className="text-xs font-semibold text-coral-deep bg-coral-bg rounded-lg px-3 py-2">{actionError}</p>}
          <div className="grid grid-cols-3 gap-3">
            <Field label="Name" value={draft.name} onChange={(v) => setDraft((d) => ({ ...d, name: v }))} />
            <Field label="Mobile" value={draft.mobile} onChange={(v) => setDraft((d) => ({ ...d, mobile: v }))} />
            <Field label="Staff ID" value={draft.staff_code} onChange={(v) => setDraft((d) => ({ ...d, staff_code: v }))} placeholder="STF-1050" />
            <Field label="Designation" value={draft.designation} onChange={(v) => setDraft((d) => ({ ...d, designation: v }))} />
            <Field label="Department" value={draft.department} onChange={(v) => setDraft((d) => ({ ...d, department: v }))} />
            <div>
              <label className="block text-[10px] font-bold uppercase text-text-mute mb-1">Outlet</label>
              <select
                value={draft.outlet_id}
                onChange={(e) => setDraft((d) => ({ ...d, outlet_id: e.target.value }))}
                className="w-full h-9 border border-line rounded-lg px-2.5 text-xs font-semibold"
              >
                <option value="">Select outlet…</option>
                {outlets.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            </div>
          </div>
          <button
            disabled={!canSave || isSubmitting}
            onClick={save}
            className="h-9 px-4 rounded-lg bg-gradient-to-b from-[#3B3849] to-terra text-white font-bold text-xs disabled:opacity-50"
          >
            {isSubmitting ? 'Saving…' : 'Save'}
          </button>
        </div>
      )}

      <div className="bg-paper border border-line rounded-2xl overflow-x-auto">
        {isLoading ? (
          <p className="text-sm text-ink-600 p-6">Loading…</p>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="text-ink-600 uppercase text-[10px]">
                <th className="text-left p-3 font-bold border-b-2 border-ink-300">Staff</th>
                <th className="text-left p-3 font-bold border-b-2 border-ink-300">Staff ID</th>
                <th className="text-left p-3 font-bold border-b-2 border-ink-300">Role</th>
                <th className="text-left p-3 font-bold border-b-2 border-ink-300">Outlet</th>
                <th className="text-left p-3 font-bold border-b-2 border-ink-300">Status</th>
                <th className="p-3 border-b-2 border-ink-300"></th>
              </tr>
            </thead>
            <tbody>
              {staff.map((s) => (
                <tr key={s.id} className="border-b border-paper hover:bg-paper">
                  <td className="p-3 font-semibold text-ink-900">{s.name}</td>
                  <td className="p-3 font-mono text-ink-600">{s.staff_code}</td>
                  <td className="p-3 text-ink-600">{s.designation ?? '—'}</td>
                  <td className="p-3 text-ink-600">{s.outlet?.name ?? '—'}</td>
                  <td className="p-3">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg ${s.is_active ? 'bg-mint-bg text-mint-deep' : 'bg-coral-bg text-coral-deep'}`}>
                      {s.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <button onClick={() => remove(s)} className="text-ink-600 hover:text-coral-deep"><Trash2 className="w-3.5 h-3.5" /></button>
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

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="block text-[10px] font-bold uppercase text-text-mute mb-1">{label}</label>
      <input
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-9 border border-line rounded-lg px-2.5 text-xs font-semibold"
      />
    </div>
  );
}
