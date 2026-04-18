import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import 'regenerator-runtime/runtime';
import Message from './components/Message';
import InputArea from './components/InputArea';
import { Sprout, Plus, MessageSquare, Wheat, Search } from 'lucide-react';

const API_BASE = 'http://127.0.0.1:8000/api';

// ─── Orbe vortex (vibrant quand TTS actif) ───────────────────────────────────
const Orb = ({ isSpeaking, isLoading }) => {
  const active = isSpeaking || isLoading;
  return (
    <div className="relative flex items-center justify-center select-none" style={{ width: 180, height: 180 }}>
      {/* Anneaux qui se propagent quand TTS actif */}
      {isSpeaking && [0, 1, 2].map(i => (
        <div
          key={i}
          className="absolute rounded-full border border-green-400/50"
          style={{
            inset: 0,
            animation: `ring-expand 1.8s ease-out ${i * 0.6}s infinite`,
          }}
        />
      ))}
      {/* Anneau externe lent */}
      {isSpeaking && (
        <div
          className="absolute rounded-full border border-green-300/25"
          style={{ inset: 0, animation: 'ring-expand-slow 2.4s ease-out 0.3s infinite' }}
        />
      )}

      {/* Halo de glow */}
      <div
        className="absolute rounded-full transition-all duration-700"
        style={{
          inset: 12,
          background: active
            ? 'radial-gradient(circle, rgba(34,197,94,0.35) 0%, rgba(21,128,61,0.15) 60%, transparent 100%)'
            : 'radial-gradient(circle, rgba(34,197,94,0.15) 0%, transparent 70%)',
          filter: 'blur(12px)',
        }}
      />

      {/* Vortex rotatif (halo intérieur) */}
      {isSpeaking && (
        <>
          <div className="absolute rounded-full" style={{
            inset: 20,
            background: 'conic-gradient(from 0deg, transparent, rgba(74,222,128,0.4), transparent, rgba(34,197,94,0.3), transparent)',
            animation: 'vortex-spin 2s linear infinite',
            borderRadius: '50%',
          }} />
          <div className="absolute rounded-full" style={{
            inset: 30,
            background: 'conic-gradient(from 180deg, transparent, rgba(251,191,36,0.3), transparent, rgba(74,222,128,0.2), transparent)',
            animation: 'vortex-spin-rev 3s linear infinite',
            borderRadius: '50%',
          }} />
        </>
      )}

      {/* Sphère principale */}
      <div
        className="relative rounded-full z-10 transition-all duration-300"
        style={{
          width: 120,
          height: 120,
          background: 'radial-gradient(circle at 32% 30%, #86efac, #16a34a 45%, #052e16 90%)',
          boxShadow: isSpeaking
            ? '0 0 50px rgba(34,197,94,0.7), 0 0 100px rgba(34,197,94,0.35), inset 0 0 30px rgba(0,0,0,0.3)'
            : '0 0 30px rgba(34,197,94,0.35), inset 0 0 20px rgba(0,0,0,0.25)',
          animation: isSpeaking
            ? 'orb-speak 0.45s ease-in-out infinite'
            : 'orb-breathe 3.5s ease-in-out infinite',
        }}
      >
        {/* Reflet */}
        <div className="absolute rounded-full" style={{
          top: '18%', left: '20%',
          width: '35%', height: '28%',
          background: 'radial-gradient(ellipse, rgba(255,255,255,0.55) 0%, transparent 80%)',
        }} />
      </div>
    </div>
  );
};

// ─── Tracteur loader ─────────────────────────────────────────────────────────
const AgriLoader = () => (
  <svg viewBox="0 0 160 60" width="140" height="52">
    <rect x="0" y="46" width="160" height="4" rx="2" fill="#92400e" opacity="0.5" />
    {[35, 70, 105].map((x, i) => (
      <g key={i} style={{ transformOrigin: `${x}px 46px`, animation: `plant-grow 0.9s ease-out ${0.5 + i * 0.7}s both` }}>
        <line x1={x} y1="46" x2={x} y2="28" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" />
        <ellipse cx={x-6} cy="36" rx="6" ry="3" fill="#22c55e" transform={`rotate(-35,${x-6},36)`} />
        <ellipse cx={x+6} cy="36" rx="6" ry="3" fill="#22c55e" transform={`rotate(35,${x+6},36)`} />
      </g>
    ))}
    <g style={{ animation: 'tractor-drive 3s linear infinite' }}>
      <rect x="2" y="30" width="24" height="13" rx="3" fill="#15803d" />
      <rect x="6" y="22" width="15" height="12" rx="2" fill="#16a34a" />
      <rect x="9" y="24" width="8" height="7" rx="1.5" fill="#bfdbfe" opacity="0.85" />
      <circle cx="8" cy="44" r="7" fill="#1c1917" /><circle cx="8" cy="44" r="4" fill="#44403c" />
      <circle cx="23" cy="44" r="5" fill="#1c1917" /><circle cx="23" cy="44" r="3" fill="#44403c" />
      <rect x="19" y="17" width="4" height="7" rx="1.5" fill="#78716c" />
    </g>
  </svg>
);

// ─── Groupement sessions par date ────────────────────────────────────────────
const groupByDate = (sessions) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  const groups = { "Aujourd'hui": [], 'Hier': [], 'Plus ancien': [] };
  sessions.forEach(s => {
    const d = new Date(s.created_at);
    const day = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    if (day >= today) groups["Aujourd'hui"].push(s);
    else if (day >= yesterday) groups['Hier'].push(s);
    else groups['Plus ancien'].push(s);
  });
  return groups;
};

// ─── Suggestions initiales ───────────────────────────────────────────────────
const SUGGESTIONS = [
  { icon: <Wheat size={16} />, text: "Quand planter les tomates à Tunis ?" },
  { icon: <Sprout size={16} />, text: "Irrigation goutte-à-goutte pour oliviers" },
  { icon: <Wheat size={16} />, text: "Maladies du figuier en été" },
];

// ─── App ─────────────────────────────────────────────────────────────────────
function App() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isTTSSpeaking, setIsTTSSpeaking] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const messagesEndRef = useRef(null);
  const isWelcome = messages.length === 0;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => { fetchSessions(); }, []);

  const fetchSessions = async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/sessions/`);
      setSessions(data);
    } catch {}
  };

  const loadSession = async (id) => {
    if (id === null) {
      setCurrentSessionId(null);
      setMessages([]);
      return;
    }
    setIsLoading(true);
    try {
      const { data } = await axios.get(`${API_BASE}/sessions/${id}/`);
      setMessages(data.messages);
      setCurrentSessionId(id);
    } catch {}
    finally { setIsLoading(false); }
  };

  const handleSendMessage = async (text, imageFile = null) => {
    const userMessage = { sender: 'user', text };
    if (imageFile) {
      userMessage.imagePreview = URL.createObjectURL(imageFile);
    }
    
    setMessages(prev => [...prev,
      userMessage,
      { sender: 'bot', text: '', isStreaming: true }
    ]);
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('question', text);
      formData.append('localisation', 'Tunis');
      if (currentSessionId) formData.append('session_id', currentSessionId);
      if (imageFile) formData.append('image', imageFile);

      const res = await fetch(`${API_BASE}/chat/stream/`, {
        method: 'POST',
        body: formData,
        // Pas de header Content-Type, le navigateur le mettra avec le boundary pour FormData
      });
      if (!res.ok) throw new Error();
      setIsLoading(false);
      setIsStreaming(true);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop();
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const str = line.slice(6).trim();
          if (!str) continue;
          try {
            const p = JSON.parse(str);
            if (p.type === 'meta' && !currentSessionId && p.session_id) {
              setCurrentSessionId(p.session_id);
              fetchSessions();
            } else if (p.type === 'chunk') {
              setMessages(prev => {
                const u = [...prev];
                const last = u[u.length - 1];
                if (last?.sender === 'bot') u[u.length - 1] = { ...last, text: last.text + p.content };
                return u;
              });
            } else if (p.type === 'done') {
              setIsStreaming(false);
              setMessages(prev => {
                const u = [...prev];
                const last = u[u.length - 1];
                if (last?.sender === 'bot') u[u.length - 1] = { ...last, isStreaming: false };
                return u;
              });
            }
          } catch {}
        }
      }
    } catch {
      setMessages(prev => {
        const u = [...prev];
        u[u.length - 1] = { sender: 'bot', text: "**Oups !** Erreur de connexion au serveur.", isStreaming: false };
        return u;
      });
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
    }
  };

  const filteredSessions = sessions.filter(s =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const grouped = groupByDate(filteredSessions);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#f8f7f4' }}>

      {/* ─── SIDEBAR ─────────────────────────────────────────────────────── */}
      <aside
        className="flex flex-col flex-shrink-0 h-full transition-all duration-300"
        style={{
          width: sidebarCollapsed ? 64 : 240,
          background: 'linear-gradient(180deg, #0a1f0f 0%, #061309 100%)',
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-white/5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #22c55e, #15803d)' }}>
            <Sprout size={18} color="white" />
          </div>
          {!sidebarCollapsed && (
            <div className="overflow-hidden">
              <p className="text-white font-bold text-sm leading-none">AgriAssistant</p>
              <p className="text-green-400/70 text-[10px] font-medium mt-0.5">TN · Expert Agricole</p>
            </div>
          )}
          <button
            onClick={() => setSidebarCollapsed(c => !c)}
            className="ml-auto text-white/30 hover:text-white/70 transition-colors flex-shrink-0"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <rect y="2" width="16" height="1.5" rx="1" />
              <rect y="7.25" width="16" height="1.5" rx="1" />
              <rect y="12.5" width="16" height="1.5" rx="1" />
            </svg>
          </button>
        </div>

        {/* Nouvelle conversation */}
        <div className="px-3 py-3">
          <button
            onClick={() => loadSession(null)}
            className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl text-white/90 font-medium text-sm transition-all hover:bg-white/10 border border-white/10 hover:border-white/20"
          >
            <Plus size={16} className="flex-shrink-0" />
            {!sidebarCollapsed && <span>Nouvelle conversation</span>}
          </button>
        </div>

        {/* Recherche */}
        {!sidebarCollapsed && (
          <div className="px-3 pb-2">
            <div className="flex items-center gap-2 bg-white/5 rounded-xl px-3 py-2 border border-white/5">
              <Search size={13} className="text-white/30 flex-shrink-0" />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Rechercher…"
                className="bg-transparent text-white/70 text-xs outline-none w-full placeholder-white/25"
              />
            </div>
          </div>
        )}

        {/* Liste sessions */}
        <nav className="flex-1 overflow-y-auto sidebar-scroll px-2 pb-4">
          {!sidebarCollapsed && Object.entries(grouped).map(([label, items]) =>
            items.length > 0 && (
              <div key={label} className="mb-3">
                <p className="text-white/25 text-[10px] font-semibold uppercase tracking-widest px-2 mb-1">{label}</p>
                {items.map(s => (
                  <button
                    key={s.id}
                    onClick={() => loadSession(s.id)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-all truncate mb-0.5 ${
                      currentSessionId === s.id
                        ? 'bg-green-600/30 text-green-300 font-medium'
                        : 'text-white/50 hover:bg-white/5 hover:text-white/80'
                    }`}
                  >
                    {s.title}
                  </button>
                ))}
              </div>
            )
          )}
          {sidebarCollapsed && (
            <div className="flex flex-col items-center gap-2 pt-2">
              {sessions.slice(0, 8).map(s => (
                <button
                  key={s.id}
                  onClick={() => loadSession(s.id)}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                    currentSessionId === s.id ? 'bg-green-600/40' : 'hover:bg-white/10'
                  }`}
                  title={s.title}
                >
                  <MessageSquare size={16} className="text-white/50" />
                </button>
              ))}
            </div>
          )}
        </nav>
      </aside>

      {/* ─── ZONE PRINCIPALE ─────────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0 h-full">

        {/* Header fin */}
        <header className="flex items-center justify-between px-6 py-3 border-b border-black/5 bg-white/60 backdrop-blur-sm flex-shrink-0">
          <p className="text-sm font-semibold text-gray-600 truncate">
            {currentSessionId
              ? (sessions.find(s => s.id === currentSessionId)?.title || 'Conversation')
              : 'AgriAssistant TN'
            }
          </p>
          <div className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full transition-all ${isTTSSpeaking ? 'bg-green-500 animate-pulse' : 'bg-gray-200'}`} />
            <span className="text-xs text-gray-400">{isTTSSpeaking ? 'En lecture…' : 'Prêt'}</span>
          </div>
        </header>

        {/* Zone chat ou accueil */}
        <main className="flex-1 overflow-y-auto chat-scrollbar">
          {isWelcome ? (
            /* ─── ÉTAT D'ACCUEIL ─── */
            <div className="flex flex-col items-center justify-center h-full px-6 py-12 gap-8 max-w-4xl mx-auto">
              <Orb isSpeaking={isTTSSpeaking} isLoading={isLoading} />
              <div className="text-center animate-[hero-fade-up_0.8s_ease-out]">
                <h2 className="text-4xl font-extrabold mb-3 tracking-tight welcome-gradient-text">
                  Aslama, Agriculteur !
                </h2>
                <p className="text-gray-500 text-lg max-w-md mx-auto leading-relaxed">
                  Votre assistant intelligent pour une agriculture moderne et prospère en Tunisie.
                </p>
              </div>
              {/* Suggestions rapides */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full px-4">
                {SUGGESTIONS.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendMessage(s.text)}
                    className="group flex flex-col items-start p-5 rounded-2xl bg-white border border-gray-100 text-left hover:border-green-400 hover:shadow-xl transition-all shadow-sm animate-[card-in_0.5s_ease-out] relative overflow-hidden"
                    style={{ animationDelay: `${i * 0.1}s`, cursor: 'pointer' }}
                  >
                    <div className="absolute top-0 right-0 p-3 text-green-50/50 group-hover:text-green-100 transition-colors">
                      {s.icon}
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center mb-4 text-green-600 group-hover:bg-green-600 group-hover:text-white transition-colors">
                      {s.icon}
                    </div>
                    <p className="text-gray-700 font-medium leading-snug group-hover:text-green-800 transition-colors">
                      {s.text}
                    </p>
                    <span className="mt-3 text-[10px] uppercase tracking-wider text-gray-400 font-bold group-hover:text-green-600">Essayer maintenant →</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* ─── MESSAGES ─── */
            <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">

              {/* Orbe miniature centré quand TTS actif */}
              {isTTSSpeaking && (
                <div className="flex justify-center py-2">
                  <Orb isSpeaking={true} isLoading={false} />
                </div>
              )}

              {messages.map((msg, i) => (
                <Message
                  key={i}
                  msg={msg}
                  onSpeakingChange={setIsTTSSpeaking}
                />
              ))}

              {isLoading && (
                <div className="flex gap-3 items-start">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-1">
                    <Sprout size={16} className="text-green-600" />
                  </div>
                  <div className="bg-white rounded-2xl rounded-tl-none px-5 py-4 shadow-sm border border-gray-100 flex flex-col gap-2">
                    <AgriLoader />
                    <span className="text-xs text-gray-400">Analyse en cours…</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </main>

        {/* Input */}
        <div className="flex-shrink-0">
          <InputArea
            onSendMessage={handleSendMessage}
            isLoading={isLoading || isStreaming}
            isWelcome={isWelcome}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
