exports.handler = async function(event, context) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    const { prompt } = JSON.parse(event.body);
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        console.error("GEMINI_API_KEY is not set in environment variables.");
        return { statusCode: 500, body: JSON.stringify({ error: 'API key is not configured on the server.' }) };
    }

    const modelName = "gemini-1.5-flash-latest";
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
    const payload = { contents: [{ role: "user", parts: [{ text: prompt }] }] };

    try {
        const fetch = (await import('node-fetch')).default;
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error(`Google API Error (${response.status} ${response.statusText}):`, errorBody);
            let detailedError = `Google API Error: ${response.status} ${response.statusText}`;
            try {
                const jsonError = JSON.parse(errorBody);
                if (jsonError.error && jsonError.error.message) {
                    detailedError = jsonError.error.message;
                } else {
                    detailedError = errorBody.substring(0, 500); // Limit length
                }
            } catch (e) {
                detailedError = errorBody.substring(0,500); // Limit length
            }
            return { // Return a JSON error response
                statusCode: response.status, // Propagate Google's status if appropriate or use 500
                body: JSON.stringify({ error: detailedError })
            };
        }

        const result = await response.json();
        return {
            statusCode: 200,
            body: JSON.stringify(result)
        };
    } catch (error) {
        console.error('Error in Netlify function execution:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message || 'An internal server error occurred.' })
        };
    }
};