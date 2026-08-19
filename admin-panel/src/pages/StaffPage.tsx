import { useEffect, useState } from 'react';
import { Plus, Search, X, Pencil, Power } from 'lucide-react';
import * as api from '../services/api';
import type { Outlet, StaffUser } from '../types';

const EMPTY_DRAFT = {
  name: '', mobile: '', pin: '', designation: '',
  outlet_id: '', pay_type: 'monthly' as const, pay_rate: '',
};

const DESIGNATIONS = [
  'Manager', 'Assistant Manager', 'Chef', 'Sous Chef', 'Cook', 'Kitchen Helper',
  'Cashier', 'Waiter', 'Host/Hostess', 'Counter Staff', 'Barista', 'Delivery Rider',
  'Dishwasher', 'Cleaner', 'Security Guard',
];

const STATUS_FILTERS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'all', label: 'All' },
] as const;

type StatusFilter = (typeof STATUS_FILTERS)[number]['value'];

export default function StaffPage() {
  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [isAdding, setIsAdding] = useState(false);
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const [actionError, setActionError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [editTarget, setEditTarget] = useState<StaffUser | null>(null);
  const [editDraft, setEditDraft] = useState(EMPTY_DRAFT);
  const [editError, setEditError] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const load = () => {
    setIsLoading(true);
    api.getStaff(search ? { search } : undefined)
      .then(({ staff }) => setStaff(staff))
      .catch((err) => setError((err as Error).message))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => { load(); }, [search]);
  useEffect(() => { api.getOutlets().then(({ outlets }) => setOutlets(outlets)).catch(() => {}); }, []);

  const visibleStaff = staff.filter((s) => (
    statusFilter === 'all' ? true : statusFilter === 'active' ? s.is_active : !s.is_active
  ));

  // Same mobile number can't belong to two staff members - checked here for instant
  // feedback, and enforced again server-side (source of truth, also catches races).
  const isMobileTaken = (mobile: string, excludeId?: number) =>
    mobile.trim() !== '' && staff.some((s) => s.id !== excludeId && s.mobile === mobile.trim());

  const mobileTaken = isMobileTaken(draft.mobile);

  const canSave = draft.name.trim() && draft.mobile.trim() && !mobileTaken && draft.outlet_id
    && /^\d{4}$/.test(draft.pin) && draft.pay_rate.trim();

  const save = async () => {
    setIsSubmitting(true);
    setActionError('');
    try {
      const { staff: created } = await api.createStaff({
        ...draft,
        outlet_id: Number(draft.outlet_id),
        pay_rate: Number(draft.pay_rate),
      });
      setStaff((prev) => [created, ...prev]);
      setIsAdding(false);
      setDraft(EMPTY_DRAFT);
    } catch (err) {
      setActionError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleActive = async (member: StaffUser) => {
    const nextActive = !member.is_active;
    if (!nextActive && !confirm(`Mark ${member.name} as inactive? Their record and history stay saved - you can reactivate them anytime.`)) return;
    try {
      const { staff: updated } = await api.updateStaff(member.id, { is_active: nextActive });
      setStaff((prev) => prev.map((s) => (s.id === member.id ? updated : s)));
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const openEdit = (member: StaffUser) => {
    setEditTarget(member);
    setEditDraft({
      name: member.name ?? '',
      mobile: member.mobile ?? '',
      pin: member.pin ?? '',
      designation: member.designation ?? '',
      outlet_id: member.outlet_id ? String(member.outlet_id) : '',
      pay_type: (member.pay_type ?? 'monthly') as 'monthly',
      pay_rate: member.pay_rate != null ? String(member.pay_rate) : '',
    });
    setEditError('');
  };

  const mobileTakenEdit = isMobileTaken(editDraft.mobile, editTarget?.id);

  const canSaveEdit = editDraft.name.trim() && editDraft.mobile.trim() && !mobileTakenEdit && editDraft.outlet_id
    && /^\d{4}$/.test(editDraft.pin) && editDraft.pay_rate.trim();

  const saveEdit = async () => {
    if (!editTarget) return;
    setIsSavingEdit(true);
    setEditError('');
    try {
      const { staff: updated } = await api.updateStaff(editTarget.id, {
        ...editDraft,
        outlet_id: Number(editDraft.outlet_id),
        pay_rate: Number(editDraft.pay_rate),
      });
      setStaff((prev) => prev.map((s) => (s.id === editTarget.id ? updated : s)));
      setEditTarget(null);
    } catch (err) {
      setEditError((err as Error).message);
    } finally {
      setIsSavingEdit(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-extrabold text-xl text-ink-900">Staff management</h1>
          <p className="text-xs text-ink-600 font-semibold mt-1">{visibleStaff.length} staff</p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-1.5 h-10 px-4 rounded-[10px] bg-gradient-to-b from-[#3B3849] to-terra text-white font-bold text-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          Add staff
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="w-3.5 h-3.5 text-text-mute absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or staff ID"
            className="w-full h-10 pl-9 pr-3 text-xs font-semibold border border-ink-300 rounded-[10px]"
          />
        </div>
        <div className="flex items-center gap-1 bg-paper border border-line rounded-[10px] p-1">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`h-8 px-3 rounded-lg text-[11px] font-bold ${
                statusFilter === f.value ? 'bg-ink-900 text-white' : 'text-ink-600'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
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
            <div>
              <Field label="Mobile" value={draft.mobile} onChange={(v) => setDraft((d) => ({ ...d, mobile: v }))} />
              {mobileTaken && <p className="text-[10px] font-bold text-coral-deep mt-1">This number is already registered to another staff member.</p>}
            </div>
            <Field
              label="Login PIN (4 digit)"
              value={draft.pin}
              onChange={(v) => setDraft((d) => ({ ...d, pin: v.replace(/\D/g, '').slice(0, 4) }))}
              placeholder="1234"
            />
            <div>
              <label className="block text-[10px] font-bold uppercase text-text-mute mb-1">Designation</label>
              <select
                value={draft.designation}
                onChange={(e) => setDraft((d) => ({ ...d, designation: e.target.value }))}
                className="w-full h-9 border border-line rounded-lg px-2.5 text-xs font-semibold"
              >
                <option value="">Select designation…</option>
                {DESIGNATIONS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
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
            <Field
              label="Monthly salary (₹)"
              value={draft.pay_rate}
              onChange={(v) => setDraft((d) => ({ ...d, pay_rate: v.replace(/[^\d.]/g, '') }))}
              placeholder="15000"
            />
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
                <th className="text-left p-3 font-bold border-b-2 border-ink-300">Mobile</th>
                <th className="text-left p-3 font-bold border-b-2 border-ink-300">PIN</th>
                <th className="text-left p-3 font-bold border-b-2 border-ink-300">Staff ID</th>
                <th className="text-left p-3 font-bold border-b-2 border-ink-300">Role</th>
                <th className="text-left p-3 font-bold border-b-2 border-ink-300">Outlet</th>
                <th className="text-left p-3 font-bold border-b-2 border-ink-300">Pay</th>
                <th className="text-left p-3 font-bold border-b-2 border-ink-300">Status</th>
                <th className="p-3 border-b-2 border-ink-300"></th>
              </tr>
            </thead>
            <tbody>
              {visibleStaff.map((s) => (
                <tr key={s.id} className="border-b border-paper hover:bg-paper">
                  <td className="p-3 font-semibold text-ink-900">{s.name}</td>
                  <td className="p-3 font-mono text-ink-600">{s.mobile ?? '—'}</td>
                  <td className="p-3 font-mono text-ink-600">{s.pin ?? '—'}</td>
                  <td className="p-3 font-mono text-ink-600">{s.staff_code}</td>
                  <td className="p-3 text-ink-600">{s.designation ?? '—'}</td>
                  <td className="p-3 text-ink-600">{s.outlet?.name ?? '—'}</td>
                  <td className="p-3 text-ink-600">
                    {s.pay_rate ? `₹${s.pay_rate}${s.pay_type === 'daily' ? '/day' : '/mo'}` : '—'}
                  </td>
                  <td className="p-3">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg ${s.is_active ? 'bg-mint-bg text-mint-deep' : 'bg-coral-bg text-coral-deep'}`}>
                      {s.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="p-3 text-right space-x-3 whitespace-nowrap">
                    <button onClick={() => openEdit(s)} className="text-ink-600 hover:text-ink-900" title="Edit details">
                      <Pencil className="w-3.5 h-3.5 inline" />
                    </button>
                    <button
                      onClick={() => toggleActive(s)}
                      className={s.is_active ? 'text-ink-600 hover:text-coral-deep' : 'text-ink-600 hover:text-mint-deep'}
                      title={s.is_active ? 'Mark inactive' : 'Mark active'}
                    >
                      <Power className="w-3.5 h-3.5 inline" />
                    </button>
                  </td>
                </tr>
              ))}
              {visibleStaff.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-6 text-center text-ink-600 font-semibold">No {statusFilter === 'all' ? '' : statusFilter} staff to show.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {editTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-paper border border-line rounded-2xl p-5 space-y-3 w-full max-w-md">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-ink-900">Edit staff — {editTarget.name}</h2>
              <button onClick={() => setEditTarget(null)}><X className="w-4 h-4 text-ink-600" /></button>
            </div>
            {editError && <p className="text-xs font-semibold text-coral-deep bg-coral-bg rounded-lg px-3 py-2">{editError}</p>}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Name" value={editDraft.name} onChange={(v) => setEditDraft((d) => ({ ...d, name: v }))} />
              <div>
                <Field label="Mobile" value={editDraft.mobile} onChange={(v) => setEditDraft((d) => ({ ...d, mobile: v }))} />
                {mobileTakenEdit && <p className="text-[10px] font-bold text-coral-deep mt-1">This number is already registered to another staff member.</p>}
              </div>
              <Field
                label="Login PIN (4 digit)"
                value={editDraft.pin}
                onChange={(v) => setEditDraft((d) => ({ ...d, pin: v.replace(/\D/g, '').slice(0, 4) }))}
                placeholder="1234"
              />
              <div>
                <label className="block text-[10px] font-bold uppercase text-text-mute mb-1">Designation</label>
                <select
                  value={editDraft.designation}
                  onChange={(e) => setEditDraft((d) => ({ ...d, designation: e.target.value }))}
                  className="w-full h-9 border border-line rounded-lg px-2.5 text-xs font-semibold"
                >
                  <option value="">Select designation…</option>
                  {DESIGNATIONS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-text-mute mb-1">Outlet</label>
                <select
                  value={editDraft.outlet_id}
                  onChange={(e) => setEditDraft((d) => ({ ...d, outlet_id: e.target.value }))}
                  className="w-full h-9 border border-line rounded-lg px-2.5 text-xs font-semibold"
                >
                  <option value="">Select outlet…</option>
                  {outlets.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
              </div>
              <Field
                label="Monthly salary (₹)"
                value={editDraft.pay_rate}
                onChange={(v) => setEditDraft((d) => ({ ...d, pay_rate: v.replace(/[^\d.]/g, '') }))}
                placeholder="15000"
              />
            </div>
            <button
              disabled={!canSaveEdit || isSavingEdit}
              onClick={saveEdit}
              className="h-9 px-4 rounded-lg bg-gradient-to-b from-[#3B3849] to-terra text-white font-bold text-xs disabled:opacity-50"
            >
              {isSavingEdit ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </div>
      )}
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
