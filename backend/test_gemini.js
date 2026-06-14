// test_gemini.js
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
const textModel = process.env.GEMINI_TEXT_MODEL || 'gemini-2.0-flash-lite';

console.log('API Key length:', apiKey ? apiKey.length : 0);
console.log('Using model:', textModel);

if (!apiKey) {
  console.error('No GEMINI_API_KEY found in .env');
  process.exit(1);
}

const aiClient = new GoogleGenAI({ apiKey });

async function run() {
  try {
    const response = await aiClient.models.generateContent({
      model: textModel,
      contents: 'Hello, respond with a single word "Success" if you read this.',
    });
    console.log('API Response candidate:', JSON.stringify(response.candidates?.[0]?.content, null, 2));
  } catch (error) {
    console.error('Error occurred:');
    console.error(error);
  }
}

run();
