import { useState, useEffect, useRef } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { Send, Mic, MicOff, Loader2, Camera, X, Image as ImageIcon, Video } from 'lucide-react';

const InputArea = ({ onSendMessage, onAbort, isLoading, isWelcome }) => {
  const [input, setInput] = useState('');
  const [language, setLanguage] = useState('fr-FR');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [fileType, setFileType] = useState(null);
  const fileInputRef = useRef(null);

  const { transcript, interimTranscript, listening, resetTranscript,
    browserSupportsSpeechRecognition, isMicrophoneAvailable } = useSpeechRecognition();

  useEffect(() => { if (transcript) setInput(transcript); }, [transcript]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const text = input.trim();
    if ((!text && !selectedFile) || isLoading) return;
    if (listening) SpeechRecognition.stopListening();
    
    onSendMessage(text, selectedFile);
    
    setInput('');
    setSelectedFile(null);
    setPreviewUrl(null);
    setFileType(null);
    resetTranscript();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Limites de taille : 10Mo pour images, 25Mo pour vidéos
      const maxSize = file.type.startsWith('video/') ? 25 * 1024 * 1024 : 10 * 1024 * 1024;
      if (file.size > maxSize) {
        alert(file.type.startsWith('video/') 
          ? "La vidéo est trop volumineuse (max 25 Mo). Veuillez compresser la vidéo ou en choisir une plus courte." 
          : "L'image est trop volumineuse (max 10 Mo).");
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setFileType(file.type.startsWith('video/') ? 'video' : 'image');
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setFileType(null);
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
    <div className={`px-3 md:px-4 pb-4 pt-2 w-full max-w-lg md:max-w-4xl lg:max-w-5xl mx-auto`}>
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

      {/* Prévisualisation du média */}
      {previewUrl && (
        <div className="relative inline-block mb-2 ml-2">
          {fileType === 'video' ? (
            <video 
              src={previewUrl} 
              className="h-20 w-32 object-cover rounded-xl border-2 border-green-500 shadow-lg" 
              controls={false}
              autoPlay
              muted
              loop
            />
          ) : (
            <img src={previewUrl} alt="Preview" className="h-20 w-20 object-cover rounded-xl border-2 border-green-500 shadow-lg" />
          )}
          <button 
            onClick={clearFile}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"
          >
            <X size={12} />
          </button>
        </div>
      )}

      {/* Barre d'input */}
      <form onSubmit={handleSubmit}
        className="flex items-center gap-1.5 md:gap-2 bg-white border border-gray-200 rounded-2xl px-2 md:px-3 py-2 shadow-sm focus-within:border-green-400 focus-within:shadow-md transition-all"
      >
        {/* Upload Image/Video / Camera */}
        <div className="flex items-center gap-1">
          <input 
            type="file" 
            accept="image/*,video/*" 
            className="hidden" 
            ref={fileInputRef}
            onChange={handleFileChange}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-1.5 md:p-2 rounded-xl text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors"
            title="Ajouter une photo ou vidéo"
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
            className={`p-1.5 md:p-2 rounded-xl transition-colors flex-shrink-0 ${
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
          className={`flex-1 bg-transparent outline-none text-base md:text-sm text-gray-800 min-w-0 ${
            isInterim ? 'text-gray-400 italic' : ''
          }`}
        />

        {/* Bouton envoyer / Arrêter */}
        {isLoading ? (
          <button
            type="button"
            onClick={onAbort}
            aria-label="Arrêter la génération"
            className="p-1.5 md:p-2 rounded-xl transition-all flex-shrink-0 bg-red-50 text-red-500 hover:bg-red-100 shadow-sm flex items-center justify-center gap-1.5"
          >
            <span className="w-2.5 h-2.5 bg-red-500 rounded-sm animate-pulse" />
            <span className="hidden sm:inline text-xs font-bold uppercase tracking-wider">Stop</span>
          </button>
        ) : (
          <button
            type="submit"
            disabled={!input.trim() && !selectedFile}
            aria-label="Envoyer le message"
            className={`p-1.5 md:p-2 rounded-xl transition-all flex-shrink-0 ${
              (input.trim() || selectedFile)
                ? 'bg-green-600 text-white hover:bg-green-500 shadow-sm'
                : 'bg-gray-100 text-gray-300 cursor-not-allowed'
            }`}
          >
            <Send size={18} />
          </button>
        )}
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
