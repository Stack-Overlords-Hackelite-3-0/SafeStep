import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { getChatHistory, sendChatMessage, transcribeAudio } from "../api/chatbot";
import MicButton from "../components/MicButton";
import { useAuth } from "../context/AuthContext";
import { speakText, stopSpeaking } from "../utils/voice";

export default function Chatbot() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [language, setLanguage] = useState(user?.preferred_language || i18n.language || "en");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [voiceReplies, setVoiceReplies] = useState(true);
  const [transcribing, setTranscribing] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    getChatHistory().then(setMessages);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  useEffect(() => stopSpeaking, []); // stop any speech in progress when leaving the page

  const handleSend = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;

    setMessages((prev) => [
      ...prev,
      { id: `temp-${Date.now()}`, role: "user", content: text, language },
    ]);
    setInput("");
    setSending(true);
    setError(null);
    try {
      const { reply } = await sendChatMessage(text, language);
      setMessages((prev) => [...prev, reply]);
      if (voiceReplies) speakText(reply.content, reply.language);
    } catch {
      setError(t("chatbot.send_error", "Couldn't get a reply. Please try again."));
    } finally {
      setSending(false);
    }
  };

  const handleVoiceInput = async (blob) => {
    setTranscribing(true);
    setError(null);
    try {
      const { text } = await transcribeAudio(blob, language);
      if (text) setInput((prev) => (prev ? `${prev} ${text}` : text));
    } catch {
      setError(t("chatbot.transcribe_error", "Couldn't understand the recording. Please try again or type instead."));
    } finally {
      setTranscribing(false);
    }
  };

  return (
    <div className="page chat-page">
      <h1>{t("chatbot.title")}</h1>
      <p className="disclaimer">{t("chatbot.disclaimer")}</p>

      <div className="chat-toolbar">
        <select value={language} onChange={(e) => setLanguage(e.target.value)} className="chat-lang-select">
          <option value="en">English</option>
          <option value="si">සිංහල</option>
          <option value="ta">தமிழ்</option>
        </select>
        <label className="voice-toggle">
          <input
            type="checkbox"
            checked={voiceReplies}
            onChange={(e) => {
              setVoiceReplies(e.target.checked);
              if (!e.target.checked) stopSpeaking();
            }}
          />
          {t("chatbot.voice_replies", "🔊 Speak replies")}
        </label>
      </div>

      <div className="chat-window">
        {messages.map((m) => (
          <div key={m.id} className={`chat-bubble ${m.role}`}>
            {m.content}
          </div>
        ))}
        {sending && (
          <div className="chat-bubble assistant chat-typing" aria-live="polite">
            {t("chatbot.typing", "Thinking…")}
          </div>
        )}
        {error && <div className="chat-error">{error}</div>}
        {transcribing && (
          <div className="chat-bubble user chat-typing" aria-live="polite">
            {t("chatbot.transcribing", "Listening…")}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form className="chat-input-row" onSubmit={handleSend}>
        <MicButton onTranscribed={handleVoiceInput} disabled={sending || transcribing} />
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t("chatbot.placeholder")}
        />
        <button type="submit" className="btn-primary" disabled={sending}>
          {t("chatbot.send")}
        </button>
      </form>
    </div>
  );
}
