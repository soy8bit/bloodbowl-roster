import React from 'react';
import ReactDOM from 'react-dom/client';
import { MotionGlobalConfig } from 'motion/react';
import App from './components/App';
import './App.css';

MotionGlobalConfig.skipAnimations =
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
