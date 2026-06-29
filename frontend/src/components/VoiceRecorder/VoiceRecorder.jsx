import { useState, useRef, useCallback, useEffect } from "react";
import { Mic, MicOff, Play, Pause, Trash2, Upload } from "lucide-react";
import styles from "./VoiceRecorder.module.css";

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function VoiceRecorder({ onUpload, questionId, answerId }) {
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecording, setHasRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [duration, setDuration] = useState(0);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioBlobRef = useRef(null);
  const audioUrlRef = useRef(null);
  const audioElementRef = useRef(null);
  const timerRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        audioBlobRef.current = blob;
        audioUrlRef.current = URL.createObjectURL(blob);
        setHasRecording(true);
        stream.getTracks().forEach((t) => t.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setDuration(0);

      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } catch {
      alert("Microphone access is required for voice recording.");
    }
  }, []);

  const stopRecording = useCallback(() => {
    clearInterval(timerRef.current);
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  }, []);

  const togglePlayback = useCallback(() => {
    if (!audioUrlRef.current) return;

    if (!audioElementRef.current) {
      const audio = new Audio(audioUrlRef.current);
      audio.onended = () => setIsPlaying(false);
      audioElementRef.current = audio;
    }

    if (isPlaying) {
      audioElementRef.current.pause();
      setIsPlaying(false);
    } else {
      audioElementRef.current.play();
      setIsPlaying(true);
    }
  }, [isPlaying]);

  const deleteRecording = useCallback(() => {
    clearInterval(timerRef.current);
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current = null;
    }
    if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
    audioBlobRef.current = null;
    audioUrlRef.current = null;
    setHasRecording(false);
    setIsPlaying(false);
    setDuration(0);
  }, []);

  const handleUpload = useCallback(async () => {
    if (!audioBlobRef.current || !onUpload) return;
    setIsUploading(true);
    try {
      await onUpload({
        audioBlob: audioBlobRef.current,
        duration,
        questionId,
        answerId,
      });
      deleteRecording();
    } catch {
      alert("Failed to upload voice message.");
    } finally {
      setIsUploading(false);
    }
  }, [onUpload, duration, questionId, answerId, deleteRecording]);

  if (hasRecording) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.playbackControls}>
          <button
            type="button"
            className={styles.playBtn}
            onClick={togglePlayback}
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <Pause size={14} /> : <Play size={14} />}
          </button>

          <span className={styles.timer}>{formatTime(duration)}</span>

          <button
            type="button"
            className={styles.deleteBtn}
            onClick={deleteRecording}
            title="Delete recording"
          >
            <Trash2 size={14} />
          </button>
        </div>

        {onUpload && (
          <button
            type="button"
            className={styles.uploadBtn}
            onClick={handleUpload}
            disabled={isUploading}
          >
            <Upload size={13} />
            {isUploading ? "Uploading..." : "Send"}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <button
        type="button"
        className={`${styles.recordBtn} ${isRecording ? styles.recording : ""}`}
        onClick={isRecording ? stopRecording : startRecording}
        title={isRecording ? "Stop recording" : "Start recording"}
      >
        {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
        <span className={styles.srOnly}>
          {isRecording ? "Stop recording" : "Start recording"}
        </span>
      </button>

      {isRecording && <span className={styles.timer}>{formatTime(duration)}</span>}
    </div>
  );
}
