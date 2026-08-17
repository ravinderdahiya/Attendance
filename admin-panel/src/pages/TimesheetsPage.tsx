import { useEffect, useState } from 'react';
import * as api from '../services/api';
import type { TimesheetRow } from '../types';

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

const STATUS_STYLES: Record<string, string> = {
  on_time: 'bg-mint-bg text-mint-deep',
  blocked: 'bg-coral-bg text-coral-deep',
  no_show: 'bg-amber-bg text-amber',
};
const STATUS_LABELS: Record<string, string> = { on_time: 'On time', blocked: 'Blocked', no_show: 'No-show' };

function fmtTime(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function TimesheetsPage() {
  const [from, setFrom] = useState(startOfWeek());
  const [to, setTo] = useState(endOfWeek());
  const [rows, setRows] = useState<TimesheetRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setIsLoading(true);
    api.getTimesheets({ from, to })
      .then(({ rows }) => setRows(rows))
      .catch((err) => setError((err as Error).message))
      .finally(() => setIsLoading(false));
  }, [from, to]);

  const totals = rows.reduce(
    (acc, r) => ({
      worked: acc.worked + (r.worked_hours ?? 0),
      overtime: acc.overtime + r.overtime_hours,
      late: acc.late + (r.late_minutes > 0 ? 1 : 0),
    }),
    { worked: 0, overtime: 0, late: 0 },
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-extrabold text-xl text-ink-900">Employee timesheets</h1>
        <p className="text-xs text-ink-600 font-semibold mt-1">Hours worked, late arrivals, and overtime</p>
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

      {!isLoading && rows.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-paper border border-line rounded-2xl p-4">
            <div className="text-[11px] font-bold text-ink-600">Total hours worked</div>
            <div className="font-mono text-2xl font-bold text-ink-900 mt-2">{totals.worked.toFixed(1)}h</div>
          </div>
          <div className="bg-paper border border-line rounded-2xl p-4">
            <div className="text-[11px] font-bold text-ink-600">Overtime hours</div>
            <div className="font-mono text-2xl font-bold text-ink-900 mt-2">{totals.overtime.toFixed(1)}h</div>
          </div>
          <div className="bg-paper border border-line rounded-2xl p-4">
            <div className="text-[11px] font-bold text-ink-600">Late arrivals</div>
            <div className="font-mono text-2xl font-bold text-ink-900 mt-2">{totals.late}</div>
          </div>
        </div>
      )}

      <div className="bg-paper border border-line rounded-2xl overflow-x-auto">
        {isLoading ? (
          <p className="text-sm text-ink-600 p-6">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-ink-600 p-6 text-center">No scheduled shifts in this range.</p>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="text-ink-600 uppercase text-[10px]">
                <th className="text-left p-3 font-bold border-b-2 border-ink-300">Staff</th>
                <th className="text-left p-3 font-bold border-b-2 border-ink-300">Date</th>
                <th className="text-left p-3 font-bold border-b-2 border-ink-300">Scheduled</th>
                <th className="text-left p-3 font-bold border-b-2 border-ink-300">Clock in / out</th>
                <th className="text-left p-3 font-bold border-b-2 border-ink-300">Worked</th>
                <th className="text-left p-3 font-bold border-b-2 border-ink-300">Late</th>
                <th className="text-left p-3 font-bold border-b-2 border-ink-300">Overtime</th>
                <th className="text-left p-3 font-bold border-b-2 border-ink-300">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={`${r.user_id}-${r.shift_date}-${i}`} className="border-b border-paper">
                  <td className="p-3 font-semibold text-ink-900">{r.name}</td>
                  <td className="p-3 text-ink-600">{new Date(r.shift_date + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</td>
                  <td className="p-3 text-ink-600 font-mono">{r.scheduled_start.slice(0, 5)}–{r.scheduled_end.slice(0, 5)}</td>
                  <td className="p-3 text-ink-600 font-mono">{fmtTime(r.clock_in_at)} – {fmtTime(r.clock_out_at)}</td>
                  <td className="p-3 text-ink-600 font-mono">{r.worked_hours != null ? `${r.worked_hours}h` : '—'}</td>
                  <td className="p-3 text-ink-600">{r.late_minutes > 0 ? `${r.late_minutes}m` : '—'}</td>
                  <td className="p-3 text-ink-600">{r.overtime_hours > 0 ? `${r.overtime_hours}h` : '—'}</td>
                  <td className="p-3">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg ${STATUS_STYLES[r.status]}`}>{STATUS_LABELS[r.status]}</span>
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
