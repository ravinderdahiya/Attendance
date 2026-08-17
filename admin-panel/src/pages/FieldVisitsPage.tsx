import { useEffect, useState } from 'react';
import * as api from '../services/api';
import type { FieldVisit, StaffUser } from '../types';

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
function durationLabel(v: FieldVisit) {
  if (!v.departed_at) return 'Live';
  const mins = Math.round((new Date(v.departed_at).getTime() - new Date(v.arrived_at).getTime()) / 60000);
  return `${mins}m`;
}

export default function FieldVisitsPage() {
  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [userId, setUserId] = useState<number | null>(null);
  const [visits, setVisits] = useState<FieldVisit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getStaff().then(({ staff }) => { setStaff(staff); setUserId(staff[0]?.id ?? null); }).catch((err) => setError((err as Error).message));
  }, []);

  useEffect(() => {
    if (!userId) return;
    setIsLoading(true);
    api.getFieldVisits(userId)
      .then(({ visits }) => setVisits(visits))
      .catch((err) => setError((err as Error).message))
      .finally(() => setIsLoading(false));
  }, [userId]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-extrabold text-xl text-ink-900">Field visit tracking</h1>
          <p className="text-xs text-ink-600 font-semibold mt-1">Every stop a field employee made today, in order</p>
        </div>
        <select value={userId ?? ''} onChange={(e) => setUserId(Number(e.target.value))} className="h-10 border border-line rounded-lg px-3 text-xs font-semibold bg-white">
          {staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {error && <p className="text-xs font-semibold text-coral-deep bg-coral-bg rounded-lg px-3 py-2">{error}</p>}

      <div className="bg-paper border border-line rounded-2xl p-4">
        <div className="font-bold text-[13px] text-ink-900 mb-3">Today's visits</div>
        {isLoading ? (
          <p className="text-xs text-ink-600 py-4 text-center">Loading…</p>
        ) : visits.length === 0 ? (
          <p className="text-xs text-ink-600 py-4 text-center">No field visits logged today.</p>
        ) : (
          visits.map((v, i) => (
            <div key={v.id} className="flex items-center gap-3 py-2.5 border-b border-ink-300 last:border-b-0">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 font-bold text-xs text-white ${v.departed_at ? 'bg-terra' : 'bg-amber'}`}>
                {i + 1}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-xs text-ink-900">{v.location_name}</div>
                <div className="text-[10px] text-ink-600">
                  {fmtTime(v.arrived_at)}{v.departed_at ? ` – ${fmtTime(v.departed_at)}` : ' – now'}
                </div>
              </div>
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg ${v.departed_at ? 'bg-mint-bg text-mint-deep' : 'bg-amber-bg text-amber'}`}>
                {durationLabel(v)}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
