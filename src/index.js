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

// ----- Suppress hover "jump"/flicker while scrolling -----
// Many cards and buttons across the app pair `transition: all` with a
// `:hover { transform: translateY(...) }` lift. While the user scrolls, the
// stationary cursor keeps crossing these elements and re-firing their hover
// state, so they appear to move up/down or flicker. We flag <body> as
// `is-scrolling` during active scroll (capture phase so inner scroll
// containers count too, since scroll events don't bubble) and clear it shortly
// after scrolling stops. CSS then disables hover interactions for that brief
// window only — no visual design changes.
let scrollIdleTimer = null;
window.addEventListener(
  'scroll',
  () => {
    const { body } = document;
    if (!body) return;
    if (!body.classList.contains('is-scrolling')) {
      body.classList.add('is-scrolling');
    }
    if (scrollIdleTimer) clearTimeout(scrollIdleTimer);
    scrollIdleTimer = setTimeout(() => {
      body.classList.remove('is-scrolling');
    }, 150);
  },
  { capture: true, passive: true }
);

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
