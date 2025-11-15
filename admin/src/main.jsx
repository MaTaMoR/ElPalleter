import './styles/global.css';
import './styles/responsive.css';

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

import I18nService from '@services/I18nService.js';

await I18nService.init();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)