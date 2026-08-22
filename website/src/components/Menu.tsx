import { useState } from 'react';
import { MENU, MENU_TABS, type MenuTab } from '../content';

export default function Menu() {
  const [tab, setTab] = useState<MenuTab>('chai');
  const items = MENU[tab];

  return (
    <section id="menu" className="bg-cream text-ink py-24 md:py-32">
      <div className="max-w-6xl mx-auto px-5">
        <div className="text-center mb-12">
          <p className="text-[11px] tracking-[0.38em] uppercase text-gold-deep">The kitchen</p>
          <h2 className="font-hindi text-4xl md:text-5xl font-bold mt-3">मेनू</h2>
          <p className="font-display italic text-xl text-ink-soft mt-2">Chai to thali. Pizza to pasta.</p>
          <div className="gold-rule mx-auto mt-6" />
        </div>

        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {MENU_TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`h-10 px-4 rounded-full text-[11px] tracking-[0.14em] uppercase font-semibold transition-colors ${
                tab === t.id ? 'bg-ink text-cream' : 'bg-white text-ink-soft hover:bg-cream-deep'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-x-16 gap-y-8">
          {items.map((item) => (
            <div key={item.name} className="border-b border-ink/10 pb-6">
              <div className="flex items-baseline justify-between gap-4">
                <div>
                  <h3 className="font-display text-2xl">{item.name}</h3>
                  <p className="font-hindi text-sm text-ink-soft/80">{item.hi}</p>
                </div>
                <span className="text-gold-deep font-semibold whitespace-nowrap">₹{item.price}</span>
              </div>
              <p className="mt-2 text-sm text-ink-soft/70 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
