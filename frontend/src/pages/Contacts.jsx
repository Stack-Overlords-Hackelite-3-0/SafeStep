import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  acceptInvitation,
  createContact,
  declineInvitation,
  deleteContact,
  listContacts,
  listInvitations,
} from "../api/contacts";

const STATUS_LABEL_KEY = {
  pending: "contacts.status_pending",
  accepted: "contacts.status_accepted",
  declined: "contacts.status_declined",
};

export default function Contacts() {
  const { t } = useTranslation();
  const [contacts, setContacts] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [form, setForm] = useState({ name: "", phone: "", email: "", relationship_label: "" });

  const refresh = () => listContacts().then(setContacts);
  const refreshInvitations = () => listInvitations().then(setInvitations);

  useEffect(() => {
    refresh();
    refreshInvitations();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.email) return;
    await createContact(form);
    setForm({ name: "", phone: "", email: "", relationship_label: "" });
    refresh();
  };

  const handleDelete = async (id) => {
    await deleteContact(id);
    refresh();
  };

  const handleAccept = async (id) => {
    await acceptInvitation(id);
    refreshInvitations();
    refresh();
  };

  const handleDecline = async (id) => {
    await declineInvitation(id);
    refreshInvitations();
  };

  return (
    <div className="page page-fit">
      <h1>{t("contacts.title")}</h1>

      {invitations.length > 0 && (
        <div className="invitations-panel">
          <h2>{t("contacts.invitations_title")} ({invitations.length})</h2>
          <ul className="card-list">
            {invitations.map((inv) => (
              <li key={inv.id} className="card-list-item">
                <div>
                  <strong>{inv.inviter_name}</strong>
                  <p>{t("contacts.invite_from", { name: inv.inviter_name })}</p>
                </div>
                <div className="card-actions">
                  <button type="button" className="btn-secondary" onClick={() => handleAccept(inv.id)}>
                    {t("contacts.accept")}
                  </button>
                  <button type="button" className="btn-danger" onClick={() => handleDecline(inv.id)}>
                    {t("contacts.decline")}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="split-page">
        <div className="split-panel">
          <h2>{t("contacts.add")}</h2>
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
              type="email"
              placeholder={t("contacts.email")}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
            <input
              placeholder={t("contacts.relationship")}
              value={form.relationship_label}
              onChange={(e) => setForm({ ...form, relationship_label: e.target.value })}
            />
            <p className="hint">{t("contacts.email_hint")}</p>
            <button type="submit" className="btn-primary full-width">{t("contacts.add")}</button>
          </form>
        </div>

        <div className="split-content">
          <h2>{t("nav.contacts")} ({contacts.length})</h2>
          {contacts.length === 0 ? (
            <p className="empty-state">{t("contacts.empty")}</p>
          ) : (
            <ul className="card-list">
              {contacts.map((c) => (
                <li key={c.id} className="card-list-item">
                  <div>
                    <strong>{c.name}</strong>
                    <p>
                      {c.phone} {c.relationship_label && `• ${c.relationship_label}`}
                      {c.linked_user_id && (
                        <span className={`status-pill ${c.status}`}>{t(STATUS_LABEL_KEY[c.status])}</span>
                      )}
                    </p>
                  </div>
                  <button type="button" className="btn-danger" onClick={() => handleDelete(c.id)}>✕</button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
