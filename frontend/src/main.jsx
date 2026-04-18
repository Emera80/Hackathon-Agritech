import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import LandingPage from './components/LandingPage.jsx'

function Root() {
  const [started, setStarted] = useState(false);
  const [showApp, setShowApp] = useState(false);

  if (!started) {
    return <LandingPage onStart={() => {
      setStarted(true);
      setTimeout(() => setShowApp(true), 50);
    }} />;
  }

  return (
    <div style={{ opacity: showApp ? 1 : 0, transition: 'opacity 0.5s ease-out' }}>
      <App />
    </div>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
