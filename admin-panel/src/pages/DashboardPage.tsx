import { useEffect, useState } from 'react';
import { Users, Check, X, MapPinOff } from 'lucide-react';
import * as api from '../services/api';
import StatCard from '../components/StatCard';
import type { DashboardStats, TrendPoint } from '../types';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getDashboard()
      .then((res) => { setStats(res.stats); setTrend(res.trend); })
      .catch((err) => setError((err as Error).message));
  }, []);

  const maxCount = Math.max(1, ...trend.map((t) => t.on_time_count));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-extrabold text-xl text-ink-900">Dashboard</h1>
        <p className="text-xs text-ink-600 font-semibold mt-1">Spice Route Kitchen — Sector 15, Hisar</p>
      </div>

      {error && <p className="text-xs font-semibold text-coral-deep bg-coral-bg rounded-lg px-3 py-2">{error}</p>}

      {stats && (
        <>
          <div className="grid grid-cols-4 gap-4">
            <StatCard label="Total staff" value={stats.totalStaff} icon={Users} color="var(--color-terra)" />
            <StatCard label="Clocked in today" value={stats.clockedInToday} icon={Check} color="var(--color-mint)" />
            <StatCard label="No-show today" value={stats.noShowToday} icon={X} color="var(--color-coral)" />
            <StatCard label="Blocked (out of range)" value={stats.blockedToday} icon={MapPinOff} color="var(--color-amber)" />
          </div>

          <div className="bg-paper border border-line rounded-2xl p-5">
            <div className="font-extrabold text-[13px] text-ink-900 mb-3.5">Attendance trend — last 14 days</div>
            {trend.length === 0 ? (
              <p className="text-xs text-ink-600">No attendance data yet.</p>
            ) : (
              <div className="flex items-end gap-1.5 h-28">
                {trend.map((t) => (
                  <div
                    key={t.shift_date}
                    title={`${t.shift_date}: ${t.on_time_count}`}
                    className="flex-1 rounded-t-[5px] bg-gradient-to-b from-[#3B3849] to-terra"
                    style={{ height: `${Math.max(4, (t.on_time_count / maxCount) * 100)}%` }}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
