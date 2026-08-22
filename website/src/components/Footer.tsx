const ADMIN_URL = (import.meta as { env?: { VITE_ADMIN_URL?: string } }).env?.VITE_ADMIN_URL || 'http://localhost:5180';

export default function Footer() {
  return (
    <footer className="bg-ink border-t border-line pt-16 pb-8">
      <div className="max-w-[1180px] mx-auto px-5 md:px-7">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr] gap-10 mb-12">
          <div>
            <img src="/brand/logo.png" alt="म्हारी ढाणी" className="h-11 w-auto object-contain mb-4" />
            <p className="text-muted text-[15px] leading-relaxed max-w-[280px]">
              हरियाणा के गाँव की मिट्टी, माँ के हाथ का स्वाद — म्हारी ढाणी में आपका दिल से स्वागत है।
            </p>
          </div>

          <div>
            <h4 className="text-[13px] font-semibold uppercase tracking-[0.06em] text-cream mb-5">Quick Links</h4>
            <div className="flex flex-col gap-3 text-[15px] text-muted">
              <a href="#story" className="hover:text-coral transition-colors">हमारी कहानी</a>
              <a href="#menu" className="hover:text-coral transition-colors">मेन्यू</a>
              <a href="#gallery" className="hover:text-coral transition-colors">गैलरी</a>
              <a href="#reserve" className="hover:text-coral transition-colors">बुकिंग</a>
            </div>
          </div>

          <div>
            <h4 className="text-[13px] font-semibold uppercase tracking-[0.06em] text-cream mb-5">सेवाएं</h4>
            <div className="flex flex-col gap-3 text-[15px] text-muted">
              <a href="#reserve" className="hover:text-coral transition-colors">पार्टी बुकिंग</a>
              <a href="#reserve" className="hover:text-coral transition-colors">होम डिलीवरी</a>
              <a href="#reserve" className="hover:text-coral transition-colors">कैटरिंग</a>
              <a href="#reserve" className="hover:text-coral transition-colors">बर्थडे स्पेशल</a>
            </div>
          </div>

          <div>
            <h4 className="text-[13px] font-semibold uppercase tracking-[0.06em] text-cream mb-5">संपर्क</h4>
            <div className="flex flex-col gap-3 text-[15px] text-muted">
              <a href="#reserve" className="hover:text-coral transition-colors">SCO 22, Red Square, Mehta Nagar</a>
              <a href="#reserve" className="hover:text-coral transition-colors">HAU · HARSAC Parking</a>
              <span>हिसार, हरियाणा · ₹1–200</span>
              <a href={ADMIN_URL} className="hover:text-coral transition-colors">Admin Login</a>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between gap-3 pt-6 border-t border-line text-[13px] text-muted">
          <span>© {new Date().getFullYear()} म्हारी ढाणी. सर्वाधिकार सुरक्षित।</span>
          <span>Made with ❤️ in Haryana</span>
        </div>
      </div>
    </footer>
  );
}
