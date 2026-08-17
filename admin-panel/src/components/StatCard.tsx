import type { LucideIcon } from 'lucide-react';

export default function StatCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: LucideIcon; color: string }) {
  return (
    <div className="bg-paper border border-line rounded-2xl p-4">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-ink-600">{label}</span>
        <div className="w-8.5 h-8.5 rounded-[10px] flex items-center justify-center text-white shadow-sm" style={{ background: color }}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="font-mono text-[25px] font-bold text-ink-900 mt-3 tracking-tight">{value}</div>
    </div>
  );
}
