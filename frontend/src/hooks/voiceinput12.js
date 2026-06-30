import { useState, useRef, useCallback } from "react";

const useVoiceInput = () => {
  const [isListening, setIsListening] = useState(false);
  const [voiceText, setVoiceText] = useState("");
  const [voiceError, setVoiceError] = useState(null);

  const recognitionRef = useRef(null);

  // Check if browser supports Web Speech API
  const isSupported =
    "webkitSpeechRecognition" in window || "SpeechRecognition" in window;

  const startListening = useCallback(() => {
    if (!isSupported) {
      setVoiceError("Your browser does not support voice input. Please use Chrome or Edge.");
      return;
    }

    // Clear previous results
    setVoiceError(null);
    setVoiceText("");

    // Create recognition instance
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    // Settings
    recognition.lang = "en-US";
    recognition.interimResults = false; // only final results
    recognition.maxAlternatives = 1;    // best match only

    // Started listening
    recognition.onstart = () => {
      setIsListening(true);
    };

    // Got a result
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setVoiceText(transcript);
      setIsListening(false);
    };

    // Something went wrong
    recognition.onerror = (event) => {
      setIsListening(false);

      switch (event.error) {
        case "no-speech":
          setVoiceError("No speech detected. Please try again.");
          break;
        case "audio-capture":
          setVoiceError("Microphone not found. Please check your microphone.");
          break;
        case "not-allowed":
          setVoiceError("Microphone access denied. Please allow microphone permission.");
          break;
        case "network":
          setVoiceError("Network error. Please check your connection.");
          break;
        default:
          setVoiceError("Voice input failed. Please try again.");
      }
    };

    // Finished (no error)
    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  }, [isSupported]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, []);

  const clearVoiceText = useCallback(() => {
    setVoiceText("");
    setVoiceError(null);
  }, []);

  return {
    isListening,      // true while recording
    voiceText,        // captured speech as text
    voiceError,       // error message or null
    isSupported,      // false on Firefox/Safari
    startListening,   // call to start recording
    stopListening,    // call to stop recording
    clearVoiceText,   // call to reset
  };
};

export default useVoiceInput;
