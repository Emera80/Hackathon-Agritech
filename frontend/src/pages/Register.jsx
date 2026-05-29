import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Sprout, Loader2 } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE;

export default function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      await axios.post(`${API_BASE}/register/`, { username, password });
      navigate('/login'); // Redirection vers le login après succès
    } catch (err) {
      setError(err.response?.data?.erreur || "Une erreur est survenue lors de l'inscription.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f7f4] px-4">
      <div className="max-w-md w-full bg-white rounded-[2rem] shadow-xl p-8 border border-green-50">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-gradient-to-br from-green-400 to-green-600 shadow-lg mb-4">
            <Sprout size={32} className="text-white" />
          </div>
          <h2 className="text-2xl font-extrabold text-gray-800">Rejoindre AgriBot</h2>
          <p className="text-sm text-gray-500 mt-1">Créez votre compte pour sauvegarder vos données</p>
        </div>

        {error && <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm mb-4 text-center font-medium border border-red-100">{error}</div>}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 ml-1">Nom d'utilisateur</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 ml-1">Mot de passe</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6}
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all" />
          </div>
          <button type="submit" disabled={isLoading}
            className="w-full mt-2 bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 px-4 rounded-xl transition-colors shadow-md flex justify-center items-center">
            {isLoading ? <Loader2 className="animate-spin" size={20} /> : "Créer mon compte"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Déjà un compte ? <Link to="/login" className="text-green-600 font-bold hover:underline">Se connecter</Link>
        </p>
      </div>
    </div>
  );
}