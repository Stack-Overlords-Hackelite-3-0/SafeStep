import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { getChatHistory, sendChatMessage } from "../api/chatbot";
import { useAuth } from "../context/AuthContext";

export default function Chatbot() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [language, setLanguage] = useState(user?.preferred_language || i18n.language || "en");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    getChatHistory().then(setMessages);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
    try {
      const { reply } = await sendChatMessage(text, language);
      setMessages((prev) => [...prev, reply]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="page chat-page">
      <h1>{t("chatbot.title")}</h1>
      <p className="disclaimer">{t("chatbot.disclaimer")}</p>

      <select value={language} onChange={(e) => setLanguage(e.target.value)} className="chat-lang-select">
        <option value="en">English</option>
        <option value="si">සිංහල</option>
        <option value="ta">தமிழ்</option>
      </select>

      <div className="chat-window">
        {messages.map((m) => (
          <div key={m.id} className={`chat-bubble ${m.role}`}>
            {m.content}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form className="chat-input-row" onSubmit={handleSend}>
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
