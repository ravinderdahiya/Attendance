import { useEffect, useState } from 'react';
import { Plus, Trash2, X, Check, Clock, XCircle } from 'lucide-react';
import * as api from '../services/api';
import type { Checkpoint, Outlet, PatrolCheckpointStatus } from '../types';

const STATUS_META: Record<string, { label: string; color: string; icon: typeof Check }> = {
  on_time: { label: 'On time', color: 'bg-mint-bg text-mint-deep', icon: Check },
  late: { label: 'Late', color: 'bg-amber-bg text-amber', icon: Clock },
  missed: { label: 'Missed', color: 'bg-coral-bg text-coral-deep', icon: XCircle },
  pending: { label: 'Pending', color: 'bg-ink-300 text-ink-600', icon: Clock },
};

export default function PatrolsPage() {
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [outletId, setOutletId] = useState<number | null>(null);
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [statuses, setStatuses] = useState<PatrolCheckpointStatus[]>([]);
  const [error, setError] = useState('');

  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [sequence, setSequence] = useState(1);
  const [expectedTime, setExpectedTime] = useState('21:00');
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    api.getOutlets().then(({ outlets }) => { setOutlets(outlets); setOutletId(outlets[0]?.id ?? null); }).catch(() => {});
  }, []);

  const load = () => {
    if (!outletId) return;
    api.getPatrols(outletId).then(({ checkpoints }) => setStatuses(checkpoints)).catch((err) => setError((err as Error).message));
    api.getCheckpoints(outletId).then(({ checkpoints }) => setCheckpoints(checkpoints)).catch(() => {});
  };

  useEffect(() => { load(); const t = setInterval(load, 15000); return () => clearInterval(t); }, [outletId]);

  const addCheckpoint = async () => {
    if (!outletId) return;
    setActionError('');
    try {
      await api.createCheckpoint({ outlet_id: outletId, name, sequence, expected_time: expectedTime });
      setIsAdding(false); setName(''); setSequence(checkpoints.length + 2); setExpectedTime('21:00');
      load();
    } catch (err) {
      setActionError((err as Error).message);
    }
  };

  const removeCheckpoint = async (id: number) => {
    if (!confirm('Remove this checkpoint?')) return;
    await api.deleteCheckpoint(id);
    load();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-extrabold text-xl text-ink-900">Security patrols</h1>
          <p className="text-xs text-ink-600 font-semibold mt-1">Guards scan every checkpoint on their route — a missed round shows up right away</p>
        </div>
        <select value={outletId ?? ''} onChange={(e) => setOutletId(Number(e.target.value))} className="h-10 border border-line rounded-lg px-3 text-xs font-semibold bg-white">
          {outlets.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
      </div>

      {error && <p className="text-xs font-semibold text-coral-deep bg-coral-bg rounded-lg px-3 py-2">{error}</p>}

      <div className="bg-paper border border-line rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="font-bold text-[13px] text-ink-900">Tonight's route</div>
          <button onClick={() => setIsAdding(true)} className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-terra text-white font-bold text-[11px]">
            <Plus className="w-3.5 h-3.5" />
            Add checkpoint
          </button>
        </div>

        {isAdding && (
          <div className="bg-white border border-line rounded-xl p-4 mb-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs">New checkpoint</span>
              <button onClick={() => setIsAdding(false)}><X className="w-4 h-4 text-ink-600" /></button>
            </div>
            {actionError && <p className="text-xs font-semibold text-coral-deep bg-coral-bg rounded-lg px-3 py-2">{actionError}</p>}
            <div className="grid grid-cols-3 gap-3">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Checkpoint name" className="h-9 border border-line rounded-lg px-2.5 text-xs font-semibold" />
              <input type="number" value={sequence} onChange={(e) => setSequence(Number(e.target.value))} placeholder="Order" className="h-9 border border-line rounded-lg px-2.5 text-xs font-semibold" />
              <input type="time" value={expectedTime} onChange={(e) => setExpectedTime(e.target.value)} className="h-9 border border-line rounded-lg px-2.5 text-xs font-semibold" />
            </div>
            <button disabled={!name.trim()} onClick={addCheckpoint} className="h-8 px-3 rounded-lg bg-terra text-white font-bold text-[11px] disabled:opacity-50">Save</button>
          </div>
        )}

        {statuses.length === 0 ? (
          <p className="text-xs text-ink-600 py-4 text-center">No checkpoints defined for this outlet yet.</p>
        ) : (
          statuses.map((cp) => {
            const meta = STATUS_META[cp.status];
            return (
              <div key={cp.id} className="flex items-center gap-3 py-2.5 border-b border-ink-300 last:border-b-0">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${meta.color}`}>
                  <meta.icon className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-xs text-ink-900">{cp.name}</div>
                  <div className="text-[10px] text-ink-600">Expected {cp.expected_time.slice(0, 5)}</div>
                </div>
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg ${meta.color}`}>
                  {cp.scanned_at ? new Date(cp.scanned_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : meta.label}
                </span>
                <button onClick={() => removeCheckpoint(cp.id)} className="text-ink-600 hover:text-coral-deep"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
