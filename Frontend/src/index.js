import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';      // Importa o Tailwind CSS
import App from './App'; // Componente principal da aplicação
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

reportWebVitals();
