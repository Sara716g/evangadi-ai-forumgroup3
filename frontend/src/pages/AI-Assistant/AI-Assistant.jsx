import React, { useState, useRef, useEffect } from "react";
import styles from "./ai-assistant.module.css";
import { aiAssistantService } from "../../services/ai-assistant.service";
import Markdown from "markdown-to-jsx";
import Prism from "prismjs";

// Ensure you have imported a theme in main.jsx: import 'prismjs/themes/prism-tomorrow.css';
// You must also include the languages you want to support, e.g.:
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-css";
import "prismjs/components/prism-json";

const AIAssistant = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  // 1. Scroll into view effect
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 2. Prism highlighting effect: runs every time messages update
  useEffect(() => {
    Prism.highlightAll();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);

    const currentInput = input;
    setInput("");
    setLoading(true);

    try {
      const result = await aiAssistantService.getAnswer(currentInput, messages);

      if (result && result.success && result.data?.answer) {
        const aiMessage = { role: "ai", content: result.data.answer };
        setMessages((prev) => [...prev, aiMessage]);
      } else {
        throw new Error("Expected 'data.answer' layout missing.");
      }
    } catch (err) {
      console.error("CRITICAL FRONTEND AI ASSISTANT ERROR:", err);
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          content: "Sorry, I'm having trouble connecting to the assistant.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={styles.chatContainer}
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        width: "100%",
      }}
    >
      {/* 1. THE ANSWERING BOARD (The Spring) */}
      <div
        className={styles.chatBox}
        style={{ flexGrow: 1, overflowY: "auto", padding: "20px" }}
      >
        {messages.map((msg, index) => (
          <div key={index} className={`${styles.message} ${styles[msg.role]}`}>
            {/* Markdown component configured to render code blocks correctly */}
            <Markdown
              options={{
                overrides: {
                  code: {
                    props: {
                      className: "lang-javascript", // Prism expects "lang-" or "language-" prefix
                    },
                  },
                },
              }}
            >
              {msg.content}
            </Markdown>
          </div>
        ))}
        {loading && (
          <div className={styles.loading}>Assistant is thinking...</div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* 2. THE QUERY FIELD (The Green Box) */}
      {/* Because the div above pushes down, this will ALWAYS sit at the bottom edge */}
      <div
        className={styles.inputArea}
        style={{
          padding: "16px",
          borderTop: "1px solid #e2e8f0",
          background: "#fdfdfd",
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask me from knowledge base and beyond..."
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <button onClick={handleSend} disabled={loading}>
          Send
        </button>
      </div>
    </div>
  );
};

export default AIAssistant;
