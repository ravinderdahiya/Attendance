import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import * as api from '../services/api';
import type { AttendanceRecord } from '../types';

const FILTERS = [
  { label: 'All', value: undefined },
  { label: 'Verified', value: 'on_time' },
  { label: 'Blocked', value: 'blocked' },
] as const;

export default function LiveMonitorPage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [filter, setFilter] = useState<string | undefined>(undefined);
  const [error, setError] = useState('');

  const load = () => api.getLiveMonitor(filter).then(({ records }) => setRecords(records)).catch((err) => setError((err as Error).message));

  useEffect(() => {
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-extrabold text-xl text-ink-900">Live attendance monitoring</h1>
          <p className="text-xs text-ink-600 font-semibold mt-1">Real-time clock-ins with location verification</p>
        </div>
        <div className="flex items-center gap-1.5 h-10 px-4 rounded-[10px] border border-ink-300 text-ink-900 font-bold text-xs">
          <RefreshCw className="w-3.5 h-3.5" />
          Auto-refreshing
        </div>
      </div>

      {error && <p className="text-xs font-semibold text-coral-deep bg-coral-bg rounded-lg px-3 py-2">{error}</p>}

      <div className="flex gap-2.5">
        {FILTERS.map((f) => (
          <button
            key={f.label}
            onClick={() => setFilter(f.value)}
            className={`px-4 py-2 rounded-[9px] text-[11.5px] font-bold ${filter === f.value ? 'bg-terra text-white' : 'bg-paper border border-line text-ink-600'}`}
          >
            {f.label} ({f.value ? records.filter((r) => r.status === f.value).length : records.length})
          </button>
        ))}
      </div>

      <div className="bg-paper border border-line rounded-2xl overflow-x-auto">
        {records.length === 0 ? (
          <p className="text-sm text-ink-600 p-6">No clock-ins yet today.</p>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="text-ink-600 uppercase text-[10px]">
                <th className="text-left p-3 font-bold border-b-2 border-ink-300">Staff</th>
                <th className="text-left p-3 font-bold border-b-2 border-ink-300">Role</th>
                <th className="text-left p-3 font-bold border-b-2 border-ink-300">Time</th>
                <th className="text-left p-3 font-bold border-b-2 border-ink-300">Distance</th>
                <th className="text-left p-3 font-bold border-b-2 border-ink-300">Status</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.id} className="border-b border-paper">
                  <td className="p-3 font-semibold text-ink-900">{r.user?.name}</td>
                  <td className="p-3 text-ink-600">{r.user?.designation ?? '—'}</td>
                  <td className="p-3 text-ink-600">{r.clock_in_at ? new Date(r.clock_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                  <td className="p-3 text-ink-600">{r.clock_in_distance_m}m</td>
                  <td className="p-3">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg ${r.status === 'on_time' ? 'bg-mint-bg text-mint-deep' : 'bg-coral-bg text-coral-deep'}`}>
                      {r.status === 'on_time' ? 'Verified' : 'Blocked'}
                    </span>
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
