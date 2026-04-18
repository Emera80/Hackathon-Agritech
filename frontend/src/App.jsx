import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import 'regenerator-runtime/runtime';
import Message from './components/Message';
import InputArea from './components/InputArea';
import HistorySidebar from './components/HistorySidebar';
import { Sprout, Info, Clock } from 'lucide-react';

const API_BASE = 'http://127.0.0.1:8000/api';

const DEFAULT_MESSAGE = { 
  sender: 'bot', 
  text: "### Aslama ! 🌾\nJe suis **AgriAssistant TN**, votre expert agricole dédié à la Tunisie.\n\nPosez-moi vos questions sur :\n- Le calendrier des cultures\n- L'irrigation et la météo\n- L'entretien des sols\n- Les subventions et ressources officielles" 
};

function App() {
  const [messages, setMessages] = useState([DEFAULT_MESSAGE]);
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const response = await axios.get(`${API_BASE}/sessions/`);
      setSessions(response.data);
    } catch (error) {
      console.error("Erreur lors de la récupération des sessions :", error);
    }
  };

  const loadSession = async (id) => {
    if (id === null) {
      setCurrentSessionId(null);
      setMessages([DEFAULT_MESSAGE]);
      setIsHistoryOpen(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.get(`${API_BASE}/sessions/${id}/`);
      setMessages(response.data.messages);
      setCurrentSessionId(id);
      setIsHistoryOpen(false);
    } catch (error) {
      console.error("Erreur lors du chargement de la session :", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (text) => {
    const userMessage = { sender: 'user', text };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await axios.post(`${API_BASE}/chat/`, {
        question: text,
        localisation: "Tunis",
        session_id: currentSessionId
      });

      setMessages(prev => [...prev, { sender: 'bot', text: response.data.reponse }]);
      
      // Mettre à jour la session courante si elle vient d'être créée
      if (!currentSessionId && response.data.session_id) {
        setCurrentSessionId(response.data.session_id);
        fetchSessions();
      }
    } catch (error) {
      console.error("Erreur :", error);
      setMessages(prev => [...prev, { 
        sender: 'bot', 
        text: "**Oups !** Une erreur est survenue lors de la connexion au serveur. Vérifiez que le backend Django est bien lancé." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 font-sans text-gray-900">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 p-4 sticky top-0 z-10 shadow-sm">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-green-600 p-2 rounded-xl text-white shadow-lg shadow-green-200">
              <Sprout size={24} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-800 leading-none">AgriAssistant TN</h1>
              <p className="text-xs text-green-600 font-medium">Expertise Agricole Tunisienne</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsHistoryOpen(true)}
              className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-full transition-all"
              title="Historique des conversations"
            >
              <Clock size={22} />
            </button>
            <button className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-full transition-all">
              <Info size={22} />
            </button>
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto p-4 space-y-6 chat-scrollbar">
        <div className="max-w-3xl mx-auto space-y-6 pb-4">
          {messages.map((msg, index) => (
            <Message key={index} msg={msg} />
          ))}
          {isLoading && (
            <div className="flex justify-start animate-pulse">
              <div className="bg-white border border-gray-100 p-4 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-bounce"></span>
                </div>
                <span className="text-xs text-gray-400 font-medium ml-1">Analyse en cours...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Area */}
      <InputArea onSendMessage={handleSendMessage} isLoading={isLoading} />

      {/* Sidebar Historique */}
      <HistorySidebar 
        isOpen={isHistoryOpen} 
        onClose={() => setIsHistoryOpen(false)} 
        sessions={sessions}
        onSelectSession={loadSession}
        currentSessionId={currentSessionId}
      />
    </div>
  );
}

export default App;