import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { User, Bot, Volume2, Square } from 'lucide-react';

const Message = ({ msg }) => {
  const isUser = msg.sender === 'user';
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const cleanTextForSpeech = (text) => {
    return text
      .replace(/!\[.*?\]\(.*?\)/g, '') // Supprimer les images Markdown
      .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Garder le texte des liens mais supprimer l'URL
      .replace(/[#*`~_]/g, '')        // Supprimer les symboles de formatage Markdown
      .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '') // Supprimer les émojis
      .replace(/\s+/g, ' ')           // Normaliser les espaces
      .trim();
  };

  const handleSpeak = () => {
    if ('speechSynthesis' in window) {
      if (isSpeaking) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
        return;
      }

      window.speechSynthesis.cancel();
      
      const cleanedText = cleanTextForSpeech(msg.text);
      if (!cleanedText) return;

      const utterance = new SpeechSynthesisUtterance(cleanedText);
      
      const isArabic = /[\u0600-\u06FF]/.test(msg.text);
      utterance.lang = isArabic ? 'ar-TN' : 'fr-FR';
      
      // Essayer de trouver une voix spécifique si disponible
      const voices = window.speechSynthesis.getVoices();
      if (isArabic) {
        const arVoice = voices.find(v => v.lang.startsWith('ar'));
        if (arVoice) utterance.voice = arVoice;
      } else {
        const frVoice = voices.find(v => v.lang.startsWith('fr'));
        if (frVoice) utterance.voice = frVoice;
      }

      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      
      window.speechSynthesis.speak(utterance);
    }
  };

  // Nettoyage si le composant est démonté
  useEffect(() => {
    return () => {
      if (isSpeaking) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isSpeaking]);

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300 group`}>
      <div className={`flex gap-3 max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isUser ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
          {isUser ? <User size={18} /> : <Bot size={18} />}
        </div>
        <div className="relative">
          <div className={`p-4 rounded-2xl shadow-sm ${
            isUser 
              ? 'bg-green-600 text-white rounded-tr-none' 
              : 'bg-white border border-gray-100 text-gray-800 rounded-tl-none'
          }`}>
            <div className={`prose prose-sm max-w-none ${isUser ? 'prose-invert text-white' : 'text-gray-800'}`}>
              <ReactMarkdown>{msg.text}</ReactMarkdown>
            </div>
          </div>
          
          {!isUser && (
            <button 
              onClick={handleSpeak}
              className={`absolute -right-10 top-2 p-2 rounded-full border transition-all shadow-sm ${
                isSpeaking 
                  ? 'bg-red-50 border-red-100 text-red-600 opacity-100' 
                  : 'bg-white border-gray-100 text-gray-400 hover:text-green-600 hover:shadow-md opacity-0 group-hover:opacity-100'
              }`}
              title={isSpeaking ? "Arrêter la lecture" : "Lire la réponse"}
            >
              {isSpeaking ? <Square size={16} fill="currentColor" /> : <Volume2 size={16} />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Message;
