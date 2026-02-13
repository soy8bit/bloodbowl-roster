import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { MotionGlobalConfig } from 'motion/react';
import { AuthProvider } from './hooks/useAuth';
import App from './components/App';
import './App.css';

MotionGlobalConfig.skipAnimations =
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
