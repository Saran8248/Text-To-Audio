import { API_BASE_URL } from '../config/api';

export async function apiFetch(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    console.log("API Request:", url);

    const response = await fetch(url, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {})
        }
    });

    if (!response.ok) {
        let errorText = "";
        try {
            const data = await response.json();
            errorText = data.message || JSON.stringify(data);
        } catch (e) {
            errorText = await response.text();
        }
        throw new Error(`API error ${response.status}: ${errorText || 'Unknown error'}`);
    }

    return response;
}
