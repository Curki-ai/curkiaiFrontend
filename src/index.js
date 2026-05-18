import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Suppress benign "ResizeObserver loop" warnings that webpack-dev-server's
// overlay surfaces as uncaught runtime errors. The spec defines this as a
// non-fatal notification, so we stop it before the overlay sees it.
const RESIZE_OBSERVER_LOOP_ERRORS = [
  'ResizeObserver loop limit exceeded',
  'ResizeObserver loop completed with undelivered notifications',
];

window.addEventListener('error', (event) => {
  if (event.message && RESIZE_OBSERVER_LOOP_ERRORS.some((msg) => event.message.includes(msg))) {
    event.stopImmediatePropagation();
    event.preventDefault();
  }
});

window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason && (event.reason.message || event.reason);
  if (typeof reason === 'string' && RESIZE_OBSERVER_LOOP_ERRORS.some((msg) => reason.includes(msg))) {
    event.stopImmediatePropagation();
    event.preventDefault();
  }
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
