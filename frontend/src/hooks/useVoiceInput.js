import { useCallback, useEffect, useRef, useState } from "react";

const getSpeechRecognition = () => {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
};

export function useVoiceInput({ lang = "en-US", onTranscript } = {}) {
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [error, setError] = useState("");
  const recognitionRef = useRef(null);
  const onTranscriptRef = useRef(onTranscript);
  const restartTimerRef = useRef(null);
  const shouldKeepListeningRef = useRef(false);

  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  const isSupported = Boolean(getSpeechRecognition());

  const stopListening = useCallback(() => {
    shouldKeepListeningRef.current = false;
    window.clearTimeout(restartTimerRef.current);

    try {
      recognitionRef.current?.stop();
    } catch {
      recognitionRef.current?.abort();
    }

    setIsListening(false);
    setInterimTranscript("");
  }, []);

  const startListening = useCallback(() => {
    const SpeechRecognition = getSpeechRecognition();

    if (!SpeechRecognition) {
      setError("Voice input is not supported in this browser.");
      return;
    }

    shouldKeepListeningRef.current = true;
    window.clearTimeout(restartTimerRef.current);
    recognitionRef.current?.abort();
    setError("");
    setInterimTranscript("");

    const recognition = new SpeechRecognition();
    recognition.lang = lang;
    recognition.interimResults = true;
    recognition.continuous = true;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      let finalText = "";
      let interimText = "";

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const text = result[0]?.transcript || "";

        if (result.isFinal) {
          finalText += text;
        } else {
          interimText += text;
        }
      }

      setInterimTranscript(interimText.trim());

      const cleaned = finalText.trim();
      if (cleaned) {
        onTranscriptRef.current?.(cleaned);
      }
    };

    recognition.onerror = (event) => {
      if (event.error === "no-speech") {
        return;
      }

      const blockingErrors = new Set([
        "audio-capture",
        "language-not-supported",
        "not-allowed",
        "service-not-allowed",
      ]);

      if (blockingErrors.has(event.error)) {
        shouldKeepListeningRef.current = false;
      }

      const friendlyMessage = blockingErrors.has(event.error)
        ? "Microphone access was blocked or unavailable."
        : "Voice input paused. Tap the mic again if it does not resume.";

      setError(friendlyMessage);
      setIsListening(shouldKeepListeningRef.current);
      setInterimTranscript("");
    };

    recognition.onend = () => {
      setInterimTranscript("");

      if (!shouldKeepListeningRef.current) {
        setIsListening(false);
        return;
      }

      setIsListening(true);
      restartTimerRef.current = window.setTimeout(() => {
        try {
          recognition.start();
        } catch {
          setIsListening(false);
          shouldKeepListeningRef.current = false;
          setError("Voice input stopped. Tap the mic to start again.");
        }
      }, 250);
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [lang]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
      return;
    }

    startListening();
  }, [isListening, startListening, stopListening]);

  useEffect(() => {
    return () => {
      shouldKeepListeningRef.current = false;
      window.clearTimeout(restartTimerRef.current);
      recognitionRef.current?.abort();
    };
  }, []);

  return {
    error,
    interimTranscript,
    isListening,
    isSupported,
    startListening,
    stopListening,
    toggleListening,
  };
}

export default useVoiceInput;
