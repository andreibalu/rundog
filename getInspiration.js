// File: /api/getInspiration.js

// This is a Vercel Serverless Function (Node.js runtime)

export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ success: false, error: `Method ${req.method} Not Allowed` });
    }

    try {
        // 1. Get the currentRollSum from the request body
        const { currentRollSum } = req.body;

        if (currentRollSum === undefined || typeof currentRollSum !== 'number' || currentRollSum <= 0) {
            return res.status(400).json({ success: false, error: 'Invalid or missing currentRollSum in request body. It must be a positive number.' });
        }

        // 2. Retrieve the Gemini API Key from Vercel Environment Variables
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            console.error("GEMINI_API_KEY is not set in environment variables.");
            return res.status(500).json({ success: false, error: 'API key not configured on the server.' });
        }

        // 3. Construct the prompt
        // This is the same prompt you had in your index.html, now on the server-side
        const prompt = `Esti un 'game announcer' entuziast, amuzant si mai din cartier. Folosesti limbaj cu slanguri moderne din Romania. Trebuie sa pari ca nu esti un AI, ci un prieten caterincos pe Discord. Jucatorul tocmai a roll-uit ${currentRollSum} din cele 2 zaruri. Asta inseamna ca trebuie sa alerge ${currentRollSum} kilometri in viata reala . Genereaza un scurt (1 propozitie), amuzant, si slightly quirky motivational message pentru alergarea lor de ${currentRollSum}km. De exemplu, daca au dat 7, ai putea zice: 'Ooo sefule 7km, sa traiesti plesni-mi-as una! Daca iti iese esti cam boss sa mor eu'`;

        // 4. Prepare the payload for the Gemini API
        const chatHistory = [{ role: "user", parts: [{ text: prompt }] }];
        const payload = { contents: chatHistory };
        const geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

        // 5. Make the fetch call to the Gemini API
        const geminiResponse = await fetch(geminiApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        // 6. Handle the response from Gemini
        if (!geminiResponse.ok) {
            const errorData = await geminiResponse.json();
            console.error("Gemini API Error:", errorData);
            const errorMessage = errorData.error?.message || `Gemini API request failed with status ${geminiResponse.status}`;
            return res.status(geminiResponse.status).json({ success: false, error: errorMessage });
        }

        const result = await geminiResponse.json();

        if (result.candidates && result.candidates.length > 0 &&
            result.candidates[0].content && result.candidates[0].content.parts &&
            result.candidates[0].content.parts.length > 0) {
            const text = result.candidates[0].content.parts[0].text;
            // 7. Send a success response back to the frontend
            return res.status(200).json({ success: true, text: text });
        } else {
            console.error("Unexpected Gemini API response structure:", result);
            return res.status(500).json({ success: false, error: "Couldn't get inspiration due to unexpected API response format." });
        }

    } catch (error) {
        console.error('Error in serverless function:', error);
        // 7. Send a general error response back to the frontend
        return res.status(500).json({ success: false, error: error.message || 'An internal server error occurred.' });
    }
}
