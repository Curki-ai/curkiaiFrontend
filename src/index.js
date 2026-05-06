import React from 'react';
import ReactDOM from 'react-dom/client';
import axios from 'axios';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// ── Dev-only API host redirect ───────────────────────────────────────────
// Most modules in this app hardcode the production backend URL. When the
// frontend is served from localhost (i.e. `npm start`) we rewrite outbound
// API calls so they hit the local backend instead. Production builds are
// untouched: the redirect only activates when window.location.hostname is
// localhost / 127.0.0.1. Remove this block to revert.
const PROD_API_HOST =
  'https://curki-test-prod-auhyhehcbvdmh3ef.canadacentral-01.azurewebsites.net';
const LOCAL_API_HOST = 'http://localhost:5000';

const isLocalhost =
  typeof window !== 'undefined' &&
  /^(localhost|127\.0\.0\.1|0\.0\.0\.0)$/.test(window.location.hostname);

if (isLocalhost) {
  console.log(
    `[dev-redirect] Rewriting API calls: ${PROD_API_HOST} → ${LOCAL_API_HOST}`
  );

  const rewrite = (url) => {
    if (typeof url !== 'string') return url;
    if (url.startsWith(PROD_API_HOST)) {
      return LOCAL_API_HOST + url.slice(PROD_API_HOST.length);
    }
    return url;
  };

  // Axios — covers every file that uses `import axios from "axios"`.
  axios.interceptors.request.use((config) => {
    if (config.url) config.url = rewrite(config.url);
    if (config.baseURL) config.baseURL = rewrite(config.baseURL);
    return config;
  });

  // fetch — covers files that bypass axios.
  const originalFetch = window.fetch.bind(window);
  window.fetch = (input, init) => {
    if (typeof input === 'string') {
      return originalFetch(rewrite(input), init);
    }
    if (input instanceof Request) {
      return originalFetch(new Request(rewrite(input.url), input), init);
    }
    return originalFetch(input, init);
  };
}
// ─────────────────────────────────────────────────────────────────────────

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
