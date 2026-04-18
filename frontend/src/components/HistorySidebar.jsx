import { X, MessageSquare, Clock } from 'lucide-react';

const HistorySidebar = ({ isOpen, onClose, sessions, onSelectSession, currentSessionId }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* Sidebar */}
      <div className="relative w-80 max-w-[90%] bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock size={20} className="text-green-600" />
            <h2 className="font-bold text-gray-800">Historique</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400">
              <MessageSquare size={32} strokeWidth={1.5} />
              <p className="text-sm mt-2">Aucune conversation</p>
            </div>
          ) : (
            sessions.map((session) => (
              <button
                key={session.id}
                onClick={() => onSelectSession(session.id)}
                className={`w-full text-left p-3 rounded-xl transition-all flex flex-col gap-1 ${
                  currentSessionId === session.id 
                    ? 'bg-green-50 border-green-100 text-green-700' 
                    : 'hover:bg-gray-50 text-gray-600'
                }`}
              >
                <span className="font-medium text-sm truncate">{session.title}</span>
                <span className="text-[10px] opacity-60">
                  {new Date(session.created_at).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </button>
            ))
          )}
        </div>
        
        <div className="p-4 border-t border-gray-100">
          <button 
            onClick={() => onSelectSession(null)}
            className="w-full py-2 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2 text-sm shadow-sm"
          >
            <MessageSquare size={16} />
            Nouvelle discussion
          </button>
        </div>
      </div>
    </div>
  );
};

export default HistorySidebar;
