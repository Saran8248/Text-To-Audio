const configuredApiUrl = process.env.REACT_APP_API_BASE_URL || process.env.REACT_APP_API_URL;

const normalizeApiUrl = (url) => {
  if (!url) return null;
  const trimmed = String(url).trim().replace(/\/+$/, '');
  if (!trimmed) return null;
  if (/^[a-zA-Z][a-zA-Z\d+-.]*:/.test(trimmed)) {
    return trimmed;
  }
  return `http://${trimmed}`;
};

const developmentBaseUrl = process.env.NODE_ENV === 'development' ? '' : 'http://localhost:5000';
export const API_BASE_URL = normalizeApiUrl(configuredApiUrl) || developmentBaseUrl;
