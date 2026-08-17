// Leaflet's default marker icon paths are relative to its own CSS file location,
// which breaks once bundled by Vite - this points them at the actual bundled
// asset URLs instead. Must run once, before any Marker renders.
import L from 'leaflet';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl, iconRetinaUrl, shadowUrl });
