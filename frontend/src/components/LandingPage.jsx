import { useState, useEffect } from 'react';
import { ArrowRight, Wheat, CloudSun, Volume2, Mic } from 'lucide-react';

/* ─── Scène SVG animée (champ agricole) ────────────────────────────── */
const FieldScene = () => (
  <svg
    viewBox="0 0 800 260"
    width="100%"
    style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}
    preserveAspectRatio="xMidYMax meet"
    aria-hidden="true"
  >
    {/* Collines */}
    <ellipse cx="200" cy="280" rx="280" ry="120" fill="#052e16" opacity="0.9" />
    <ellipse cx="600" cy="290" rx="300" ry="110" fill="#063b1a" opacity="0.85" />
    <ellipse cx="400" cy="270" rx="420" ry="100" fill="#0a4a22" opacity="0.95" />

    {/* Tiges de blé — grandes */}
    {[60,110,155,195,240,290,340,385,430,475,520,565,610,655,700,740].map((x, i) => (
      <g key={i} style={{
        transformOrigin: `${x}px 230px`,
        animation: `grass-sway ${1.8 + (i % 4) * 0.3}s ease-in-out ${(i * 0.12) % 1.2}s infinite alternate`
      }}>
        <line x1={x} y1="230" x2={x} y2={155 + (i % 3) * 15} stroke="#22c55e" strokeWidth="2" strokeLinecap="round" />
        <ellipse cx={x} cy={148 + (i % 3) * 15} rx="4" ry="11" fill="#16a34a" />
        <line x1={x - 8} y1={170 + (i % 3) * 15} x2={x - 16} y2={158 + (i % 3) * 15} stroke="#15803d" strokeWidth="1.5" />
        <line x1={x + 8} y1={170 + (i % 3) * 15} x2={x + 16} y2={158 + (i % 3) * 15} stroke="#15803d" strokeWidth="1.5" />
      </g>
    ))}

    {/* Sol */}
    <rect x="0" y="228" width="800" height="40" fill="#052e16" />
  </svg>
);

/* ─── Étoiles / particules ──────────────────────────────────────────── */
const Stars = () => {
  const stars = Array.from({ length: 40 }, (_, i) => ({
    x: (i * 137.5) % 100,
    y: (i * 97.3) % 65,
    r: 0.8 + (i % 3) * 0.5,
    delay: (i * 0.17) % 3,
    dur: 2 + (i % 4) * 0.8,
  }));
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden="true">
      {stars.map((s, i) => (
        <circle
          key={i}
          cx={`${s.x}%`} cy={`${s.y}%`}
          r={s.r}
          fill="white"
          style={{
            opacity: 0.4 + (i % 4) * 0.15,
            animation: `star-twinkle ${s.dur}s ease-in-out ${s.delay}s infinite alternate`
          }}
        />
      ))}
    </svg>
  );
};

/* ─── Orbe central animé ────────────────────────────────────────────── */
const LandingOrb = () => (
  <div className="relative flex items-center justify-center" style={{ width: 200, height: 200 }}>
    {/* Halo externe */}
    <div className="absolute inset-0 rounded-full" style={{
      background: 'radial-gradient(circle, rgba(34,197,94,0.2) 0%, transparent 70%)',
      filter: 'blur(20px)',
      animation: 'orb-breathe 4s ease-in-out infinite',
    }} />
    {/* Anneau tournant */}
    <div className="absolute rounded-full border border-green-400/20" style={{
      inset: 16,
      background: 'conic-gradient(from 0deg, transparent, rgba(74,222,128,0.3), transparent)',
      animation: 'vortex-spin 6s linear infinite',
    }} />
    <div className="absolute rounded-full border border-amber-400/15" style={{
      inset: 28,
      background: 'conic-gradient(from 180deg, transparent, rgba(251,191,36,0.2), transparent)',
      animation: 'vortex-spin-rev 9s linear infinite',
    }} />
    {/* Sphère */}
    <div className="relative rounded-full z-10" style={{
      width: 140,
      height: 140,
      background: 'radial-gradient(circle at 32% 28%, #86efac 0%, #16a34a 40%, #052e16 90%)',
      boxShadow: '0 0 60px rgba(34,197,94,0.5), 0 0 120px rgba(34,197,94,0.2), inset 0 0 40px rgba(0,0,0,0.3)',
      animation: 'orb-breathe 4s ease-in-out infinite',
    }}>
      {/* Reflet */}
      <div style={{
        position: 'absolute', top: '16%', left: '18%',
        width: '36%', height: '28%',
        background: 'radial-gradient(ellipse, rgba(255,255,255,0.6) 0%, transparent 80%)',
        borderRadius: '50%',
      }} />
    </div>
  </div>
);

/* ─── Cartes features ────────────────────────────────────────────────── */
const FEATURES = [
  { icon: <Wheat size={26} />, color: 'text-amber-500', bg: 'bg-amber-50', title: 'Expert Agricole', desc: 'Cultures, sols, irrigation adaptés à la Tunisie' },
  { icon: <CloudSun size={26} />, color: 'text-sky-500', bg: 'bg-sky-50', title: 'Météo en Direct', desc: 'Données climatiques pour votre région' },
  { icon: <Volume2 size={26} />, color: 'text-green-600', bg: 'bg-green-50', title: 'Synthèse Vocale', desc: 'Réponses lues en arabe tunisien et français' },
  { icon: <Mic size={26} />, color: 'text-orange-500', bg: 'bg-orange-50', title: 'Voix Bidirectionnelle', desc: 'Parlez, l\'IA vous répond en temps réel' },
];

/* ─── LandingPage ────────────────────────────────────────────────────── */
const LandingPage = ({ onStart }) => {
  const [leaving, setLeaving] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  const handleStart = () => {
    setLeaving(true);
    setTimeout(onStart, 500);
  };

  return (
    <div
      className="min-h-screen flex flex-col overflow-hidden transition-all duration-500"
      style={{ opacity: leaving ? 0 : 1, transform: leaving ? 'scale(1.02)' : 'scale(1)' }}
    >
      {/* ─── HERO ─────────────────────────────────────────────────────── */}
      <section
        className="relative flex flex-col items-center justify-center flex-1 overflow-hidden"
        style={{
          minHeight: '70vh',
          background: 'linear-gradient(180deg, #020d05 0%, #041a09 25%, #062a10 55%, #0a3d17 100%)',
        }}
      >
        <Stars />
        <FieldScene />

        {/* Gradient overlay bas pour transition propre */}
        <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, transparent, #f8f7f4)' }} />

        {/* Contenu centré */}
        <div className="relative z-10 flex flex-col items-center text-center px-6 py-16 gap-6">
          {/* Badge */}
          <div
            className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-green-500/30 bg-green-500/10 backdrop-blur-sm"
            style={{ animation: visible ? 'hero-fade-up 0.7s ease-out 0.1s both' : 'none', opacity: visible ? undefined : 0 }}
          >
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-green-400 text-xs font-semibold tracking-widest uppercase">Assistant Agricole IA · Tunisie</span>
          </div>

          {/* Orbe */}
          <div style={{ animation: visible ? 'hero-fade-up 0.8s ease-out 0.25s both' : 'none', opacity: visible ? undefined : 0 }}>
            <LandingOrb />
          </div>

          {/* Titre */}
          <div style={{ animation: visible ? 'hero-fade-up 0.8s ease-out 0.4s both' : 'none', opacity: visible ? undefined : 0 }}>
            <h1 className="text-5xl md:text-6xl font-black leading-tight"
              style={{ background: 'linear-gradient(135deg, #ffffff 0%, #86efac 50%, #fbbf24 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
            >
              AgriAssistant
              <span className="block text-4xl md:text-5xl mt-1" style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Tunisie
              </span>
            </h1>
            <p className="mt-4 text-green-200/70 text-lg md:text-xl max-w-md mx-auto leading-relaxed font-light">
              Votre expert agricole intelligent — conseils personnalisés, météo locale, voix naturelle.
            </p>
            <p className="mt-2 text-green-400/50 text-base font-light" dir="rtl">
              مساعدك الزراعي الذكي في تونس
            </p>
          </div>

          {/* CTA */}
          <div
            className="flex flex-col items-center gap-3"
            style={{ animation: visible ? 'hero-fade-up 0.8s ease-out 0.6s both' : 'none', opacity: visible ? undefined : 0 }}
          >
            <button
              onClick={handleStart}
              className="group relative flex items-center gap-3 font-bold text-lg px-10 py-4 rounded-2xl overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-2xl"
              style={{ background: 'linear-gradient(135deg, #16a34a, #15803d)', color: 'white', boxShadow: '0 8px 40px rgba(22,163,74,0.5)' }}
            >
              <span className="relative z-10">Commencer maintenant</span>
              <ArrowRight size={20} className="relative z-10 transition-transform group-hover:translate-x-1" />
              {/* Shimmer effect */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.15), transparent)' }} />
            </button>
            <p className="text-green-500/40 text-sm">Gratuit · Sans inscription · En ligne maintenant</p>
          </div>
        </div>
      </section>

      {/* ─── FEATURES ─────────────────────────────────────────────────── */}
      <section className="bg-[#f8f7f4] px-6 py-16">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-xs font-bold uppercase tracking-widest text-gray-400 mb-10">
            Pourquoi choisir AgriAssistant TN ?
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {FEATURES.map((f, i) => (
              <div
                key={i}
                className="flex flex-col items-center text-center p-6 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all cursor-default"
                style={{ animation: `card-in 0.6s ease-out ${0.1 + i * 0.1}s both` }}
              >
                <div className={`w-14 h-14 ${f.bg} ${f.color} rounded-2xl flex items-center justify-center mb-4 shadow-sm`}>
                  {f.icon}
                </div>
                <h3 className="font-bold text-gray-800 text-base mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>

          {/* Stats rapides */}
          <div className="flex items-center justify-center gap-10 mt-12 pt-10 border-t border-gray-100">
            {[
              { val: 'Gemini 2.0', label: 'Modèle IA' },
              { val: '2 langues', label: 'Arabe TN + Français' },
              { val: 'Temps réel', label: 'Météo en direct' },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <p className="text-2xl font-black text-green-700">{s.val}</p>
                <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          <p className="text-center text-xs text-gray-300 mt-10">
            Propulsé par Google Gemini · OpenRouter · OpenWeatherMap · Google TTS
          </p>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
