import { useEffect, useState } from 'react';
import { Clock, MapPin } from 'lucide-react';
import Nav from './components/Nav';
import Hero from './components/Hero';
import Menu from './components/Menu';
import Footer from './components/Footer';
import ReserveModal from './components/ReserveModal';
import { GALLERY, OUTLETS } from './content';
import { trackVisit } from './trackVisit';

export default function App() {
  const [reserveOpen, setReserveOpen] = useState(false);

  useEffect(() => {
    trackVisit();
  }, []);

  return (
    <div className="bg-ink text-cream">
      <Nav onReserve={() => setReserveOpen(true)} />
      <Hero onReserve={() => setReserveOpen(true)} />

      <section id="story" className="relative py-24 md:py-32">
        <div className="max-w-6xl mx-auto px-5 grid md:grid-cols-2 gap-12 md:gap-20 items-center">
          <div className="relative">
            <img src="/brand/entrance.png" alt="Entrance of Mhari Dhani" className="w-full aspect-[4/5] object-cover rounded-sm" />
            <div className="absolute -bottom-6 -right-2 md:-right-8 bg-gold text-ink px-6 py-4 font-display italic text-lg max-w-[220px]">
              नाम बदला है, जगह नहीं!
            </div>
          </div>
          <div>
            <p className="text-[11px] tracking-[0.38em] uppercase text-gold">Our story</p>
            <h2 className="font-hindi text-4xl md:text-5xl font-bold mt-3 leading-tight">एक ढाणी,<br />नया नाम।</h2>
            <div className="gold-rule-left mt-6 mb-6" />
            <p className="text-cream/75 leading-relaxed">
              Mhari Dhani is a restaurant built like a home — a wooden gable over the steps,
              warm lights inside, and a kitchen that still knows chai as well as it knows pasta.
            </p>
            <p className="text-cream/75 leading-relaxed mt-4">
              The board outside changed. The place did not. Come for a kulhad of masala chai,
              stay for a thali, a pizza, or a long table in the basement when the city is too loud.
            </p>
            <dl className="mt-10 grid grid-cols-3 gap-4 text-center">
              <Stat n="2" l="outlets" />
              <Stat n="4.8★" l="Red Square" />
              <Stat n="₹1–200" l="price" />
            </dl>
          </div>
        </div>
      </section>

      <section id="spaces" className="bg-[#0E0C0A] py-24 md:py-32">
        <div className="max-w-6xl mx-auto px-5">
          <div className="text-center mb-14">
            <p className="text-[11px] tracking-[0.38em] uppercase text-gold">Choose your mood</p>
            <h2 className="font-hindi text-4xl md:text-5xl font-bold mt-3">दो मंज़िल, दो मिज़ाज</h2>
            <p className="font-display italic text-xl text-cream/70 mt-2">Two floors. Two tempos.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <SpaceCard
              image="/brand/facade.png"
              kicker="Ground floor"
              title="Mehfil"
              hindi="महफ़िल"
              copy="Lively. Social. Raunak. The street-facing room for groups, first dates that go well, and the evening rush of chai and burgers."
            />
            <SpaceCard
              image="/brand/interior.jpg"
              kicker="Basement"
              title="Sukoon"
              hindi="सुकून"
              copy="Peaceful. Spacious. Comfortable. Downstairs for long lunches, quiet work, and conversations that should not be hurried."
            />
          </div>
        </div>
      </section>

      <Menu />

      <section id="gallery" className="py-24 md:py-32">
        <div className="max-w-6xl mx-auto px-5">
          <div className="flex items-end justify-between gap-6 mb-10">
            <div>
              <p className="text-[11px] tracking-[0.38em] uppercase text-gold">Inside & out</p>
              <h2 className="font-hindi text-4xl md:text-5xl font-bold mt-3">झलकियाँ</h2>
            </div>
            <p className="hidden md:block max-w-sm text-sm text-cream/60 text-right">
              The arch, the picket fence, the orange chairs, the cheesy penne — this is the house.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            <img src={GALLERY[0]} alt="" className="md:col-span-3 md:row-span-2 h-64 md:h-full min-h-[280px] w-full object-cover rounded-sm" />
            <img src={GALLERY[1]} alt="" className="md:col-span-3 h-44 md:h-56 w-full object-cover rounded-sm" />
            <img src={GALLERY[2]} alt="" className="h-44 md:h-56 w-full object-cover rounded-sm md:col-span-1" />
            <img src={GALLERY[3]} alt="" className="h-44 md:h-56 w-full object-cover rounded-sm md:col-span-2" />
            <img src={GALLERY[4]} alt="" className="col-span-2 md:col-span-3 h-52 md:h-64 w-full object-cover rounded-sm" />
          </div>
        </div>
      </section>

      <section id="testimonials" className="py-24 md:py-32">
        <div className="max-w-[1180px] mx-auto px-5 md:px-7">
          <p className="font-kalam text-coral text-lg -rotate-2 inline-block">— अपनों की बातें</p>
          <h2 className="font-hindi text-4xl md:text-5xl mt-2">मेहमानों की ज़ुबानी</h2>
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            {[
              { q: 'बरसों बाद वो स्वाद मिला जो नानी के हाथ की रोटी में होता था। थाली देखते ही गाँव याद आ गया।', n: 'सुरेश यादव', p: 'हिसार' },
              { q: 'माहौल इतना अपनापन लिए हुए है कि लगता ही नहीं होटल में बैठे हैं। स्टाफ का व्यवहार भी बहुत बढ़िया।', n: 'प्रीति शर्मा', p: 'हिसार' },
              { q: 'बच्चों के साथ फैमिली आउटिंग के लिए परफेक्ट जगह। खाणा टाइम पर और गरमागरम मिला।', n: 'रोहित सिंह', p: 'फतेहाबाद' },
            ].map((t) => (
              <article key={t.n} className="bg-ink-soft border border-line rounded-[14px] p-8">
                <div className="font-hindi text-5xl text-coral/50 leading-none">"</div>
                <p className="mt-3 text-[15px] leading-relaxed text-cream/90">{t.q}</p>
                <p className="mt-5 font-semibold">{t.n}</p>
                <p className="text-sm text-muted">{t.p}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="reserve" className="bg-cream text-ink py-24 md:py-32">
        <div className="max-w-[1180px] mx-auto px-5 md:px-7">
          <p className="font-kalam text-coral text-lg -rotate-2 inline-block">— आइए</p>
          <h2 className="font-hindi text-4xl md:text-5xl mt-2">Choose your area</h2>
          <p className="mt-3 text-ink-soft/80 max-w-xl">Two kitchens in Hisar. Same name. Same price range. Pick the one closer to you.</p>

          <div className="grid md:grid-cols-2 gap-6 mt-12">
            {OUTLETS.map((o) => (
              <article key={o.id} className="bg-white border border-ink/10 rounded-2xl overflow-hidden">
                <img src={o.image} alt={o.name} className="h-48 w-full object-cover" />
                <div className="p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] tracking-[0.16em] uppercase text-coral font-semibold">{o.type}</p>
                      <h3 className="font-hindi text-2xl mt-1">{o.hindi}</h3>
                      <p className="text-sm text-ink-soft/70">{o.name}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-semibold">{o.rating}★</p>
                      <p className="text-xs text-ink-soft/60">({o.reviews})</p>
                    </div>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-ink-soft">{o.price}</p>
                  <ul className="mt-4 space-y-2.5 text-sm text-ink-soft/80">
                    <li className="flex gap-2"><MapPin className="w-4 h-4 mt-0.5 text-coral shrink-0" />{o.address}</li>
                    <li className="flex gap-2"><Clock className="w-4 h-4 mt-0.5 text-coral shrink-0" />{o.hours}</li>
                  </ul>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {o.services.map((s) => (
                      <span key={s} className="text-[11px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full bg-cream text-ink-soft">{s}</span>
                    ))}
                  </div>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <a href={o.map} target="_blank" rel="noreferrer" className="h-10 px-4 rounded-full bg-ink text-cream text-sm font-semibold inline-flex items-center">
                      Open maps
                    </a>
                    <button onClick={() => setReserveOpen(true)} className="h-10 px-4 rounded-full border border-ink/20 text-sm font-semibold">
                      Reserve
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <Footer />

      <ReserveModal open={reserveOpen} onClose={() => setReserveOpen(false)} />
    </div>
  );
}

function Stat({ n, l }: { n: string; l: string }) {
  return (
    <div>
      <div className="font-display text-3xl text-gold">{n}</div>
      <div className="text-[10px] tracking-[0.2em] uppercase text-cream/50 mt-1">{l}</div>
    </div>
  );
}

function SpaceCard({ image, kicker, title, hindi, copy }: { image: string; kicker: string; title: string; hindi: string; copy: string }) {
  return (
    <article className="group relative overflow-hidden min-h-[420px] rounded-sm">
      <img src={image} alt={title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/50 to-transparent" />
      <div className="relative h-full min-h-[420px] flex flex-col justify-end p-8">
        <p className="text-[11px] tracking-[0.28em] uppercase text-gold">{kicker}</p>
        <h3 className="font-display text-4xl mt-1">{title}</h3>
        <p className="font-hindi text-xl text-cream/80">{hindi}</p>
        <p className="mt-3 text-sm text-cream/70 leading-relaxed max-w-md">{copy}</p>
      </div>
    </article>
  );
}
