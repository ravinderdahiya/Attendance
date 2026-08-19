import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import * as api from '../services/api';
import { downloadCsv } from '../utils/csv';
import type { MonthlySummaryRow, TimesheetRow } from '../types';

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
const currentMonth = () => new Date().toISOString().slice(0, 7);

const STATUS_STYLES: Record<string, string> = {
  on_time: 'bg-mint-bg text-mint-deep',
  blocked: 'bg-coral-bg text-coral-deep',
  no_show: 'bg-amber-bg text-amber',
};
const STATUS_LABELS: Record<string, string> = { on_time: 'On time', blocked: 'Blocked', no_show: 'No-show' };

const TABS = [
  { value: 'daily', label: 'Daily log' },
  { value: 'monthly', label: 'Monthly summary' },
] as const;
type Tab = (typeof TABS)[number]['value'];

function fmtTime(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function TimesheetsPage() {
  const [tab, setTab] = useState<Tab>('daily');

  const [from, setFrom] = useState(startOfWeek());
  const [to, setTo] = useState(endOfWeek());
  const [rows, setRows] = useState<TimesheetRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [month, setMonth] = useState(currentMonth());
  const [summaryRows, setSummaryRows] = useState<MonthlySummaryRow[]>([]);
  const [isSummaryLoading, setIsSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState('');

  useEffect(() => {
    setIsLoading(true);
    api.getTimesheets({ from, to })
      .then(({ rows }) => setRows(rows))
      .catch((err) => setError((err as Error).message))
      .finally(() => setIsLoading(false));
  }, [from, to]);

  useEffect(() => {
    setIsSummaryLoading(true);
    api.getMonthlySummary(month)
      .then(({ rows }) => setSummaryRows(rows))
      .catch((err) => setSummaryError((err as Error).message))
      .finally(() => setIsSummaryLoading(false));
  }, [month]);

  const totals = rows.reduce(
    (acc, r) => ({
      worked: acc.worked + (r.worked_hours ?? 0),
      overtime: acc.overtime + r.overtime_hours,
      late: acc.late + (r.late_minutes > 0 ? 1 : 0),
    }),
    { worked: 0, overtime: 0, late: 0 },
  );

  const exportDaily = () => {
    downloadCsv(
      `timesheet_${from}_to_${to}.csv`,
      ['Staff', 'Staff ID', 'Date', 'Scheduled start', 'Scheduled end', 'Clock in', 'Clock out', 'Worked hours', 'Late minutes', 'Overtime hours', 'Status'],
      rows.map((r) => [
        r.name, r.staff_code ?? '', r.shift_date, r.scheduled_start, r.scheduled_end,
        fmtTime(r.clock_in_at), fmtTime(r.clock_out_at), r.worked_hours ?? '', r.late_minutes, r.overtime_hours,
        STATUS_LABELS[r.status] ?? r.status,
      ]),
    );
  };

  const exportMonthly = () => {
    downloadCsv(
      `attendance_summary_${month}.csv`,
      ['Staff', 'Staff ID', 'Designation', 'Scheduled days', 'Present days', 'Leave days', 'Late days', 'Worked hours', 'Overtime hours'],
      summaryRows.map((r) => [
        r.name, r.staff_code ?? '', r.designation ?? '', r.scheduled_days, r.present_days, r.leave_days, r.late_days,
        r.worked_hours, r.overtime_hours,
      ]),
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-extrabold text-xl text-ink-900">Employee timesheets</h1>
          <p className="text-xs text-ink-600 font-semibold mt-1">Hours worked, late arrivals, overtime, and monthly attendance record</p>
        </div>
        <div className="flex items-center gap-1 bg-paper border border-line rounded-[10px] p-1">
          {TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className={`h-8 px-3 rounded-lg text-[11px] font-bold ${tab === t.value ? 'bg-ink-900 text-white' : 'text-ink-600'}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'daily' ? (
        <>
          <div className="flex items-end gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase text-text-mute mb-1">From</label>
              <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-9 border border-line rounded-lg px-2.5 text-xs font-semibold" />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-text-mute mb-1">To</label>
              <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-9 border border-line rounded-lg px-2.5 text-xs font-semibold" />
            </div>
            <button
              disabled={rows.length === 0}
              onClick={exportDaily}
              className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-gradient-to-b from-[#3B3849] to-terra text-white font-bold text-xs disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              Export Excel
            </button>
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
        </>
      ) : (
        <>
          <div className="flex items-end gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase text-text-mute mb-1">Month</label>
              <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="h-9 border border-line rounded-lg px-2.5 text-xs font-semibold" />
            </div>
            <button
              disabled={summaryRows.length === 0}
              onClick={exportMonthly}
              className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-gradient-to-b from-[#3B3849] to-terra text-white font-bold text-xs disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              Export Excel
            </button>
          </div>

          {summaryError && <p className="text-xs font-semibold text-coral-deep bg-coral-bg rounded-lg px-3 py-2">{summaryError}</p>}

          <div className="bg-paper border border-line rounded-2xl overflow-x-auto">
            {isSummaryLoading ? (
              <p className="text-sm text-ink-600 p-6">Loading…</p>
            ) : summaryRows.length === 0 ? (
              <p className="text-sm text-ink-600 p-6 text-center">No scheduled shifts for anyone this month.</p>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-ink-600 uppercase text-[10px]">
                    <th className="text-left p-3 font-bold border-b-2 border-ink-300">Staff</th>
                    <th className="text-left p-3 font-bold border-b-2 border-ink-300">Designation</th>
                    <th className="text-left p-3 font-bold border-b-2 border-ink-300">Scheduled</th>
                    <th className="text-left p-3 font-bold border-b-2 border-ink-300">Present</th>
                    <th className="text-left p-3 font-bold border-b-2 border-ink-300">Leave</th>
                    <th className="text-left p-3 font-bold border-b-2 border-ink-300">Late days</th>
                    <th className="text-left p-3 font-bold border-b-2 border-ink-300">Worked</th>
                    <th className="text-left p-3 font-bold border-b-2 border-ink-300">Overtime</th>
                  </tr>
                </thead>
                <tbody>
                  {summaryRows.map((r) => (
                    <tr key={r.user_id} className="border-b border-paper">
                      <td className="p-3 font-semibold text-ink-900">{r.name}</td>
                      <td className="p-3 text-ink-600">{r.designation ?? '—'}</td>
                      <td className="p-3 text-ink-600 font-mono">{r.scheduled_days}</td>
                      <td className="p-3 text-mint-deep font-mono font-bold">{r.present_days}</td>
                      <td className="p-3 text-coral-deep font-mono font-bold">{r.leave_days}</td>
                      <td className="p-3 text-ink-600 font-mono">{r.late_days}</td>
                      <td className="p-3 text-ink-600 font-mono">{r.worked_hours}h</td>
                      <td className="p-3 text-ink-600 font-mono">{r.overtime_hours}h</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
