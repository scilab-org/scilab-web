import * as React from 'react';
import { createRoot } from 'react-dom/client';

import './index.css';
import { App } from './app';
import { initializeTheme } from './lib/theme';

// Initialize theme before render to prevent flash
initializeTheme();

const root = document.getElementById('root');
if (!root) throw new Error('No root element found');

createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
