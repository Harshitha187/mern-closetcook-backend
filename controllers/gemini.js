import dotenv from "dotenv";
dotenv.config({ path: "../../.env" });

import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// Store chat sessions in memory (keyed by sessionId, e.g., userId)
const chatSessions = {};

export const analyzeOutfit = async (req, res) => {
 const userId = req.userId;
  const { prompt, imageBase64} = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required" });
  }
  if (!userId) {
    return res.status(400).json({ error: "userId is required to track conversation" });
  }

  try {
    // Initialize session history if not exists
    if (!chatSessions[userId]) {
      chatSessions[userId] = [];
    }

    // Build user turn
    const userParts = [{ text: prompt }];
    if (imageBase64) {
      userParts.push({
        inlineData: {
          mimeType: "image/jpeg" || "image/jpg", // adapt if JPEG
          data: imageBase64.replace(/^data:image\/(png|jpeg|jpg);base64,/, ""),
        },
      });
    }

    // Push user message
    chatSessions[userId].push({
      role: "user",
      parts: userParts,
    });

    // Generate with history
    const result = await model.generateContent({
      contents: chatSessions[userId],
    });

    const text = result.response?.candidates?.[0]?.content?.parts?.[0]?.text || "No response";

    // Push AI response into history
    chatSessions[userId].push({
      role: "model",
      parts: [{ text }],
    });

    // End conversation if user says bye
    if (/bye|goodbye|see you/i.test(prompt)) {
      delete chatSessions[userId];
    }

    return res.json({ text });
  } catch (error) {
    console.error("Error generating content:", error);
    return res.status(500).json({ error: "Failed to analyze outfit" });
  }
};
