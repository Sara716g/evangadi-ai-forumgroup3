import { GoogleGenerativeAI } from "@google/generative-ai";
import { safeExecute } from "../../../../db/config.js";

// Initialize the Gemini SDK
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// --- Helper: Generate Embedding for the Question ---
const generateQueryEmbedding = async (text) => {
  try {
    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_EMBEDDING_MODEL || "text-embedding-004",
    });
    const result = await model.embedContent({
      content: { parts: [{ text }] },
      taskType: "RETRIEVAL_QUERY", // Optimized for user queries
    });
    return result.embedding.values;
  } catch (error) {
    console.error("Query Embedding generation failed:", error);
    throw new Error("Failed to process question semantics.");
  }
};

// --- Helper: Calculate Vector Similarity ---
const calculateCosineSimilarity = (vecA, vecB) => {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

// --- Helper: Retrieve Relevant RAG Context (Securely restricted by userId) ---
const getRelevantContext = async (userId, question, limit = 3) => {
  if (!userId) return ""; // Failsafe: No user ID means no document access

  const queryEmbedding = await generateQueryEmbedding(question);

  // Secure JOIN: Only fetch chunks from documents owned by this user
  const query = `
    SELECT dcv.chunk_id, dcv.source_text, dcv.embedding 
    FROM document_chunk_vectors dcv
    JOIN document_chunks dc ON dcv.chunk_id = dc.chunk_id
    JOIN documents d ON dc.document_id = d.document_id
    WHERE d.user_id = ? AND dcv.status = 'ready'
  `;

  const chunks = await safeExecute(query, [userId]);

  if (!chunks || chunks.length === 0) return "";

  // Calculate similarity score for each chunk
  const scoredChunks = chunks.map((chunk) => {
    // Parse the JSON stringified embedding back into a JS array
    const dbVector =
      typeof chunk.embedding === "string"
        ? JSON.parse(chunk.embedding)
        : chunk.embedding;

    const score = calculateCosineSimilarity(queryEmbedding, dbVector);
    return { ...chunk, score };
  });

  // Sort by highest score first
  scoredChunks.sort((a, b) => b.score - a.score);
  const topChunks = scoredChunks.slice(0, limit);

  // Combine the text of the top chunks into a single reference string
  return topChunks
    .map(
      (chunk, index) =>
        `--- Document Extract ${index + 1} ---\n${chunk.source_text}`,
    )
    .join("\n\n");
};

// --- Main Exported Service ---
export const generateAssistantResponseService = async (
  userId,
  question,
  history,
) => {
  try {
    // 1. Fetch relevant RAG context specific to this user
    const contextText = await getRelevantContext(userId, question, 3);

    // 2. Format the frontend history array into Gemini's expected format
    // Gemini strictly requires roles to be either 'user' or 'model'
    const formattedHistory = history.map((msg) => ({
      role: msg.role === "ai" ? "model" : "user",
      parts: [{ text: msg.content }],
    }));

    // 3. Define the Persona and inject the retrieved user-specific context
    const systemInstructionText = `You are the Evangadi AI Forum Assistant, a highly skilled and polite programming expert. 
    Format your answers using Markdown for readability. Do not hallucinate code.
    
    Below is extracted context from the user's private knowledge base (PDF library). 
    If the context contains the answer to the user's question, prioritize using it and synthesize the information clearly. 
    If the context is irrelevant to the user's question, rely on your general programming knowledge but note that the internal library did not contain the specific answer.
    
    KNOWLEDGE BASE CONTEXT:
    ${contextText ? contextText : "No relevant documents found for this query."}`;

    // 4. Initialize the generative model WITH the system instruction included here
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash", 
      systemInstruction: systemInstructionText,
    });

    // 5. Start the chat with ONLY the message history
    const chat = model.startChat({
      history: formattedHistory,
    });

    // 6. Send the new question to the model
    const result = await chat.sendMessage(question);
    const responseText = result.response.text();

    // 7. Log the interaction to the database (Executes safely since the table exists)
    if (userId) {
      await safeExecute(
        "INSERT INTO ai_assistant_logs (user_id, prompt, response) VALUES (?, ?, ?)",
        [userId, question, responseText],
      );
    }

    return responseText;
  } catch (error) {
    console.error("AI Assistant Service Error:", error);
    throw new Error(
      "The AI Assistant is currently unavailable. Please try again later.",
    );
  }
};
