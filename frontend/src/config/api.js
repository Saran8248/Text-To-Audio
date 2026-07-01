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
const defaultRenderApiUrl = 'https://text-to-audio-backend-9o8b.onrender.com';

if (process.env.NODE_ENV === 'production' && !configuredApiUrl) {
  console.warn(
    'REACT_APP_API_URL is not set. Falling back to the Render backend URL. Set REACT_APP_API_URL to your backend URL to avoid this warning.'
  );
}

export const API_BASE_URL = configuredApiUrl || defaultRenderApiUrl;
