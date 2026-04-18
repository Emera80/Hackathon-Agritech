import { useState, useEffect, useRef } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { Send, Mic, MicOff, Loader2, Camera, X, Image as ImageIcon } from 'lucide-react';

const InputArea = ({ onSendMessage, isLoading, isWelcome }) => {
  const [input, setInput] = useState('');
  const [language, setLanguage] = useState('fr-FR');
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);

  const { transcript, interimTranscript, listening, resetTranscript,
    browserSupportsSpeechRecognition, isMicrophoneAvailable } = useSpeechRecognition();

  useEffect(() => { if (transcript) setInput(transcript); }, [transcript]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const text = input.trim();
    if ((!text && !selectedImage) || isLoading) return;
    if (listening) SpeechRecognition.stopListening();
    
    onSendMessage(text, selectedImage);
    
    setInput('');
    setSelectedImage(null);
    setPreviewUrl(null);
    resetTranscript();
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const toggleListening = async () => {
    if (listening) {
      await SpeechRecognition.stopListening();
    } else {
      resetTranscript();
      setInput('');
      await SpeechRecognition.startListening({ continuous: true, language });
    }
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInput(val);
    if (val.length > 4) {
      const arabicCount = (val.match(/[\u0600-\u06FF]/g) || []).length;
      const detected = arabicCount > 2 ? 'ar-TN' : 'fr-FR';
      if (detected !== language) setLanguage(detected);
    }
  };

  const isAr = language === 'ar-TN';
  const displayValue = (listening && interimTranscript) ? interimTranscript : input;
  const isInterim = listening && !!interimTranscript && !input;

  return (
    <div className={`px-4 pb-4 pt-2 ${isWelcome ? 'max-w-2xl mx-auto w-full' : ''}`}>
      {/* Sélecteur de langue */}
      <div className="flex justify-end gap-1 mb-2 text-[10px] font-semibold uppercase tracking-wider">
        {['ar-TN', 'fr-FR'].map(lang => (
          <button
            key={lang}
            type="button"
            onClick={() => setLanguage(lang)}
            className={`px-2 py-1 rounded-lg transition-colors ${
              language === lang
                ? 'bg-green-100 text-green-700'
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
            }`}
          >
            {lang === 'ar-TN' ? '🇹🇳 AR' : '🇫🇷 FR'}
          </button>
        ))}
      </div>

      {/* Prévisualisation de l'image */}
      {previewUrl && (
        <div className="relative inline-block mb-2 ml-2">
          <img src={previewUrl} alt="Preview" className="h-20 w-20 object-cover rounded-xl border-2 border-green-500 shadow-lg" />
          <button 
            onClick={clearImage}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"
          >
            <X size={12} />
          </button>
        </div>
      )}

      {/* Barre d'input */}
      <form onSubmit={handleSubmit}
        className="flex items-center gap-2 bg-white border border-gray-200 rounded-2xl px-3 py-2 shadow-sm focus-within:border-green-400 focus-within:shadow-md transition-all"
      >
        {/* Upload Image / Camera */}
        <div className="flex items-center gap-1">
          <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            ref={fileInputRef}
            onChange={handleImageChange}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 rounded-xl text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors"
            title="Ajouter une photo"
          >
            <Camera size={18} />
          </button>
        </div>

        {/* Microphone */}
        {browserSupportsSpeechRecognition && (
          <button
            type="button"
            onClick={toggleListening}
            disabled={!isMicrophoneAvailable}
            className={`p-2 rounded-xl transition-colors flex-shrink-0 ${
              !isMicrophoneAvailable ? 'text-gray-200 cursor-not-allowed'
              : listening ? 'text-red-500 bg-red-50 animate-pulse'
              : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
            }`}
          >
            {listening ? <MicOff size={18} /> : <Mic size={18} />}
          </button>
        )}

        {/* Champ texte */}
        <input
          type="text"
          value={displayValue}
          onChange={handleInputChange}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSubmit(e)}
          placeholder={
            listening
              ? (isAr ? 'تكلم الآن…' : 'Parlez maintenant…')
              : (isAr ? 'اكتب سؤالك هنا…' : 'Posez votre question…')
          }
          dir={isAr ? 'rtl' : 'ltr'}
          disabled={isLoading}
          className={`flex-1 bg-transparent outline-none text-sm text-gray-800 ${
            isInterim ? 'text-gray-400 italic' : ''
          }`}
        />

        {/* Bouton envoyer */}
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className={`p-2 rounded-xl transition-all flex-shrink-0 ${
            input.trim() && !isLoading
              ? 'bg-green-600 text-white hover:bg-green-500 shadow-sm'
              : 'bg-gray-100 text-gray-300 cursor-not-allowed'
          }`}
        >
          {isLoading
            ? <Loader2 size={18} className="animate-spin text-green-600" />
            : <Send size={18} />
          }
        </button>
      </form>

      {/* Indicateur écoute */}
      {listening && (
        <p className="text-center text-xs text-red-400 mt-1.5 font-medium">
          {isAr ? '🎙️ الميكروفون مفعّل' : '🎙️ Microphone actif — parlez maintenant'}
        </p>
      )}
    </div>
  );
};

export default InputArea;
