const express = require("express");
const router = express.Router();
const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

router.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.json({
        success: false,
        message: "Message is required."
      });
    }

    const response = await ai.models.generateContent({
     model: "gemini-flash-latest",
contents: `
You are MindLock AI.

You are a friendly AI study companion.

Rules:
- Maximum 3 short sentences.
- Keep replies under 40 words unless the user asks for details.
- Encourage focus and healthy digital habits.
- Never be overly verbose.
- Use one emoji at most.
- Sound like a helpful friend, not a textbook.
User:
${message}
`
    });

  res.json({
  success: true,
  reply: response.text || "I'm here to help! 😊",
});

  } catch (err) {
    console.error("Gemini Error:", err);

    res.json({
      success: false,
      message: "AI Error"
    });
  }
});

module.exports = router;