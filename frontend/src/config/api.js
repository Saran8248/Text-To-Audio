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
const isVercelHost = typeof window !== 'undefined' && window.location.hostname.includes('vercel.app');

// Force direct connection to backend on Vercel to avoid 502 proxy timeouts
export const API_BASE_URL = configuredApiUrl || renderBackendUrl;
