import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles/theme.css';
import { initGame, startClock } from './engine/game.js';
import App from './ui/App.jsx';

initGame();
startClock();
createRoot(document.getElementById('root')).render(<App />);
