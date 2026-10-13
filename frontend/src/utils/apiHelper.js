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
                const text = await response.text();
                try {
                    const data = JSON.parse(text);
                    errorText = data.message || data.error || JSON.stringify(data);
                } catch (e) {
                    errorText = text;
                }
            } catch (err) {
                errorText = "Could not read error response";
            }
            if (
                errorText.includes("wss://speech.platform.bing.com") ||
                (errorText.includes("403") && errorText.includes("Invalid response status"))
            ) {
                errorText = "TTS service connection error (403 Forbidden). Microsoft Edge TTS endpoint refused the connection.";
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


