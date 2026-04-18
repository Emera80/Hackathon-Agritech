import { useState, useEffect } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { Send, Mic, MicOff, Loader2 } from 'lucide-react';

const InputArea = ({ onSendMessage, isLoading }) => {
  const [input, setInput] = useState('');
  const [language, setLanguage] = useState('ar-TN'); // Par défaut arabe tunisien
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition();

  useEffect(() => {
    if (transcript) {
      setInput(transcript);
    }
  }, [transcript]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input);
    setInput('');
    resetTranscript();
  };

  const toggleListening = () => {
    if (listening) {
      SpeechRecognition.stopListening();
    } else {
      SpeechRecognition.startListening({ continuous: true, language: language });
    }
  };

  return (
    <footer className="p-4 bg-white border-t border-gray-100 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
      <div className="max-w-3xl mx-auto flex flex-col gap-3">
        {/* Sélecteur de langue pour la voix */}
        <div className="flex justify-end gap-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">
          <button 
            type="button"
            onClick={() => setLanguage('ar-TN')}
            className={`px-2 py-1 rounded ${language === 'ar-TN' ? 'bg-green-100 text-green-700' : 'hover:bg-gray-100'}`}
          >
            🇹🇳 Arabe (TN)
          </button>
          <button 
            type="button"
            onClick={() => setLanguage('fr-FR')}
            className={`px-2 py-1 rounded ${language === 'fr-FR' ? 'bg-green-100 text-green-700' : 'hover:bg-gray-100'}`}
          >
            🇫🇷 Français
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2 items-center">
          {browserSupportsSpeechRecognition && (
            <button
              type="button"
              onClick={toggleListening}
              className={`p-3 rounded-full transition-colors ${
                listening ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
              title={listening ? "Arrêter l'écoute" : `Démarrer la dictée en ${language === 'ar-TN' ? 'Arabe' : 'Français'}`}
            >
              {listening ? <MicOff size={20} /> : <Mic size={20} />}
            </button>
          )}
          
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={listening ? "Je vous écoute..." : "Écrivez votre question ici..."}
            className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition-all"
            disabled={isLoading}
          />
          
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="bg-green-600 text-white p-3 rounded-2xl hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all shadow-sm flex items-center justify-center min-w-[50px]"
          >
            {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
          </button>
        </form>
      </div>
      {listening && (
        <p className="text-center text-xs text-red-500 mt-2 font-medium">
          Microphone activé ({language === 'ar-TN' ? 'Arabe Tunisien' : 'Français'}) - Parlez maintenant
        </p>
      )}
    </footer>
  );
};

export default InputArea;
