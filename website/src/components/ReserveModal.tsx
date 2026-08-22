import { useEffect, useState, type FormEvent } from 'react';
import { X } from 'lucide-react';

export default function ReserveModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (open) setSent(false);
  }, [open]);

  if (!open) return null;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <div className="fixed inset-0 z-[80] bg-ink/70 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-cream text-ink w-full max-w-md rounded-2xl p-6 md:p-8 relative" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute right-4 top-4 text-ink-soft" aria-label="Close">
          <X className="w-5 h-5" />
        </button>
        <p className="text-[11px] tracking-[0.3em] uppercase text-gold-deep">Table</p>
        <h2 className="font-hindi text-3xl font-bold mt-1">आरक्षण</h2>
        <p className="font-display italic text-lg text-ink-soft">Reserve a table at Mhari Dhani</p>

        {sent ? (
          <p className="mt-6 text-sm leading-relaxed text-ink-soft">
            Thank you. We’ll confirm your table on WhatsApp or a call within a few minutes during open hours.
          </p>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-3">
            <Field label="Name" required />
            <Field label="Phone" type="tel" required />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Date" type="date" required />
              <Field label="Time" type="time" required />
            </div>
            <Field label="Guests" type="number" required />
            <button type="submit" className="w-full h-12 rounded-full bg-ink text-cream font-semibold text-sm tracking-wide mt-2">
              Request table
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function Field({ label, type = 'text', required }: { label: string; type?: string; required?: boolean }) {
  return (
    <label className="block">
      <span className="block text-[10px] tracking-[0.18em] uppercase text-ink-soft/70 mb-1">{label}</span>
      <input
        type={type}
        required={required}
        min={type === 'number' ? 1 : undefined}
        className="w-full h-11 rounded-xl border border-ink/15 bg-white px-3 text-sm"
      />
    </label>
  );
}
