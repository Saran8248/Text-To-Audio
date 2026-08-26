import { API_BASE_URL } from '../config/api';

export async function apiFetch(endpoint, options = {}) {
    const baseUrl = API_BASE_URL;
    const url = `${baseUrl}${endpoint}`;
    
    console.log("API URL:", baseUrl || "(same-origin / vercel proxy)");
    console.log("Request URL:", url);

    try {
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
                errorText = data.message || data.error || JSON.stringify(data);
            } catch (e) {
                errorText = await response.text();
            }
            throw new Error(`API request failed: ${response.status} ${errorText || 'Unknown error'}`);
        }

        return response;
    } catch (error) {
        console.error("TTS API ERROR:", error);
        console.error("Request URL:", url);
        throw error;
    }
}
