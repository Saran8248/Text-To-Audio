const normalizeApiUrl = (url) => {
  if (!url) return null;
  const trimmed = String(url).trim().replace(/\/+$/, '');
  if (!trimmed) return null;
  if (/^[a-zA-Z][a-zA-Z\d+-.]*:/.test(trimmed)) {
    return trimmed;
  }
  return `http://${trimmed}`;
};

const configuredApiUrl = normalizeApiUrl(process.env.REACT_APP_API_BASE_URL || process.env.REACT_APP_API_URL);
const defaultApiUrl = process.env.NODE_ENV === 'production'
  ? window.location.origin
  : 'http://localhost:5000';

if (process.env.NODE_ENV === 'production' && !configuredApiUrl) {
  console.warn(
    'REACT_APP_API_BASE_URL is not set. Using same-origin requests in production. Set REACT_APP_API_BASE_URL to your backend URL if frontend and backend are hosted separately.'
  );
}

export const API_BASE_URL = configuredApiUrl || defaultApiUrl;
