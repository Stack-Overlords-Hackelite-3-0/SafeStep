import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { createContact, deleteContact, listContacts } from "../api/contacts";

export default function Contacts() {
  const { t } = useTranslation();
  const [contacts, setContacts] = useState([]);
  const [form, setForm] = useState({ name: "", phone: "", relationship_label: "" });

  const refresh = () => listContacts().then(setContacts);

  useEffect(() => {
    refresh();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone) return;
    await createContact(form);
    setForm({ name: "", phone: "", relationship_label: "" });
    refresh();
  };

  const handleDelete = async (id) => {
    await deleteContact(id);
    refresh();
  };

  return (
    <div className="page">
      <h1>{t("contacts.title")}</h1>

      <form className="inline-form" onSubmit={handleAdd}>
        <input
          placeholder={t("contacts.name")}
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <input
          placeholder={t("contacts.phone")}
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          required
        />
        <input
          placeholder={t("contacts.relationship")}
          value={form.relationship_label}
          onChange={(e) => setForm({ ...form, relationship_label: e.target.value })}
        />
        <button type="submit" className="btn-primary">{t("contacts.add")}</button>
      </form>

      {contacts.length === 0 ? (
        <p className="empty-state">{t("contacts.empty")}</p>
      ) : (
        <ul className="card-list">
          {contacts.map((c) => (
            <li key={c.id} className="card-list-item">
              <div>
                <strong>{c.name}</strong>
                <p>{c.phone} {c.relationship_label && `• ${c.relationship_label}`}</p>
              </div>
              <button type="button" className="btn-danger" onClick={() => handleDelete(c.id)}>✕</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
