import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, UserPlus, X } from "lucide-react";
import DashboardShell from "../components/DashboardShell";
import ContactCard from "../components/ContactCard";
import { getContacts, createContact } from "../services/api";

function AddContactModal({ onClose, onCreate }) {
  const [form, setForm] = useState({ name: "", phone: "", email: "", tag: "Lead" });

  const submit = async (e) => {
    e.preventDefault();
    const created = await createContact(form);
    onCreate(created);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-(--shadow-card)">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-ink">
            Add Contact
          </h2>
          <button onClick={onClose} className="text-ink-muted hover:text-ink">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <input
            required
            placeholder="Full name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="rounded-xl border border-border bg-canvas px-3.5 py-2.5 text-sm focus:border-accent focus:outline-none"
          />
          <input
            required
            placeholder="Phone number"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            className="rounded-xl border border-border bg-canvas px-3.5 py-2.5 text-sm font-mono focus:border-accent focus:outline-none"
          />
          <input
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            className="rounded-xl border border-border bg-canvas px-3.5 py-2.5 text-sm focus:border-accent focus:outline-none"
          />
          <select
            value={form.tag}
            onChange={(e) => setForm((f) => ({ ...f, tag: e.target.value }))}
            className="rounded-xl border border-border bg-canvas px-3.5 py-2.5 text-sm focus:border-accent focus:outline-none"
          >
            <option>Lead</option>
            <option>Customer</option>
            <option>VIP</option>
          </select>
          <button
            type="submit"
            className="mt-1 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-hover"
          >
            Add Contact
          </button>
        </form>
      </div>
    </div>
  );
}

export default function Contacts() {
  const [contacts, setContacts] = useState([]);
  const [query, setQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    getContacts().then((data) => {
      setContacts(data);
      setLoading(false);
    });
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return contacts;
    return contacts.filter(
      (c) => c.name.toLowerCase().includes(q) || c.phone.includes(q)
    );
  }, [contacts, query]);

  return (
    <DashboardShell title="Contacts" subtitle={`${contacts.length} people in your address book`}>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3.5 py-2.5 sm:w-80">
          <Search size={16} className="text-ink-muted" />
          <input
            placeholder="Search contacts…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm text-ink placeholder:text-ink-muted focus:outline-none"
          />
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
        >
          <UserPlus size={16} />
          Add Contact
        </button>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center text-sm text-ink-muted">
          Loading contacts…
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((contact) => (
            <ContactCard
              key={contact._id}
              contact={contact}
              onCall={() => navigate("/dashboard/calls/new")}
            />
          ))}
          {filtered.length === 0 && (
            <p className="col-span-full py-10 text-center text-sm text-ink-muted">
              No contacts match "{query}".
            </p>
          )}
        </div>
      )}

      {showModal && (
        <AddContactModal
          onClose={() => setShowModal(false)}
          onCreate={(c) => setContacts((prev) => [c, ...prev])}
        />
      )}
    </DashboardShell>
  );
}
