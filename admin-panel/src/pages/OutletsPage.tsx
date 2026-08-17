import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Circle, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Plus, Save, X } from 'lucide-react';
import * as api from '../services/api';
import type { Outlet } from '../types';

const DEFAULT_CENTER: [number, number] = [29.1492, 75.7217];

function ClickToSetCenter({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({ click: (e) => onPick(e.latlng.lat, e.latlng.lng) });
  return null;
}

export default function OutletsPage() {
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [selected, setSelected] = useState<Outlet | null>(null);
  const [error, setError] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [center, setCenter] = useState<[number, number]>(DEFAULT_CENTER);
  const [radius, setRadius] = useState(100);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState('');

  const load = () => api.getOutlets().then(({ outlets }) => setOutlets(outlets)).catch((err) => setError((err as Error).message));
  useEffect(() => { load(); }, []);

  const startAdd = () => {
    setIsAdding(true);
    setSelected(null);
    setName(''); setAddress(''); setCenter(DEFAULT_CENTER); setRadius(100);
    setActionError('');
  };

  const selectOutlet = (o: Outlet) => {
    setIsAdding(false);
    setSelected(o);
    setCenter([o.latitude, o.longitude]);
    setRadius(o.radius_meters);
    setActionError('');
  };

  const save = async () => {
    setIsSubmitting(true);
    setActionError('');
    try {
      if (isAdding) {
        await api.createOutlet({ name, address, latitude: center[0], longitude: center[1], radius_meters: radius });
      } else if (selected) {
        await api.updateOutlet(selected.id, { latitude: center[0], longitude: center[1], radius_meters: radius });
      }
      setIsAdding(false);
      setSelected(null);
      load();
    } catch (err) {
      setActionError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const editing = isAdding || selected;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-extrabold text-xl text-ink-900">Outlet geofence</h1>
          <p className="text-xs text-ink-600 font-semibold mt-1">Click the map to set an outlet's geofence center, then adjust the radius. QR entrance codes live under QR Codes.</p>
        </div>
        <button onClick={startAdd} className="flex items-center gap-1.5 h-10 px-4 rounded-[10px] bg-gradient-to-b from-[#3B3849] to-terra text-white font-bold text-xs">
          <Plus className="w-3.5 h-3.5" />
          Add outlet
        </button>
      </div>

      {error && <p className="text-xs font-semibold text-coral-deep bg-coral-bg rounded-lg px-3 py-2">{error}</p>}

      <div className="grid grid-cols-[1.6fr_1fr] gap-4">
        <div className="bg-paper border border-line rounded-2xl overflow-hidden h-80">
          <MapContainer center={center} zoom={15} style={{ height: '100%', width: '100%' }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
            {editing && (
              <>
                <ClickToSetCenter onPick={(lat, lng) => setCenter([lat, lng])} />
                <Marker position={center} />
                <Circle center={center} radius={radius} pathOptions={{ color: '#232130', fillColor: '#232130', fillOpacity: 0.1 }} />
              </>
            )}
            {!editing && outlets.map((o) => (
              <Circle key={o.id} center={[o.latitude, o.longitude]} radius={o.radius_meters} pathOptions={{ color: '#1D6E72', fillColor: '#1D6E72', fillOpacity: 0.15 }} />
            ))}
          </MapContainer>
        </div>

        <div className="bg-paper border border-line rounded-2xl p-4 space-y-3">
          {editing ? (
            <>
              <div className="flex items-center justify-between">
                <div className="font-bold text-[13px] text-ink-900">{isAdding ? 'New outlet' : selected?.name}</div>
                <button onClick={() => { setIsAdding(false); setSelected(null); }}><X className="w-4 h-4 text-ink-600" /></button>
              </div>
              {actionError && <p className="text-xs font-semibold text-coral-deep bg-coral-bg rounded-lg px-3 py-2">{actionError}</p>}
              {isAdding && (
                <>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-text-mute mb-1">Name</label>
                    <input value={name} onChange={(e) => setName(e.target.value)} className="w-full h-9 border border-line rounded-lg px-2.5 text-xs font-semibold" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-text-mute mb-1">Address</label>
                    <input value={address} onChange={(e) => setAddress(e.target.value)} className="w-full h-9 border border-line rounded-lg px-2.5 text-xs font-semibold" />
                  </div>
                </>
              )}
              <div>
                <label className="block text-[10px] font-bold uppercase text-text-mute mb-1">Radius tolerance</label>
                <input type="range" min={10} max={1000} value={radius} onChange={(e) => setRadius(Number(e.target.value))} className="w-full accent-terra" />
                <div className="font-mono text-xs font-bold text-terra-deep mt-1">{radius} meters</div>
              </div>
              <div className="text-[11px] text-ink-600 font-mono">{center[0].toFixed(5)}°N, {center[1].toFixed(5)}°E</div>
              <button
                disabled={isSubmitting || (isAdding && !name.trim())}
                onClick={save}
                className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-gradient-to-b from-[#3B3849] to-terra text-white font-bold text-xs disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                {isSubmitting ? 'Saving…' : 'Save changes'}
              </button>
            </>
          ) : (
            <>
              <div className="font-bold text-[13px] text-ink-900 mb-1">Outlets</div>
              {outlets.map((o) => (
                <button
                  key={o.id}
                  onClick={() => selectOutlet(o)}
                  className="w-full text-left flex items-center justify-between gap-2 py-2.5 border-b border-ink-300 last:border-b-0"
                >
                  <div>
                    <div className="font-bold text-xs text-ink-900">{o.name}</div>
                    <div className="text-[10px] text-ink-600 font-semibold mt-0.5">{o.staff_count ?? 0} staff · {o.radius_meters}m radius</div>
                  </div>
                  <span className={`text-[9px] font-bold px-2 py-1 rounded-md ${o.is_active ? 'bg-mint-bg text-mint-deep' : 'bg-coral-bg text-coral-deep'}`}>
                    {o.is_active ? 'Live' : 'Inactive'}
                  </span>
                </button>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
