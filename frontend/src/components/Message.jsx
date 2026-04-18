import { useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { User, Volume2, Square, Sprout } from 'lucide-react';

const API_BASE = 'http://127.0.0.1:8000/api';
const VIDEO_REGEX = /\[VIDEO:([a-zA-Z0-9_-]+):(fr|ar)\]/g;

const ImageCard = ({ src, alt }) => {
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);
  if (error) return null;
  return (
    <figure className="my-4 rounded-2xl overflow-hidden border border-gray-100 shadow-md">
      {!loaded && (
        <div className="w-full h-44 bg-green-50 flex items-center justify-center">
          <Sprout size={28} className="text-green-300 animate-pulse" />
        </div>
      )}
      <img
        src={src} alt={alt || ''}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        className={`w-full object-cover max-h-64 transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0 h-0'}`}
      />
      {loaded && alt && (
        <figcaption className="text-xs text-gray-400 text-center py-2 px-3 bg-gray-50/80 italic">
          {alt}
        </figcaption>
      )}
    </figure>
  );
};

const YouTubeEmbed = ({ videoId, lang }) => (
  <div className="my-4 rounded-2xl overflow-hidden shadow-lg" style={{ aspectRatio: '16/9' }}>
    <iframe
      src={`https://www.youtube-nocookie.com/embed/${videoId}?hl=${lang}&cc_lang_pref=${lang}&cc_load_policy=1&rel=0`}
      title="Vidéo"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen className="w-full h-full border-0" style={{ minHeight: '220px' }}
    />
  </div>
);

const renderContent = (text) => {
  const parts = [];
  let lastIndex = 0;
  VIDEO_REGEX.lastIndex = 0;
  let match;
  while ((match = VIDEO_REGEX.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push({ type: 'md', content: text.slice(lastIndex, match.index) });
    parts.push({ type: 'video', videoId: match[1], lang: match[2] });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) parts.push({ type: 'md', content: text.slice(lastIndex) });

  return parts.map((p, i) =>
    p.type === 'video'
      ? <YouTubeEmbed key={i} videoId={p.videoId} lang={p.lang} />
      : <ReactMarkdown key={i} components={{ img: ({ src, alt }) => <ImageCard src={src} alt={alt} /> }}>{p.content}</ReactMarkdown>
  );
};

const Message = ({ msg, onSpeakingChange }) => {
  const isUser = msg.sender === 'user';
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioReady, setAudioReady] = useState(false);
  const audioSourceRef = useRef(null);
  const audioCtxRef = useRef(null);
  const abortRef = useRef(null);

  const stopAudio = () => {
    if (abortRef.current) abortRef.current.abort();
    if (audioSourceRef.current) {
      try { audioSourceRef.current.stop(); } catch {}
      audioSourceRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    setIsSpeaking(false);
    setAudioReady(false);
    onSpeakingChange?.(false);
  };

  const detectLanguage = (text) => {
    const arabicCount = (text.match(/[\u0600-\u06FF]/g) || []).length;
    const latinCount = (text.match(/[a-zA-ZÀ-ÿ]/g) || []).length;
    return arabicCount > latinCount * 0.3 ? 'arabic' : 'french';
  };

  const cleanText = (text, lang) => {
    let c = text
      .replace(/!\[.*?\]\(.*?\)/g, '').replace(/\[(.*?)\]\(.*?\)/g, '$1')
      .replace(/\[VIDEO:[^\]]+\]/g, '').replace(/```[\s\S]*?```/g, '')
      .replace(/`[^`]*`/g, '').replace(/[#*_~>|]/g, '')
      .replace(/https?:\/\/\S+/g, '').replace(/[\u{1F000}-\u{1FFFF}]/gu, '')
      .replace(/\n{2,}/g, '. ').replace(/\n/g, ', ').replace(/\s+/g, ' ').trim();
    if (lang === 'arabic')
      c = c.replace(/[\u0610-\u061A\u064B-\u065F]/g, '').replace(/[ـ]/g, '').replace(/[\u200C\u200D\u200E\u200F]/g, '');
    return c;
  };

  const handleSpeak = async () => {
    if (msg.isStreaming) return;
    if (isSpeaking) {
      stopAudio();
      return;
    }

    const lang = detectLanguage(msg.text);
    const cleaned = cleanText(msg.text, lang);
    if (!cleaned) return;

    setIsSpeaking(true);
    onSpeakingChange?.(true);

    const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioCtxClass();
    audioCtxRef.current = ctx;

    try {
      const silentBuf = ctx.createBuffer(1, ctx.sampleRate * 0.1, ctx.sampleRate);
      const silentSrc = ctx.createBufferSource();
      silentSrc.buffer = silentBuf;
      silentSrc.connect(ctx.destination);
      silentSrc.start(0);
    } catch {}

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch(`${API_BASE}/tts/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: cleaned, lang }),
        signal: controller.signal,
      });

      if (!response.ok) throw new Error(`TTS HTTP ${response.status}`);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
      
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      source.start(0);
      audioSourceRef.current = source;
      setAudioReady(true);

      source.onended = () => {
        if (!controller.signal.aborted) {
          setIsSpeaking(false);
          setAudioReady(false);
          onSpeakingChange?.(false);
        }
        ctx.close();
        audioCtxRef.current = null;
        audioSourceRef.current = null;
      };
    } catch (err) {
      if (err.name !== 'AbortError') console.error('TTS error:', err);
      setIsSpeaking(false);
      setAudioReady(false);
      onSpeakingChange?.(false);
      if (ctx.state !== 'closed') ctx.close();
      audioCtxRef.current = null;
    }
  };

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'items-start animate-[hero-fade-up_0.4s_ease-out]'}`}>
      <div className={`w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm border ${
        isUser ? 'bg-white border-gray-100' : 'bg-green-600 border-green-500'
      }`}>
        {isUser ? <User size={18} className="text-gray-400" /> : <Sprout size={18} className="text-white" />}
      </div>

      <div className={`flex flex-col max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div className={`relative px-5 py-4 rounded-2xl shadow-sm border transition-all ${
          isUser 
            ? 'bg-white border-gray-100 rounded-tr-none text-gray-800' 
            : 'bg-white border-gray-100 rounded-tl-none prose prose-slate max-w-none'
        }`}>
          {/* Image envoyée par l'utilisateur */}
          {isUser && msg.imagePreview && (
            <div className="mb-3 rounded-xl overflow-hidden border border-gray-100 shadow-sm">
              <img src={msg.imagePreview} alt="User Upload" className="max-w-full h-auto max-h-60 object-cover" />
            </div>
          )}

          {isUser ? (
             <p className="m-0 text-[15px]">{msg.text}</p>
          ) : (
            msg.isStreaming ? (
              <div className="text-[15px] leading-relaxed whitespace-pre-wrap text-gray-700">
                {msg.text}
                <span className="inline-block w-0.5 h-4 bg-green-500 ml-0.5 align-middle animate-blink" />
              </div>
            ) : renderContent(msg.text)
          )}

          {!isUser && !msg.isStreaming && msg.text && (
            <button
              onClick={handleSpeak}
              className={`absolute top-2 -right-12 p-2.5 rounded-xl transition-all shadow-sm border ${
                isSpeaking 
                  ? 'bg-red-50 border-red-100 text-red-500 animate-pulse' 
                  : 'bg-white border-gray-100 text-gray-400 hover:text-green-600 hover:border-green-200 hover:shadow-md'
              }`}
              title={isSpeaking ? "Arrêter la lecture" : "Écouter la réponse"}
            >
              {isSpeaking ? <Square size={16} fill="currentColor" /> : <Volume2 size={16} />}
            </button>
          )}
        </div>
        <span className="text-[10px] text-gray-400 mt-1 px-1">
          {isUser ? 'Vous' : 'AgriAssistant'} · {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
};

export default Message;
