import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Pencil, Plus, Trash2, X } from 'lucide-react';
import * as api from '../services/api';
import type { Shift, StaffUser } from '../types';

const PAGE_SIZE = 10;

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

const dateKey = (value: string) => value.slice(0, 10);

const formatDayHeader = (value: string) => {
  const iso = dateKey(value);
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso || 'Unknown date';
  return d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
};

const toTimeInput = (value: string) => value.slice(0, 5);

const EMPTY_DRAFT = { user_id: '', shift_date: toISODate(new Date()), start_time: '09:00', end_time: '17:00', label: '' };

export default function RosterPage() {
  const [from, setFrom] = useState(startOfWeek());
  const [to, setTo] = useState(endOfWeek());
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Shift | null>(null);
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const [actionError, setActionError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Shift | null>(null);
  const [deleteError, setDeleteError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const load = () => {
    setIsLoading(true);
    api.getShifts({ from, to })
      .then(({ shifts }) => setShifts(shifts))
      .catch((err) => setError((err as Error).message))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => { load(); setPage(1); }, [from, to]);
  useEffect(() => { api.getStaff().then(({ staff }) => setStaff(staff)).catch(() => {}); }, []);

  const staffOutlet = staff.find((s) => s.id === Number(draft.user_id))?.outlet_id
    ?? (editing && Number(draft.user_id) === editing.user_id ? editing.outlet_id : undefined);
  const canSave = draft.user_id && draft.shift_date && draft.start_time && draft.end_time && staffOutlet;

  const closeForm = () => {
    setFormOpen(false);
    setEditing(null);
    setDraft(EMPTY_DRAFT);
    setActionError('');
  };

  const openAdd = () => {
    setEditing(null);
    setDraft(EMPTY_DRAFT);
    setActionError('');
    setFormOpen(true);
  };

  const openEdit = (shift: Shift) => {
    setEditing(shift);
    setDraft({
      user_id: String(shift.user_id),
      shift_date: dateKey(shift.shift_date),
      start_time: toTimeInput(shift.start_time),
      end_time: toTimeInput(shift.end_time),
      label: shift.label ?? '',
    });
    setActionError('');
    setFormOpen(true);
  };

  const save = async () => {
    if (!staffOutlet) return;
    setIsSubmitting(true);
    setActionError('');
    const payload = {
      ...draft,
      user_id: Number(draft.user_id),
      outlet_id: staffOutlet,
      start_time: toTimeInput(draft.start_time),
      end_time: toTimeInput(draft.end_time),
    };
    try {
      if (editing) {
        const { shift } = await api.updateShift(editing.id, payload);
        setShifts((prev) => prev.map((s) => (s.id === editing.id ? shift : s)));
      } else {
        const { shift } = await api.createShift(payload);
        setShifts((prev) => [...prev, shift]);
      }
      closeForm();
    } catch (err) {
      setActionError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDelete = (shift: Shift) => {
    setDeleteTarget(shift);
    setDeleteError('');
  };

  const closeDelete = () => {
    if (isDeleting) return;
    setDeleteTarget(null);
    setDeleteError('');
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    setDeleteError('');
    try {
      await api.deleteShift(deleteTarget.id);
      setShifts((prev) => prev.filter((s) => s.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      setDeleteError((err as Error).message);
    } finally {
      setIsDeleting(false);
    }
  };

  const sortedShifts = useMemo(
    () => [...shifts].sort((a, b) => {
      const dateCmp = dateKey(a.shift_date).localeCompare(dateKey(b.shift_date));
      if (dateCmp !== 0) return dateCmp;
      return a.start_time.localeCompare(b.start_time);
    }),
    [shifts],
  );

  const totalPages = Math.max(1, Math.ceil(sortedShifts.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const pagedShifts = sortedShifts.slice(pageStart, pageStart + PAGE_SIZE);

  const byDate = pagedShifts.reduce<Record<string, Shift[]>>((acc, s) => {
    (acc[dateKey(s.shift_date)] ??= []).push(s);
    return acc;
  }, {});

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-extrabold text-xl text-ink-900">Shift roster</h1>
          <p className="text-xs text-ink-600 font-semibold mt-1">Schedule staff shifts across outlets</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-1.5 h-10 px-4 rounded-[10px] bg-gradient-to-b from-[#3B3849] to-terra text-white font-bold text-xs">
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

      {formOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={closeForm}>
          <div className="bg-paper border border-line rounded-2xl p-5 space-y-3 w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-ink-900">{editing ? 'Edit shift' : 'Add shift'}</h2>
              <button onClick={closeForm}><X className="w-4 h-4 text-ink-600" /></button>
            </div>
            {actionError && <p className="text-xs font-semibold text-coral-deep bg-coral-bg rounded-lg px-3 py-2">{actionError}</p>}
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-[10px] font-bold uppercase text-text-mute mb-1">Staff</label>
                <select value={draft.user_id} onChange={(e) => setDraft((d) => ({ ...d, user_id: e.target.value }))} className="w-full h-9 border border-line rounded-lg px-2.5 text-xs font-semibold">
                  <option value="">Select staff…</option>
                  {staff.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.staff_code})</option>)}
                  {editing && !staff.some((s) => s.id === editing.user_id) && (
                    <option value={editing.user_id}>{editing.user?.name ?? `Staff #${editing.user_id}`}</option>
                  )}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-text-mute mb-1">Date</label>
                <input type="date" value={draft.shift_date} onChange={(e) => setDraft((d) => ({ ...d, shift_date: e.target.value }))} className="w-full h-9 border border-line rounded-lg px-2.5 text-xs font-semibold" />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-text-mute mb-1">Label (optional)</label>
                <input value={draft.label} onChange={(e) => setDraft((d) => ({ ...d, label: e.target.value }))} placeholder="e.g. Lunch service" className="w-full h-9 border border-line rounded-lg px-2.5 text-xs font-semibold" />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-text-mute mb-1">Start</label>
                <input type="time" value={draft.start_time} onChange={(e) => setDraft((d) => ({ ...d, start_time: e.target.value }))} className="w-full h-9 border border-line rounded-lg px-2.5 text-xs font-semibold" />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-text-mute mb-1">End</label>
                <input type="time" value={draft.end_time} onChange={(e) => setDraft((d) => ({ ...d, end_time: e.target.value }))} className="w-full h-9 border border-line rounded-lg px-2.5 text-xs font-semibold" />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button onClick={closeForm} className="h-9 px-4 rounded-lg border border-line text-ink-600 font-bold text-xs">Cancel</button>
              <button disabled={!canSave || isSubmitting} onClick={save} className="h-9 px-4 rounded-lg bg-gradient-to-b from-[#3B3849] to-terra text-white font-bold text-xs disabled:opacity-50">
                {isSubmitting ? 'Saving…' : editing ? 'Save changes' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={closeDelete}>
          <div className="bg-paper border border-line rounded-2xl p-5 space-y-3 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-ink-900">Delete shift</h2>
              <button onClick={closeDelete}><X className="w-4 h-4 text-ink-600" /></button>
            </div>
            <p className="text-xs font-semibold text-ink-600 leading-relaxed">
              Remove <span className="text-ink-900">{deleteTarget.user?.name ?? 'this staff member'}</span>'s shift
              on <span className="text-ink-900">{formatDayHeader(deleteTarget.shift_date)}</span>
              {' '}({toTimeInput(deleteTarget.start_time)}–{toTimeInput(deleteTarget.end_time)})?
              This cannot be undone.
            </p>
            {deleteError && <p className="text-xs font-semibold text-coral-deep bg-coral-bg rounded-lg px-3 py-2">{deleteError}</p>}
            <div className="flex items-center justify-end gap-2 pt-1">
              <button disabled={isDeleting} onClick={closeDelete} className="h-9 px-4 rounded-lg border border-line text-ink-600 font-bold text-xs disabled:opacity-50">Cancel</button>
              <button disabled={isDeleting} onClick={confirmDelete} className="h-9 px-4 rounded-lg bg-coral-deep text-white font-bold text-xs disabled:opacity-50">
                {isDeleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-ink-600">Loading…</p>
      ) : sortedShifts.length === 0 ? (
        <p className="text-sm text-ink-600 bg-paper border border-line rounded-2xl p-6 text-center">No shifts scheduled in this range.</p>
      ) : (
        <>
          {Object.entries(byDate).map(([date, dayShifts]) => (
            <div key={date} className="bg-paper border border-line rounded-2xl overflow-hidden">
              <div className="px-4 py-2.5 bg-terra/[0.04] font-bold text-xs text-ink-900 border-b border-line">
                {formatDayHeader(date)}
              </div>
              {dayShifts.map((s) => (
                <div key={s.id} className="flex items-center gap-3 px-4 py-3 border-b border-line last:border-b-0">
                  <div className="font-mono text-xs font-bold text-terra-deep w-28 shrink-0">{toTimeInput(s.start_time)}–{toTimeInput(s.end_time)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-xs text-ink-900">{s.user?.name}</div>
                    <div className="text-[10px] text-ink-600">{s.label || s.outlet?.name}</div>
                  </div>
                  <button onClick={() => openEdit(s)} className="text-ink-600 hover:text-ink-900" title="Edit shift">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => openDelete(s)} className="text-ink-600 hover:text-coral-deep" title="Delete shift">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ))}

          <div className="flex items-center justify-between bg-paper border border-line rounded-2xl px-4 py-3">
            <p className="text-[11px] font-semibold text-ink-600">
              Showing {pageStart + 1}–{Math.min(pageStart + PAGE_SIZE, sortedShifts.length)} of {sortedShifts.length} shifts
            </p>
            <div className="flex items-center gap-1">
              <button
                disabled={currentPage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-line text-ink-600 disabled:opacity-40"
                title="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  onClick={() => setPage(n)}
                  className={`h-8 min-w-8 px-2 rounded-lg text-[11px] font-bold ${n === currentPage ? 'bg-ink-900 text-white' : 'text-ink-600 hover:bg-terra/[0.06]'}`}
                >
                  {n}
                </button>
              ))}
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-line text-ink-600 disabled:opacity-40"
                title="Next page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
