import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { User, Volume2, Square, Sprout, Play, Search, Info, CheckCircle2, AlertCircle } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE;
const VIDEO_REGEX = /\[VIDEO:([a-zA-Z0-9_-]+):(fr|ar)\]/g;
const VIDEO_SEARCH_REGEX = /\[VIDEO_SEARCH:(.*?)\]/g;
const IMAGE_SEARCH_REGEX = /\[IMAGE_SEARCH:(.*?)\]/g;

const ImageCard = ({ src, alt }) => {
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (error && retryCount < 1) {
      setError(false);
      setRetryCount(1);
    }
  }, [error, retryCount]);

  if (error) return null;

  let displaySrc = src;
  if (retryCount === 1) {
    if (src.includes('pollinations.ai')) {
      displaySrc = src.includes('model=turbo')
        ? src.replace('model=turbo', 'model=flux')
        : src.replace('model=flux', 'model=turbo');
    } else {
      displaySrc = `https://image.pollinations.ai/prompt/${encodeURIComponent(alt || 'agriculture tunisie')}?width=1024&height=768&nologo=true&model=turbo`;
    }
  }

  return (
    <figure className="w-full my-6 md:my-8 group relative rounded-2xl md:rounded-[2rem] overflow-hidden border-4 md:border-8 border-white shadow-xl md:shadow-2xl transition-all duration-500 hover:scale-[1.02] md:hover:scale-[1.03] hover:shadow-green-300/40 bg-white">
      {!loaded && (
        <div className="w-full h-48 md:h-72 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex flex-col items-center justify-center">
          <Sprout size={48} className="text-green-500 animate-bounce mb-2" />
          <span className="text-green-600 font-medium text-sm animate-pulse">Génération de l'expert...</span>
        </div>
      )}
      <img
        src={displaySrc} alt={alt || ''}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        className={`w-full object-cover max-h-[600px] transition-all duration-1000 ease-out ${loaded ? 'opacity-100 scale-100' : 'opacity-0 scale-110 blur-xl'}`}
      />
      {loaded && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-end p-4 md:p-6">
          <p className="text-white text-base md:text-lg font-bold drop-shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
             {alt || "Expert AgriBot AI TN"}
          </p>
          <div className="w-12 h-1 bg-green-500 mt-2 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-700 origin-left"></div>
        </div>
      )}
    </figure>
  );
};

const YouTubeEmbed = ({ videoId, lang }) => (
  <div className="w-full my-4 md:my-6 rounded-2xl md:rounded-3xl overflow-hidden shadow-xl md:shadow-2xl border-2 md:border-4 border-white relative group" style={{ aspectRatio: '16/9' }}>
    <iframe
      src={`https://www.youtube-nocookie.com/embed/${videoId}?hl=${lang}&cc_lang_pref=${lang}&cc_load_policy=1&rel=0`}
      title="Démonstration Agricole"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen className="w-full h-full border-0" style={{ minHeight: '180px' }}
    />
    <div className="absolute top-2 left-2 md:top-4 md:left-4 bg-red-600 text-white px-2 py-1 md:px-3 md:py-1 rounded-full text-[10px] md:text-xs font-bold flex items-center gap-1 md:gap-2 shadow-lg opacity-80 group-hover:opacity-100 transition-opacity">
      <Play size={10} fill="currentColor" /> VIDÉO
    </div>
  </div>
);

const AsyncVideo = ({ query, lang }) => {
  const [videoId, setVideoId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query.trim();
    if (!q) { setLoading(false); return; }

    fetch(`${API_BASE}/video/search/?query=${encodeURIComponent(q)}&lang=${lang}`)
      .then(r => r.json())
      .then(data => {
        if (data.video_id) setVideoId(data.video_id);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [query, lang]);

  if (loading) return (
    <div className="w-full my-6 h-56 bg-gradient-to-r from-gray-50 to-gray-100 animate-pulse rounded-3xl flex flex-col items-center justify-center border-2 border-dashed border-gray-200">
      <Search className="text-gray-300 mb-2 animate-spin" size={32} />
      <div className="text-gray-400 text-sm font-medium">Recherche d'une démonstration vidéo...</div>
    </div>
  );
  if (!videoId) return null;
  return <YouTubeEmbed videoId={videoId} lang={lang} />;
};

const AsyncImage = ({ query }) => {
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query.trim();
    if (!q) { setLoading(false); return; }

    fetch(`${API_BASE}/image/search/?query=${encodeURIComponent(q)}`)
      .then(r => r.json())
      .then(data => {
        if (data.image_url) setImageUrl(data.image_url);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [query]);

  if (loading) return (
    <div className="w-full my-6 h-48 md:h-72 bg-gradient-to-br from-green-50 to-emerald-50 animate-pulse rounded-3xl flex flex-col items-center justify-center border-2 border-dashed border-green-200">
      <Sprout className="text-green-300 mb-2 animate-bounce" size={32} />
      <div className="text-green-600 text-sm font-medium italic">Expertise visuelle en cours...</div>
    </div>
  );

  const finalSrc = imageUrl || `https://image.pollinations.ai/prompt/${encodeURIComponent(query)}?width=1024&height=768&nologo=true&model=turbo`;

  return <ImageCard src={finalSrc} alt={query} />;
};

const renderContent = (text) => {
  const parts = [];
  let lastIndex = 0;

  const allRegex = new RegExp(`${VIDEO_REGEX.source}|${VIDEO_SEARCH_REGEX.source}|${IMAGE_SEARCH_REGEX.source}`, 'g');
  let match;

  while ((match = allRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'md', content: text.slice(lastIndex, match.index) });
    }

    if (match[1]) {
      parts.push({ type: 'video', videoId: match[1], lang: match[2] });
    } else if (match[3]) {
      parts.push({ type: 'video_search', query: match[3] });
    } else if (match[4]) {
      parts.push({ type: 'image_search', query: match[4] });
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push({ type: 'md', content: text.slice(lastIndex) });
  }

  const detectLang = (t) => {
    const arabicCount = (t.match(/[\u0600-\u06FF]/g) || []).length;
    const latinCount = (t.match(/[a-zA-ZÀ-ÿ]/g) || []).length;
    return arabicCount > latinCount * 0.3 ? 'ar' : 'fr';
  };

  const pageLang = detectLang(text);

  return parts.map((p, i) => {
    if (p.type === 'video') return <YouTubeEmbed key={i} videoId={p.videoId} lang={p.lang} />;
    if (p.type === 'video_search') return <AsyncVideo key={i} query={p.query} lang={pageLang} />;
    if (p.type === 'image_search') return <AsyncImage key={i} query={p.query} />;
    return (
      <ReactMarkdown
        key={i}
        remarkPlugins={[remarkGfm]}
        components={{
          img: ({ src, alt }) => <ImageCard src={src} alt={alt} />,
          h1: ({children}) => (
            <h1 className="text-xl md:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-800 to-emerald-600 mb-6 mt-2 border-l-4 md:border-l-8 border-green-500 pl-3 md:pl-4 py-1 leading-tight">
              {children}
            </h1>
          ),
          h3: ({children}) => (
            <h3 className="text-base md:text-xl font-bold text-emerald-800 mb-4 md:mb-5 mt-8 md:mt-10 flex items-center gap-2 md:gap-3 group relative">
              <span className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300 shadow-sm shadow-emerald-200/50 flex-shrink-0">
                <Info size={18} />
              </span>
              <span className="relative">
                {children}
                <div className="absolute -bottom-1 left-0 w-0 h-0.5 bg-emerald-500/30 group-hover:w-full transition-all duration-500" />
              </span>
            </h3>
          ),
          p: ({children}) => <p className="leading-relaxed mb-4">{children}</p>,
          ul: ({children}) => <ul className="space-y-3 mb-6 ml-1">{children}</ul>,
          li: ({children}) => (
            <li className="flex items-start gap-2 md:gap-3">
              <CheckCircle2 size={16} className="text-green-500 mt-1 flex-shrink-0" />
              <span>{children}</span>
            </li>
          ),
          table: ({children}) => (
            <div className="w-full overflow-x-auto my-6 md:my-8 rounded-2xl md:rounded-3xl border-2 border-green-100 shadow-xl bg-white/50 backdrop-blur-sm relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-green-50/30 to-emerald-50/30 pointer-events-none" />
              <table className="w-full text-xs md:text-sm text-left relative z-10 border-collapse min-w-max">{children}</table>
            </div>
          ),
          thead: ({children}) => (
            <thead className="bg-gradient-to-r from-green-700 to-emerald-700 text-white uppercase text-[9px] md:text-[10px] tracking-widest font-black">
              {children}
            </thead>
          ),
          th: ({children}) => <th className="px-4 py-4 md:px-6 md:py-5 font-black text-center whitespace-nowrap">{children}</th>,
          td: ({children}) => <td className="px-4 py-3 md:px-6 md:py-5 border-t border-green-50 font-medium text-center">{children}</td>,
          blockquote: ({children}) => (
            <div className="w-full my-8 relative px-5 md:px-8 py-5 md:py-8 bg-white rounded-2xl md:rounded-3xl border-2 border-emerald-100 shadow-xl overflow-hidden group">
               <div className="absolute top-0 right-0 p-4 md:p-8 text-emerald-500/5 group-hover:scale-110 transition-transform duration-700 pointer-events-none">
                  <Sprout size={100} />
               </div>
               <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-b from-emerald-500 via-green-500 to-teal-500" />
               <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6 relative z-10">
                  <div className="px-3 py-1 bg-emerald-100 rounded-full text-[9px] md:text-[10px] font-black text-emerald-700 uppercase tracking-widest shadow-sm">
                    💡 Conseil d'Expert
                  </div>
                  <div className="h-[1px] flex-grow bg-emerald-100/50" />
               </div>
               <blockquote className="relative z-10 italic text-emerald-900 text-base md:text-xl font-medium leading-relaxed">
                {children}
               </blockquote>
            </div>
          )
        }}
      >
        {p.content}
      </ReactMarkdown>
    );
  });
};

const Message = ({ msg, onSpeakingChange }) => {
  const isUser = msg.sender === 'user';
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioReady, setAudioReady] = useState(false);
  const audioSourceRef = useRef(null);
  const audioCtxRef = useRef(null);
  const abortRef = useRef(null);
  const playbackIdxRef = useRef(0);
  const audioBuffersRef = useRef([]);
  const nextStartTimeRef = useRef(0);

  const stopAudio = () => {
    if (abortRef.current) abortRef.current.abort();
    if (audioSourceRef.current) {
      try { audioSourceRef.current.stop(); } catch {}
      audioSourceRef.current = null;
    }
    if (audioCtxRef.current) {
      if (audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close();
      }
      audioCtxRef.current = null;
    }
    setIsSpeaking(false);
    setAudioReady(false);
    onSpeakingChange?.(false);
    nextStartTimeRef.current = 0;
  };

  useEffect(() => {
    const handleStopAll = (e) => {
      if (e.detail?.id !== msg.id && isSpeaking) {
        stopAudio();
      }
    };
    window.addEventListener('stop-all-audio', handleStopAll);
    return () => {
      window.removeEventListener('stop-all-audio', handleStopAll);
      if (isSpeaking) stopAudio();
    };
  }, [isSpeaking, msg.id]);

  const detectLanguage = (text) => {
    const arabicCount = (text.match(/[\u0600-\u06FF]/g) || []).length;
    const latinCount = (text.match(/[a-zA-ZÀ-ÿ]/g) || []).length;
    return arabicCount > latinCount * 0.3 ? 'arabic' : 'french';
  };

  const cleanText = (text, lang) => {
    const lines = text.split('\n');
    let processedLines = [];
    let i = 0;
    while (i < lines.length) {
      const line = lines[i].trim();
      if (line.startsWith('|') && line.includes('|')) {
        let tableLines = [];
        let j = i;
        while (j < lines.length && (lines[j].trim().startsWith('|') || (j === i + 1 && lines[j].trim().includes('---')))) {
          tableLines.push(lines[j].trim());
          j++;
        }

        if (tableLines.length >= 2) {
          const parseCells = (l) => {
            let cells = l.split('|').map(c => c.trim());
            if (cells[0] === '') cells.shift();
            if (cells[cells.length - 1] === '') cells.pop();
            return cells;
          };

          const headers = parseCells(tableLines[0]);
          const hasSeparator = tableLines.length > 1 && tableLines[1].includes('---');
          const dataStartIdx = hasSeparator ? 2 : 1;

          let tableSpokenText = "";
          for (let k = dataStartIdx; k < tableLines.length; k++) {
            const cells = parseCells(tableLines[k]);
            if (cells.length > 0) {
              const rowParts = headers.map((header, idx) => {
                let cellVal = cells[idx] || "";
                if (cellVal && header) {
                  const conjunction = lang === 'arabic' ? ' و ' : ' et ';
                  cellVal = cellVal.replace(/(\S+)\s*-\s*(\S+)/g, `$1${conjunction}$2`);
                  return `${header} : ${cellVal}`;
                }
                return null;
              }).filter(Boolean);

              if (rowParts.length > 0) {
                tableSpokenText += rowParts.join(', ') + '. ';
              }
            }
          }

          if (tableSpokenText) {
            processedLines.push(tableSpokenText);
            i = j;
            continue;
          }
        }
      }
      processedLines.push(lines[i]);
      i++;
    }

    let c = processedLines.join('\n')
      .replace(/!\[.*?\]\(.*?\)/g, '').replace(/\[(.*?)\]\(.*?\)/g, '$1')
      .replace(/\[VIDEO:[^\]]+\]/g, '').replace(/\[VIDEO_SEARCH:[^\]]+\]/g, '').replace(/\[IMAGE_SEARCH:[^\]]+\]/g, '')
      .replace(/```[\s\S]*?```/g, '')
      .replace(/`[^`]*`/g, '').replace(/[#*_~>|]/g, '')
      .replace(/-{3,}/g, '')
      .replace(/https?:\/\/\S+/g, '').replace(/[\u{1F000}-\u{1FFFF}]/gu, '')
      .replace(/[\u2600-\u26FF\u2700-\u27BF]/gu, '')
      .replace(/\n{2,}/g, '. ').replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();

    if (lang === 'arabic')
      c = c.replace(/[\u0610-\u061A\u064B-\u065F]/g, '').replace(/[ـ]/g, '').replace(/[\u200C\u200D\u200E\u200F]/g, '');
    return c;
  };

  const splitIntoChunks = (text) => {
    const INITIAL_CHUNK_LENGTH = 220;
    const MAX_CHUNK_LENGTH = 1000;
    const EMERGENCY_CHUNK_LENGTH = 3500;

    const splitByPunctuation = (input, punctuationChars) => {
      const punctuationSet = new Set(punctuationChars);
      const parts = [];
      let currentPart = '';

      for (let i = 0; i < input.length; i++) {
        const char = input[i];
        currentPart += char;

        if (punctuationSet.has(char)) {
          while (i + 1 < input.length && /\s/.test(input[i + 1])) {
            currentPart += input[++i];
          }
          if (currentPart.trim()) {
            parts.push(currentPart.trim());
          }
          currentPart = '';
        }
      }

      if (currentPart.trim()) {
        parts.push(currentPart.trim());
      }
      return parts;
    };

    const splitOnWhitespaceNearLimit = (input, maxLength) => {
      const parts = [];
      let remaining = input.trim();

      while (remaining.length > maxLength) {
        let splitAt = remaining.lastIndexOf(' ', maxLength);
        if (splitAt < Math.floor(maxLength * 0.6)) {
          splitAt = remaining.indexOf(' ', maxLength);
        }
        if (splitAt === -1) break;

        parts.push(remaining.slice(0, splitAt).trim());
        remaining = remaining.slice(splitAt + 1).trim();
      }

      if (remaining) {
        parts.push(remaining);
      }
      return parts;
    };

    const splitSegmentForLimit = (segment, preferredLimit) => {
      if (segment.length <= preferredLimit) {
        return [segment];
      }
      const softSegments = splitByPunctuation(segment, [',', ';', ':']);
      if (softSegments.length > 1) {
        return softSegments;
      }
      return splitOnWhitespaceNearLimit(segment, preferredLimit);
    };

    const chunks = [];
    let currentChunk = '';

    const appendSegment = (segment) => {
      const trimmedSegment = segment.trim();
      if (!trimmedSegment) return;

      if (!currentChunk) {
        currentChunk = trimmedSegment;
        return;
      }

      const candidate = `${currentChunk} ${trimmedSegment}`;
      const currentMaxLength = chunks.length === 0 ? INITIAL_CHUNK_LENGTH : MAX_CHUNK_LENGTH;
      if (candidate.length <= currentMaxLength) {
        currentChunk = candidate;
        return;
      }

      chunks.push(currentChunk.trim());
      currentChunk = trimmedSegment;
    };

    const strongSegments = splitByPunctuation(text, ['.', '!', '?', '؟']);

    strongSegments.forEach((strongSegment) => {
      const isPreparingFirstChunk = chunks.length === 0 && !currentChunk;
      if (isPreparingFirstChunk && strongSegment.length > INITIAL_CHUNK_LENGTH) {
        splitSegmentForLimit(strongSegment, INITIAL_CHUNK_LENGTH).forEach(appendSegment);
        return;
      }

      if (strongSegment.length <= MAX_CHUNK_LENGTH) {
        appendSegment(strongSegment);
        return;
      }

      const softSegments = splitByPunctuation(strongSegment, [',', ';', ':']);
      if (softSegments.length > 1) {
        softSegments.forEach(appendSegment);
        return;
      }

      if (strongSegment.length <= EMERGENCY_CHUNK_LENGTH) {
        appendSegment(strongSegment);
        return;
      }

      splitOnWhitespaceNearLimit(strongSegment, MAX_CHUNK_LENGTH).forEach(appendSegment);
    });

    if (currentChunk) {
      chunks.push(currentChunk.trim());
    }
    return chunks;
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

    const chunks = splitIntoChunks(cleaned);
    if (chunks.length === 0) return;

    window.dispatchEvent(new CustomEvent('stop-all-audio', { detail: { id: msg.id } }));

    setIsSpeaking(true);
    onSpeakingChange?.(true);

    const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioCtxClass();
    audioCtxRef.current = ctx;
    if (ctx.state === 'suspended') {
      try { await ctx.resume(); } catch {}
    }

    const controller = new AbortController();
    abortRef.current = controller;

    playbackIdxRef.current = 0;
    audioBuffersRef.current = new Array(chunks.length).fill(null);
    let fetchIdx = 0;
    let isPlaying = false;
    let prefetchStarted = false;

    const playQueue = () => {
      if (controller.signal.aborted) return;

      const currentIdx = playbackIdxRef.current;
      if (currentIdx >= chunks.length) {
        stopAudio();
        return;
      }

      const buffer = audioBuffersRef.current[currentIdx];
      if (!buffer) {
        isPlaying = false;
        return;
      }

      isPlaying = true;
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);

      const now = ctx.currentTime;
      let startTime = nextStartTimeRef.current;
      if (startTime < now) {
        startTime = now + 0.01;
      }

      source.onended = () => {
        if (!controller.signal.aborted) {
          playbackIdxRef.current++;
          isPlaying = false;
          playQueue();
        }
      };

      source.start(startTime);
      nextStartTimeRef.current = startTime + buffer.duration;
      audioSourceRef.current = source;
      setAudioReady(true);
    };

    const fetchNext = async () => {
      if (fetchIdx >= chunks.length || controller.signal.aborted) return;

      const currentFetchIdx = fetchIdx++;
      try {
        const response = await fetch(`${API_BASE}/tts/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: chunks[currentFetchIdx], lang }),
          signal: controller.signal,
        });

        if (!response.ok) throw new Error(`TTS HTTP ${response.status}`);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

        audioBuffersRef.current[currentFetchIdx] = audioBuffer;

        if (currentFetchIdx === 0 && !prefetchStarted && chunks.length > 1) {
          prefetchStarted = true;
          setTimeout(fetchNext, 0);
        }

        if (currentFetchIdx === playbackIdxRef.current && !isPlaying) {
          playQueue();
        }

        fetchNext();
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('AudioQueue fetch error:', err);
          if (currentFetchIdx === playbackIdxRef.current) {
            playbackIdxRef.current++;
            playQueue();
          }
          fetchNext();
        }
      }
    };

    fetchNext();
  };

  return (
    <div className={`flex gap-2 md:gap-3 ${isUser ? 'flex-row-reverse' : 'items-start animate-[hero-fade-up_0.4s_ease-out]'}`}>
      <div className={`w-8 h-8 md:w-9 md:h-9 rounded-xl md:rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm border ${
        isUser ? 'bg-white border-gray-100' : 'bg-green-600 border-green-500'
      }`}>
        {isUser ? <User size={16} className="text-gray-400" /> : <Sprout size={16} className="text-white" />}
      </div>

      <div className={`flex flex-col min-w-0 max-w-[88%] md:max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div className={`relative max-w-full px-4 md:px-6 py-3 md:py-5 rounded-2xl md:rounded-[2rem] shadow-lg md:shadow-2xl border-0 transition-all ${
          isUser 
            ? 'bg-gradient-to-br from-green-600 via-green-700 to-emerald-800 rounded-tr-none text-white shadow-green-900/20' 
            : 'bg-white/90 backdrop-blur-xl border border-white/50 rounded-tl-none shadow-green-900/5'
        }`}>

          {isUser && msg.imagePreview && (
            <div className="mb-4 rounded-2xl overflow-hidden border-2 border-white/20 shadow-lg">
              <img src={msg.imagePreview} alt="User Upload" className="w-full h-auto max-h-60 object-cover" />
            </div>
          )}
          {isUser && msg.videoPreview && (
            <div className="mb-4 rounded-2xl overflow-hidden border-2 border-white/20 shadow-lg">
              <video src={msg.videoPreview} controls className="w-full h-auto max-h-60 object-cover" />
            </div>
          )}

          {isUser ? (
             <p className="m-0 text-[16px] font-medium leading-relaxed break-words">{msg.text}</p>
          ) : (
            <div className="text-[15px] md:text-[16px] leading-relaxed text-gray-800 w-full break-words">
              {renderContent(msg.text)}
              {msg.isStreaming && (
                <span className="inline-block w-1 h-5 bg-green-500 ml-1 align-middle animate-pulse rounded-full" />
              )}
            </div>
          )}

          {!isUser && !msg.isStreaming && msg.text && (
            <button
              onClick={handleSpeak}
              className={`absolute -bottom-2 -right-2 md:top-2 md:-right-12 md:bottom-auto p-2 md:p-2.5 rounded-lg md:rounded-xl transition-all shadow-sm border ${
                isSpeaking 
                  ? 'bg-red-50 border-red-100 text-red-500 animate-pulse' 
                  : 'bg-white/90 border-gray-100 text-gray-400 hover:text-green-600 hover:border-green-200 hover:shadow-md'
              }`}
              title={isSpeaking ? "Arrêter la lecture" : "Écouter la réponse"}
            >
              {isSpeaking ? <Square size={14} fill="currentColor" /> : <Volume2 size={14} />}
            </button>
          )}
        </div>
        <span className="text-[10px] text-gray-400 mt-1 px-1">
          {isUser ? 'Vous' : 'AgriBot AI'} · {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
};

export default Message;