const normalizeApiUrl = (url) => {
  if (!url) return null;
  const trimmed = String(url).trim().replace(/\/+$/, '');
  if (!trimmed) return null;
  if (/^[a-zA-Z][a-zA-Z\d+-.]*:/.test(trimmed)) {
    return trimmed;
  }
  return `http://${trimmed}`;
};

const isProduction = process.env.NODE_ENV === 'production';
const isVercelHost = typeof window !== 'undefined' && /\.vercel\.app$/.test(window.location.hostname);
const configuredApiUrl = normalizeApiUrl(process.env.REACT_APP_API_BASE_URL || process.env.REACT_APP_API_URL);
const defaultApiUrl = isProduction ? '' : 'http://localhost:5000';

if (isProduction && !configuredApiUrl) {
  console.warn(
    'REACT_APP_API_BASE_URL is not set. Using same-origin API requests in production.'
  );
}

export const API_BASE_URL = isProduction && isVercelHost ? defaultApiUrl : (configuredApiUrl || defaultApiUrl);
