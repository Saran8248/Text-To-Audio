const normalizeApiUrl = (url) => {
  if (!url) return null;
  const trimmed = String(url).trim().replace(/\/+$/, '');
  if (!trimmed) return null;
  if (/^[a-zA-Z][a-zA-Z\d+-.]*:/.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
};

const renderBackendUrl = 'https://text-to-audio-1.onrender.com';

let envApiUrl = null;
try {
  if (typeof process !== 'undefined' && process.env) {
    envApiUrl = process.env.REACT_APP_API_BASE_URL || process.env.REACT_APP_API_URL || process.env.VITE_API_URL;
  }
} catch (e) {}

const configuredApiUrl = normalizeApiUrl(envApiUrl);
const isBrowser = typeof window !== 'undefined';
const isLocalhost = isBrowser && (
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1' ||
  window.location.hostname === '0.0.0.0' ||
  window.location.hostname === ''
);

let defaultBackendUrl = renderBackendUrl;
if (isLocalhost) {
  defaultBackendUrl = 'http://localhost:5000';
} else if (isBrowser && window.location.port === '5000') {
  defaultBackendUrl = window.location.origin;
}

export const API_BASE_URL = configuredApiUrl || defaultBackendUrl;
