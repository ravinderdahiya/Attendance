import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { SLIDES } from '../content';

export default function Hero({ onReserve }: { onReserve: () => void }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIndex((i) => (i + 1) % SLIDES.length), 5000);
    return () => clearInterval(t);
  }, []);

  const go = (dir: number) => setIndex((i) => (i + dir + SLIDES.length) % SLIDES.length);

  return (
    <section id="top" className="relative h-[100svh] min-h-[640px] overflow-hidden">
      {SLIDES.map((slide, i) => (
        <div key={slide.src} className={`absolute inset-0 transition-opacity duration-1000 ${i === index ? 'opacity-100' : 'opacity-0'}`}>
          <img
            src={slide.src}
            alt=""
            className={`w-full h-full object-cover object-center ${i === index ? 'animate-ken' : ''}`}
          />
        </div>
      ))}
      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/35 to-ink/20" />

      <div className="relative z-10 h-full max-w-6xl mx-auto px-5 flex flex-col justify-end pb-20 md:pb-24">
        <p className="animate-rise text-[11px] tracking-[0.38em] uppercase text-gold mb-4">Hisar · Cafe · ₹1–200 · 4.8★</p>
        <h1 className="animate-rise font-hindi text-[52px] sm:text-[72px] md:text-[92px] leading-[0.95] font-bold">
          म्हारी ढाणी
        </h1>
        <p className="animate-rise font-display italic text-2xl md:text-4xl text-cream/90 mt-3">Mhari Dhani</p>
        <p className="animate-rise mt-5 max-w-xl text-cream/75 text-sm md:text-base leading-relaxed">
          SCO 22, Red Square, Mehta Nagar — and a second kitchen at HAU.
          नाम बदला है, जगह नहीं।
        </p>
        <div className="animate-rise mt-8 flex flex-wrap gap-3">
          <a href="#menu" className="h-12 px-7 rounded-full bg-gold text-ink font-semibold text-sm tracking-wide hover:bg-cream transition-colors inline-flex items-center">
            See the menu
          </a>
          <button onClick={onReserve} className="h-12 px-7 rounded-full border border-cream/40 text-cream font-semibold text-sm tracking-wide hover:border-gold hover:text-gold transition-colors">
            Reserve a table
          </button>
        </div>
        <p className="mt-8 text-[11px] tracking-[0.2em] uppercase text-cream/55">{SLIDES[index].caption}</p>
      </div>

      <button type="button" onClick={() => go(-1)} className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white/90 text-ink flex items-center justify-center hover:bg-white" aria-label="Previous">
        <ChevronLeft className="w-6 h-6" />
      </button>
      <button type="button" onClick={() => go(1)} className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white/90 text-ink flex items-center justify-center hover:bg-white" aria-label="Next">
        <ChevronRight className="w-6 h-6" />
      </button>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {SLIDES.map((_, i) => (
          <button key={i} type="button" onClick={() => setIndex(i)} className={`h-1.5 rounded-full transition-all ${i === index ? 'w-8 bg-gold' : 'w-3 bg-white/50'}`} aria-label={`Slide ${i + 1}`} />
        ))}
      </div>
    </section>
  );
}
