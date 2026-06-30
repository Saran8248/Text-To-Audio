const configuredApiUrl = process.env.REACT_APP_API_BASE_URL || process.env.REACT_APP_API_URL;

export const API_BASE_URL = (configuredApiUrl || 'http://localhost:5000').replace(/\/+$/, '');
