import { useEffect, useState } from 'react';
import { Plus, Save, X } from 'lucide-react';
import * as api from '../services/api';
import type { LabourSite, LabourWorkerRow } from '../types';

export default function LabourPage() {
  const [sites, setSites] = useState<LabourSite[]>([]);
  const [siteId, setSiteId] = useState<number | null>(null);
  const [workers, setWorkers] = useState<LabourWorkerRow[]>([]);
  const [present, setPresent] = useState<Record<number, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [isAdding, setIsAdding] = useState(false);
  const [workerName, setWorkerName] = useState('');
  const [trade, setTrade] = useState('');
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    api.getLabourSites().then(({ sites }) => { setSites(sites); setSiteId(sites[0]?.id ?? null); }).catch((err) => setError((err as Error).message));
  }, []);

  const load = () => {
    if (!siteId) return;
    setIsLoading(true);
    api.getLabourAttendance(siteId)
      .then(({ workers }) => {
        setWorkers(workers);
        setPresent(Object.fromEntries(workers.map((w) => [w.id, w.present_today])));
      })
      .catch((err) => setError((err as Error).message))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => { load(); }, [siteId]);

  const addWorker = async () => {
    if (!siteId) return;
    setActionError('');
    try {
      await api.createLabourWorker({ site_id: siteId, name: workerName, trade });
      setIsAdding(false); setWorkerName(''); setTrade('');
      load();
    } catch (err) {
      setActionError((err as Error).message);
    }
  };

  const save = async () => {
    setIsSaving(true);
    try {
      await api.saveLabourAttendance({
        date: new Date().toISOString().slice(0, 10),
        entries: workers.map((w) => ({ worker_id: w.id, present: present[w.id] ?? false })),
      });
      load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-extrabold text-xl text-ink-900">Labour attendance</h1>
          <p className="text-xs text-ink-600 font-semibold mt-1">Daily wage workers marked present by the site supervisor</p>
        </div>
        <button disabled={isSaving} onClick={save} className="flex items-center gap-1.5 h-10 px-4 rounded-[10px] bg-gradient-to-b from-[#3B3849] to-terra text-white font-bold text-xs disabled:opacity-50">
          <Save className="w-3.5 h-3.5" />
          {isSaving ? 'Saving…' : "Save today's attendance"}
        </button>
      </div>

      {error && <p className="text-xs font-semibold text-coral-deep bg-coral-bg rounded-lg px-3 py-2">{error}</p>}

      <div className="flex items-center gap-2 flex-wrap">
        {sites.map((s) => (
          <button
            key={s.id}
            onClick={() => setSiteId(s.id)}
            className={`px-4 py-2 rounded-[9px] text-[11.5px] font-bold ${siteId === s.id ? 'bg-terra text-white' : 'bg-paper border border-line text-ink-600'}`}
          >
            Site: {s.name}
          </button>
        ))}
        <button onClick={() => setIsAdding(true)} className="flex items-center gap-1 px-3 py-2 rounded-[9px] text-[11.5px] font-bold border border-dashed border-ink-300 text-ink-600">
          <Plus className="w-3.5 h-3.5" />
          Add worker
        </button>
      </div>

      {isAdding && (
        <div className="bg-paper border border-line rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-ink-900">Add worker</h2>
            <button onClick={() => setIsAdding(false)}><X className="w-4 h-4 text-ink-600" /></button>
          </div>
          {actionError && <p className="text-xs font-semibold text-coral-deep bg-coral-bg rounded-lg px-3 py-2">{actionError}</p>}
          <div className="grid grid-cols-2 gap-3">
            <input value={workerName} onChange={(e) => setWorkerName(e.target.value)} placeholder="Worker name" className="h-9 border border-line rounded-lg px-2.5 text-xs font-semibold" />
            <input value={trade} onChange={(e) => setTrade(e.target.value)} placeholder="Trade (e.g. Mason)" className="h-9 border border-line rounded-lg px-2.5 text-xs font-semibold" />
          </div>
          <button disabled={!workerName.trim() || !trade.trim()} onClick={addWorker} className="h-9 px-4 rounded-lg bg-gradient-to-b from-[#3B3849] to-terra text-white font-bold text-xs disabled:opacity-50">Save</button>
        </div>
      )}

      <div className="bg-paper border border-line rounded-2xl overflow-x-auto">
        {isLoading ? (
          <p className="text-sm text-ink-600 p-6">Loading…</p>
        ) : workers.length === 0 ? (
          <p className="text-sm text-ink-600 p-6 text-center">No workers at this site yet.</p>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="text-ink-600 uppercase text-[10px]">
                <th className="text-left p-3 font-bold border-b-2 border-ink-300">Worker</th>
                <th className="text-left p-3 font-bold border-b-2 border-ink-300">Trade</th>
                <th className="text-left p-3 font-bold border-b-2 border-ink-300">Days this month</th>
                <th className="text-left p-3 font-bold border-b-2 border-ink-300">Today</th>
              </tr>
            </thead>
            <tbody>
              {workers.map((w) => (
                <tr key={w.id} className="border-b border-paper">
                  <td className="p-3 font-semibold text-ink-900">{w.name}</td>
                  <td className="p-3 text-ink-600">{w.trade}</td>
                  <td className="p-3 text-ink-600">{w.days_present_this_month}/{w.days_recorded_this_month || '—'}</td>
                  <td className="p-3">
                    <button
                      onClick={() => setPresent((p) => ({ ...p, [w.id]: !p[w.id] }))}
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-lg ${present[w.id] ? 'bg-mint-bg text-mint-deep' : 'bg-coral-bg text-coral-deep'}`}
                    >
                      {present[w.id] ? 'Present' : 'Absent'}
                    </button>
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
