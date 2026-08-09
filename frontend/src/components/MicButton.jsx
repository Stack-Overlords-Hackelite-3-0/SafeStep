import { useRef, useState } from "react";
import { isSpeechRecognitionSupported } from "../utils/voice";

export default function MicButton({ onTranscribed, disabled }) {
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);

  if (!isSpeechRecognitionSupported()) return null;

  const startRecording = async () => {
    if (disabled || recording || busy) return;
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;
    chunksRef.current = [];
    const recorder = new MediaRecorder(stream);
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.onstop = async () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      setBusy(true);
      try {
        await onTranscribed(blob);
      } finally {
        setBusy(false);
      }
    };
    mediaRecorderRef.current = recorder;
    recorder.start();
    setRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  return (
    <button
      type="button"
      className={`mic-button ${recording ? "recording" : ""}`}
      onClick={recording ? stopRecording : startRecording}
      disabled={disabled || busy}
      title={recording ? "Stop recording" : "Record voice message"}
      aria-pressed={recording}
    >
      {busy ? "…" : recording ? "⏹️" : "🎤"}
    </button>
  );
}
