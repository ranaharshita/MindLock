const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

exports.chat = async (req, res) => {
    try {
        const { message } = req.body;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: message
        });

        res.json({
            success: true,
            reply: response.text
        });

    } catch (err) {
        console.error(err);

        res.json({
            success: false,
            message: "Gemini Error"
        });
    }
};