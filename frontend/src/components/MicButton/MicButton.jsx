import { Mic, MicOff } from "lucide-react";
import useVoiceInput from "../../hooks/useVoiceInput.js";
import styles from "./MicButton.module.css";

export default function MicButton({
  className = "",
  disabled = false,
  label = "Voice input",
  onTranscript,
}) {
  const {
    error,
    interimTranscript,
    isListening,
    isSupported,
    toggleListening,
  } = useVoiceInput({ onTranscript });

  const buttonLabel = isListening ? `Stop ${label}` : `Start ${label}`;
  const buttonClassName = [
    styles.button,
    isListening ? styles.listening : "",
    !isSupported ? styles.unsupported : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={styles.root}>
      <button
        type="button"
        className={buttonClassName}
        onClick={toggleListening}
        disabled={disabled || !isSupported}
        aria-label={buttonLabel}
        aria-pressed={isListening}
        title={isSupported ? buttonLabel : "Voice input is not supported"}
      >
        {isListening ? <MicOff size={16} /> : <Mic size={16} />}
        <span className={styles.srOnly}>{buttonLabel}</span>
      </button>

      <span className={styles.status} aria-live="polite">
        {!isSupported
          ? "Voice input not supported"
          : isListening
            ? interimTranscript || "Listening..."
            : error}
      </span>
    </span>
  );
}
