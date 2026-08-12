const { GoogleGenAI } = require('@google/genai');
const env = require('../config/env');
const AppError = require('../utils/AppError');
const { SYSTEM_PROMPT } = require('./promptTemplates');

let client = null;
function getClient() {
  if (!env.GEMINI_API_KEY) {
    throw new AppError(
      'GEMINI_API_KEY is not configured on the server. Add it to server/.env to enable AI features.',
      503
    );
  }
  if (!client) {
    client = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  }
  return client;
}

/**
 * Sends a fully-built prompt to Gemini and returns the plain-text (markdown)
 * response. Retries once on transient failures before surfacing an error.
 */
async function generateContent(prompt, { temperature = 0.4, maxOutputTokens = 4096 } = {}) {
  const ai = getClient();

  const attempt = async () => {
    const response = await ai.models.generateContent({
      model: env.GEMINI_MODEL,
      contents: prompt,
      config: { systemInstruction: SYSTEM_PROMPT, temperature, maxOutputTokens },
    });
    return response.text;
  };

  try {
    return await attempt();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[Gemini] first attempt failed, retrying once:', err.message);
    try {
      return await attempt();
    } catch (err2) {
      throw new AppError(`AI request failed: ${err2.message}`, 502);
    }
  }
}

module.exports = { generateContent };
