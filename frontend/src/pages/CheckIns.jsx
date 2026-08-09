import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { confirmCheckIn, createCheckIn, deleteCheckIn, listCheckIns } from "../api/checkins";

export default function CheckIns() {
  const { t } = useTranslation();
  const [checkins, setCheckins] = useState([]);
  const [scheduledTime, setScheduledTime] = useState("");
  const [note, setNote] = useState("");

  const refresh = () => listCheckIns().then(setCheckins);

  useEffect(() => {
    refresh();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!scheduledTime) return;
    await createCheckIn({ scheduled_time: new Date(scheduledTime).toISOString(), note: note || undefined });
    setScheduledTime("");
    setNote("");
    refresh();
  };

  const handleConfirm = async (id) => {
    await confirmCheckIn(id);
    refresh();
  };

  const handleDelete = async (id) => {
    await deleteCheckIn(id);
    refresh();
  };

  return (
    <div className="page">
      <h1>{t("checkins.title")}</h1>

      <form className="inline-form" onSubmit={handleAdd}>
        <input
          type="datetime-local"
          value={scheduledTime}
          onChange={(e) => setScheduledTime(e.target.value)}
          required
        />
        <input
          placeholder={t("checkins.note")}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <button type="submit" className="btn-primary">{t("checkins.schedule")}</button>
      </form>

      <ul className="card-list">
        {checkins.map((c) => (
          <li key={c.id} className="card-list-item">
            <div>
              <strong>{new Date(c.scheduled_time).toLocaleString()}</strong>
              <p>
                {c.note} <span className={`status-pill ${c.status}`}>{t(`checkins.status_${c.status}`)}</span>
              </p>
            </div>
            <div className="card-actions">
              {c.status === "pending" && (
                <button type="button" className="btn-secondary" onClick={() => handleConfirm(c.id)}>
                  {t("checkins.confirm")}
                </button>
              )}
              <button type="button" className="btn-danger" onClick={() => handleDelete(c.id)}>✕</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
