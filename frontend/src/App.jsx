import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Chat from './pages/Chat'; // L'ancien App.jsx que tu as déplacé

// Petit composant pour protéger la route Chat
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
};

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        {/* La route principale est protégée, il faut être connecté */}
        <Route path="/" element={<PrivateRoute><Chat /></PrivateRoute>} />
      </Routes>
    </Router>
  );
}