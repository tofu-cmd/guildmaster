import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles/theme.css';
import './styles/motion.css';
import './styles/depth.css';
import { applyMotion } from './ui/motion.js';
import { initGame, startClock } from './engine/game.js';
import App from './ui/App.jsx';

applyMotion();
initGame();
startClock();
createRoot(document.getElementById('root')).render(<App />);
