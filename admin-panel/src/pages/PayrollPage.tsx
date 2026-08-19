import { useEffect, useState } from 'react';
import { Plus, X, ChevronLeft, ChevronRight } from 'lucide-react';
import * as api from '../services/api';
import type { PayrollHistory, PayrollRow } from '../types';

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function shiftMonth(month: string, delta: number) {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(month: string) {
  const [y, m] = month.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString([], { month: 'long', year: 'numeric' });
}

const rupee = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

export default function PayrollPage() {
  const [month, setMonth] = useState(currentMonth());
  const [rows, setRows] = useState<PayrollRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [advanceFor, setAdvanceFor] = useState<PayrollRow | null>(null);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [givenAt, setGivenAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState('');

  const [historyFor, setHistoryFor] = useState<PayrollRow | null>(null);
  const [history, setHistory] = useState<PayrollHistory | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState('');

  const load = () => {
    setIsLoading(true);
    api.getPayroll(month)
      .then(({ rows }) => setRows(rows))
      .catch((err) => setError((err as Error).message))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => { load(); }, [month]);

  const openAdvanceForm = (row: PayrollRow) => {
    setAdvanceFor(row);
    setAmount('');
    setNote('');
    setGivenAt(new Date().toISOString().slice(0, 10));
    setActionError('');
  };

  const saveAdvance = async () => {
    if (!advanceFor || !amount) return;
    setIsSubmitting(true);
    setActionError('');
    try {
      await api.createAdvance({ user_id: advanceFor.user_id, amount: Number(amount), note: note || undefined, given_at: givenAt });
      setAdvanceFor(null);
      load();
    } catch (err) {
      setActionError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalDue = rows.reduce((sum, r) => sum + r.due, 0);

  const openHistory = (row: PayrollRow) => {
    setHistoryFor(row);
    setHistory(null);
    setHistoryError('');
    setIsLoadingHistory(true);
    api.getPayrollHistory(row.user_id)
      .then((data) => setHistory(data))
      .catch((err) => setHistoryError((err as Error).message))
      .finally(() => setIsLoadingHistory(false));
  };

  const removeAdvance = async (advanceId: number) => {
    if (!historyFor || !confirm('Remove this advance?')) return;
    try {
      await api.deleteAdvance(advanceId);
      openHistory(historyFor); // refresh the modal's totals/months
      load(); // refresh the current month's table behind it
    } catch (err) {
      setHistoryError((err as Error).message);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-extrabold text-xl text-ink-900">Payroll</h1>
          <p className="text-xs text-ink-600 font-semibold mt-1">Salary due after advances, per staff member</p>
        </div>
        <div className="flex items-center gap-2 bg-paper border border-line rounded-[10px] px-1 h-10">
          <button onClick={() => setMonth((m) => shiftMonth(m, -1))} className="p-1.5 text-ink-600 hover:text-ink-900"><ChevronLeft className="w-4 h-4" /></button>
          <span className="text-xs font-bold text-ink-900 w-32 text-center">{monthLabel(month)}</span>
          <button onClick={() => setMonth((m) => shiftMonth(m, 1))} className="p-1.5 text-ink-600 hover:text-ink-900"><ChevronRight className="w-4 h-4" /></button>
        </div>
      </div>

      {error && <p className="text-xs font-semibold text-coral-deep bg-coral-bg rounded-lg px-3 py-2">{error}</p>}

      {advanceFor && (
        <div className="bg-paper border border-line rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-ink-900">Add advance — {advanceFor.name}</h2>
            <button onClick={() => setAdvanceFor(null)}><X className="w-4 h-4 text-ink-600" /></button>
          </div>
          {actionError && <p className="text-xs font-semibold text-coral-deep bg-coral-bg rounded-lg px-3 py-2">{actionError}</p>}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase text-text-mute mb-1">Amount (₹)</label>
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ''))}
                placeholder="200"
                className="w-full h-9 border border-line rounded-lg px-2.5 text-xs font-semibold"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-text-mute mb-1">Note (optional)</label>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. lunch"
                className="w-full h-9 border border-line rounded-lg px-2.5 text-xs font-semibold"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-text-mute mb-1">Date</label>
              <input
                type="date"
                value={givenAt}
                onChange={(e) => setGivenAt(e.target.value)}
                className="w-full h-9 border border-line rounded-lg px-2.5 text-xs font-semibold"
              />
            </div>
          </div>
          <button
            disabled={!amount || isSubmitting}
            onClick={saveAdvance}
            className="h-9 px-4 rounded-lg bg-gradient-to-b from-[#3B3849] to-terra text-white font-bold text-xs disabled:opacity-50"
          >
            {isSubmitting ? 'Saving…' : 'Save advance'}
          </button>
        </div>
      )}

      <div className="bg-paper border border-line rounded-2xl overflow-x-auto">
        {isLoading ? (
          <p className="text-sm text-ink-600 p-6">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-ink-600 p-6 text-center">No active staff.</p>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="text-ink-600 uppercase text-[10px]">
                <th className="text-left p-3 font-bold border-b-2 border-ink-300">Staff</th>
                <th className="text-left p-3 font-bold border-b-2 border-ink-300">Pay basis</th>
                <th className="text-left p-3 font-bold border-b-2 border-ink-300">Base pay</th>
                <th className="text-left p-3 font-bold border-b-2 border-ink-300">Advances</th>
                <th className="text-left p-3 font-bold border-b-2 border-ink-300">Due</th>
                <th className="p-3 border-b-2 border-ink-300"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.user_id} className="border-b border-paper hover:bg-paper align-top">
                  <td className="p-3">
                    <button onClick={() => openHistory(r)} className="font-semibold text-ink-900 hover:text-terra-deep hover:underline text-left">
                      {r.name}
                    </button>
                    <div className="text-ink-600 font-mono text-[10px]">{r.staff_code}</div>
                  </td>
                  <td className="p-3 text-ink-600">
                    {r.pay_type === 'daily'
                      ? <>₹{r.pay_rate}/day × {r.present_days} days</>
                      : <>Fixed monthly</>}
                  </td>
                  <td className="p-3 font-semibold text-ink-900">{rupee(r.base_pay)}</td>
                  <td className="p-3">
                    {r.advances_total > 0 ? (
                      <div>
                        <div className="font-semibold text-coral-deep">-{rupee(r.advances_total)}</div>
                        <div className="text-[10px] text-ink-600 mt-0.5 space-y-0.5">
                          {r.advances.map((a) => (
                            <div key={a.id}>{rupee(a.amount)}{a.note ? ` · ${a.note}` : ''} · {a.given_at}</div>
                          ))}
                        </div>
                      </div>
                    ) : <span className="text-ink-600">—</span>}
                  </td>
                  <td className="p-3 font-extrabold text-ink-900">{rupee(r.due)}</td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => openAdvanceForm(r)}
                      className="flex items-center gap-1 h-7 px-2.5 rounded-lg border border-ink-300 text-ink-900 font-bold text-[10px]"
                    >
                      <Plus className="w-3 h-3" />
                      Advance
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={4} className="p-3 text-right font-bold text-ink-900">Total salary still due</td>
                <td className="p-3 font-extrabold text-terra-deep">{rupee(totalDue)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        )}
      </div>

      {historyFor && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-paper border border-line rounded-2xl p-5 space-y-4 w-full max-w-lg max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-bold text-ink-900">{historyFor.name} — full record</h2>
                <p className="text-[10px] text-ink-600 font-mono mt-0.5">{historyFor.staff_code}</p>
              </div>
              <button onClick={() => setHistoryFor(null)}><X className="w-4 h-4 text-ink-600" /></button>
            </div>

            {isLoadingHistory && <p className="text-sm text-ink-600">Loading…</p>}
            {historyError && <p className="text-xs font-semibold text-coral-deep bg-coral-bg rounded-lg px-3 py-2">{historyError}</p>}

            {history && (
              <>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-white border border-line rounded-xl p-3">
                    <div className="text-[9px] font-bold uppercase text-text-mute">Total advances taken</div>
                    <div className="font-extrabold text-coral-deep mt-1">{rupee(history.totals.advances_total)}</div>
                  </div>
                  <div className="bg-white border border-line rounded-xl p-3">
                    <div className="text-[9px] font-bold uppercase text-text-mute">Total salary earned</div>
                    <div className="font-extrabold text-ink-900 mt-1">{rupee(history.totals.base_pay_total)}</div>
                  </div>
                  <div className="bg-white border border-line rounded-xl p-3">
                    <div className="text-[9px] font-bold uppercase text-text-mute">Still due (this month)</div>
                    <div className="font-extrabold text-terra-deep mt-1">{rupee(history.months[0]?.due ?? 0)}</div>
                  </div>
                </div>

                <div>
                  <div className="font-bold text-xs text-ink-900 mb-2">Month by month</div>
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-ink-600 uppercase text-[10px]">
                        <th className="text-left p-2 font-bold border-b-2 border-ink-300">Month</th>
                        <th className="text-left p-2 font-bold border-b-2 border-ink-300">Base pay</th>
                        <th className="text-left p-2 font-bold border-b-2 border-ink-300">Advances</th>
                        <th className="text-left p-2 font-bold border-b-2 border-ink-300">Due</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.months.map((m) => (
                        <tr key={m.month} className="border-b border-paper">
                          <td className="p-2 font-semibold text-ink-900">{monthLabel(m.month)}</td>
                          <td className="p-2 text-ink-600">{rupee(m.base_pay)}</td>
                          <td className="p-2 text-ink-600">{m.advances_total > 0 ? `-${rupee(m.advances_total)}` : '—'}</td>
                          <td className="p-2 font-bold text-ink-900">{rupee(m.due)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div>
                  <div className="font-bold text-xs text-ink-900 mb-2">Every advance taken ({history.advances.length})</div>
                  {history.advances.length === 0 ? (
                    <p className="text-xs text-ink-600">No advances taken yet.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {history.advances.map((a) => (
                        <div key={a.id} className="flex items-center justify-between text-xs border-b border-paper pb-1.5">
                          <div>
                            <span className="font-semibold text-ink-900">{rupee(a.amount)}</span>
                            {a.note && <span className="text-ink-600"> · {a.note}</span>}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-ink-600 font-mono text-[10px]">{a.given_at}</span>
                            <button onClick={() => removeAdvance(a.id)} className="text-ink-600 hover:text-coral-deep">
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
