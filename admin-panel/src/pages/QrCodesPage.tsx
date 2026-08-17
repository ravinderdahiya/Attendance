import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Plus, RefreshCw, X } from 'lucide-react';
import * as api from '../services/api';
import type { Outlet, OutletQrCode } from '../types';

function fmtWhen(iso: string | null) {
  if (!iso) return 'Never';
  return new Date(iso).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function QrCodesPage() {
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [codes, setCodes] = useState<OutletQrCode[]>([]);
  const [selected, setSelected] = useState<OutletQrCode | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [label, setLabel] = useState('');
  const [outletId, setOutletId] = useState('');
  const [actionError, setActionError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const load = () => {
    setIsLoading(true);
    api.getQrCodes()
      .then(({ codes }) => {
        setCodes(codes);
        setSelected((prev) => codes.find((c) => c.id === prev?.id) ?? codes[0] ?? null);
      })
      .catch((err) => setError((err as Error).message))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { api.getOutlets().then(({ outlets }) => setOutlets(outlets)).catch(() => {}); }, []);

  const save = async () => {
    setIsSubmitting(true);
    setActionError('');
    try {
      await api.createQrCode({ outlet_id: Number(outletId), label });
      setIsAdding(false);
      setLabel(''); setOutletId('');
      load();
    } catch (err) {
      setActionError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const regenerate = async (code: OutletQrCode) => {
    if (!confirm(`Regenerate "${code.label}"? Any printed copies of the old code will stop working.`)) return;
    const { code: updated } = await api.regenerateQrCode(code.id);
    setCodes((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    setSelected(updated);
  };

  const toggle = async (code: OutletQrCode) => {
    const { code: updated } = await api.toggleQrCode(code.id);
    setCodes((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    setSelected((prev) => (prev?.id === updated.id ? updated : prev));
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-extrabold text-xl text-ink-900">QR codes</h1>
          <p className="text-xs text-ink-600 font-semibold mt-1">One printed code per entrance — scanned alongside GPS for a second layer of proof</p>
        </div>
        <button onClick={() => setIsAdding(true)} className="flex items-center gap-1.5 h-10 px-4 rounded-[10px] bg-gradient-to-b from-[#3B3849] to-terra text-white font-bold text-xs">
          <Plus className="w-3.5 h-3.5" />
          Generate new code
        </button>
      </div>

      {error && <p className="text-xs font-semibold text-coral-deep bg-coral-bg rounded-lg px-3 py-2">{error}</p>}

      {isAdding && (
        <div className="bg-paper border border-line rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-ink-900">New QR code</h2>
            <button onClick={() => setIsAdding(false)}><X className="w-4 h-4 text-ink-600" /></button>
          </div>
          {actionError && <p className="text-xs font-semibold text-coral-deep bg-coral-bg rounded-lg px-3 py-2">{actionError}</p>}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase text-text-mute mb-1">Outlet</label>
              <select value={outletId} onChange={(e) => setOutletId(e.target.value)} className="w-full h-9 border border-line rounded-lg px-2.5 text-xs font-semibold">
                <option value="">Select outlet…</option>
                {outlets.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-text-mute mb-1">Label</label>
              <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Kitchen entry" className="w-full h-9 border border-line rounded-lg px-2.5 text-xs font-semibold" />
            </div>
          </div>
          <button disabled={!label.trim() || !outletId || isSubmitting} onClick={save} className="h-9 px-4 rounded-lg bg-gradient-to-b from-[#3B3849] to-terra text-white font-bold text-xs disabled:opacity-50">
            {isSubmitting ? 'Generating…' : 'Generate'}
          </button>
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-ink-600">Loading…</p>
      ) : codes.length === 0 ? (
        <p className="text-sm text-ink-600 bg-paper border border-line rounded-2xl p-6 text-center">No QR codes yet.</p>
      ) : (
        <div className="grid grid-cols-[0.7fr_1.3fr] gap-4">
          <div className="bg-paper border border-line rounded-2xl p-5 flex flex-col items-center text-center">
            {selected && (
              <>
                <div className="bg-white p-3 rounded-xl border border-line">
                  <QRCodeSVG value={selected.token} size={140} />
                </div>
                <div className="font-extrabold text-[13px] mt-3">{selected.outlet?.name} — {selected.label}</div>
                <div className="text-[11px] text-ink-600 font-semibold mt-0.5">{selected.scan_count} scans · last {fmtWhen(selected.last_scanned_at)}</div>
                <button
                  onClick={() => regenerate(selected)}
                  className="flex items-center gap-1.5 h-8 px-3 mt-3 rounded-lg border border-ink-300 text-ink-900 font-bold text-[11px]"
                >
                  <RefreshCw className="w-3 h-3" />
                  Regenerate
                </button>
              </>
            )}
          </div>

          <div className="bg-paper border border-line rounded-2xl p-4">
            <div className="font-bold text-[13px] text-ink-900 mb-3">All entrance codes</div>
            <table className="w-full text-xs">
              <thead>
                <tr className="text-ink-600 uppercase text-[10px]">
                  <th className="text-left p-2 font-bold border-b-2 border-ink-300">Location</th>
                  <th className="text-left p-2 font-bold border-b-2 border-ink-300">Scans</th>
                  <th className="text-left p-2 font-bold border-b-2 border-ink-300">Last scanned</th>
                  <th className="text-left p-2 font-bold border-b-2 border-ink-300">Status</th>
                </tr>
              </thead>
              <tbody>
                {codes.map((c) => (
                  <tr key={c.id} onClick={() => setSelected(c)} className={`cursor-pointer border-b border-paper hover:bg-paper ${selected?.id === c.id ? 'bg-terra/[0.04]' : ''}`}>
                    <td className="p-2 font-semibold text-ink-900">{c.outlet?.name} — {c.label}</td>
                    <td className="p-2 text-ink-600">{c.scan_count}</td>
                    <td className="p-2 text-ink-600">{fmtWhen(c.last_scanned_at)}</td>
                    <td className="p-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); toggle(c); }}
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-lg ${c.is_active ? 'bg-mint-bg text-mint-deep' : 'bg-coral-bg text-coral-deep'}`}
                      >
                        {c.is_active ? 'Active' : 'Expired'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
