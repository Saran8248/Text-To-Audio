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
const configuredApiUrl = normalizeApiUrl(process.env.REACT_APP_API_BASE_URL || process.env.REACT_APP_API_URL);
const renderBackendUrl = 'https://text-to-audio-ow4o.onrender.com';

if (!configuredApiUrl) {
  console.warn(
    'REACT_APP_API_BASE_URL is not configured. Falling back to the default Render backend.'
  );
}

export const API_BASE_URL = configuredApiUrl || renderBackendUrl;
