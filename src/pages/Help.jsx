import { useState } from "react";
import { BookOpen, LifeBuoy, Mail, X } from "lucide-react";
import DashboardShell from "../components/DashboardShell";

const SUPPORT_EMAIL = "support@aicallagent.app";

export default function Help() {
  const [isContactFormOpen, setIsContactFormOpen] = useState(false);
  const [isDocumentationOpen, setIsDocumentationOpen] = useState(false);

  return (
    <DashboardShell title="Help & Support" subtitle="We're here if you get stuck.">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center shadow-[var(--shadow-card)]">
          <LifeBuoy size={22} className="mx-auto mb-3 text-[var(--color-accent)]" />
          <h3 className="text-sm font-semibold text-[var(--color-ink)]">Contact Support</h3>
          <p className="mt-1 text-sm text-[var(--color-ink-muted)]">Get a response within a few hours.</p>
          <button
            type="button"
            onClick={() => setIsContactFormOpen(true)}
            className="mt-4 rounded-lg bg-[var(--color-accent)] px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-accent-hover)]"
          >
            Start a request
          </button>
        </div>
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center shadow-[var(--shadow-card)]">
          <BookOpen size={22} className="mx-auto mb-3 text-[var(--color-accent)]" />
          <h3 className="text-sm font-semibold text-[var(--color-ink)]">Documentation</h3>
          <p className="mt-1 text-sm text-[var(--color-ink-muted)]">Guides for setting up your agents.</p>
          <button
            type="button"
            onClick={() => setIsDocumentationOpen((isOpen) => !isOpen)}
            aria-expanded={isDocumentationOpen}
            aria-controls="support-guides"
            className="mt-4 rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm font-semibold text-[var(--color-ink-soft)] transition-colors hover:bg-[var(--color-surface-sunk)]"
          >
            {isDocumentationOpen ? "Hide guides" : "View guides"}
          </button>
        </div>
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center shadow-[var(--shadow-card)]">
          <Mail size={22} className="mx-auto mb-3 text-[var(--color-accent)]" />
          <h3 className="text-sm font-semibold text-[var(--color-ink)]">Email Us</h3>
          <p className="mt-1 text-sm text-[var(--color-ink-muted)]">{SUPPORT_EMAIL}</p>
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="mt-4 inline-flex rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm font-semibold text-[var(--color-ink-soft)] transition-colors hover:bg-[var(--color-surface-sunk)]"
          >
            Send an email
          </a>
        </div>
      </div>

      {isDocumentationOpen && (
        <section id="support-guides" className="mt-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-card)]">
          <h2 className="text-base font-semibold text-[var(--color-ink)]">Getting started guides</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {[
              ["Create an agent", "Choose a voice, set its behavior, and save your agent."],
              ["Build a pathway", "Define the questions and routing for each conversation."],
              ["Review call results", "Use call logs to review transcripts and outcomes."],
            ].map(([title, description]) => (
              <div key={title} className="rounded-xl bg-[var(--color-surface-sunk)] p-4">
                <h3 className="text-sm font-semibold text-[var(--color-ink)]">{title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-[var(--color-ink-muted)]">{description}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {isContactFormOpen && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 p-4" role="presentation">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="support-request-title"
            className="w-full max-w-lg rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-card)]"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="support-request-title" className="text-lg font-semibold text-[var(--color-ink)]">Contact support</h2>
                <p className="mt-1 text-sm text-[var(--color-ink-muted)]">Tell us what you need help with and we’ll prepare an email for you.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsContactFormOpen(false)}
                className="rounded-lg p-1 text-[var(--color-ink-muted)] transition-colors hover:bg-[var(--color-surface-sunk)]"
                aria-label="Close support request"
              >
                <X size={20} />
              </button>
            </div>
            <form
              className="mt-5 space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                const formData = new FormData(event.currentTarget);
                const subject = String(formData.get("subject") || "");
                const message = String(formData.get("message") || "");
                window.location.href = `mailto:${SUPPORT_EMAIL}?${new URLSearchParams({ subject, body: message })}`;
                setIsContactFormOpen(false);
              }}
            >
              <label className="block text-sm font-medium text-[var(--color-ink)]">
                Subject
                <input
                  name="subject"
                  required
                  className="mt-1.5 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)] px-3 py-2 text-sm outline-none transition-colors focus:border-[var(--color-accent)]"
                  placeholder="How can we help?"
                />
              </label>
              <label className="block text-sm font-medium text-[var(--color-ink)]">
                Message
                <textarea
                  name="message"
                  required
                  rows={5}
                  className="mt-1.5 w-full resize-y rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)] px-3 py-2 text-sm outline-none transition-colors focus:border-[var(--color-accent)]"
                  placeholder="Include any details that will help us assist you."
                />
              </label>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsContactFormOpen(false)}
                  className="rounded-lg px-3 py-2 text-sm font-semibold text-[var(--color-ink-soft)] transition-colors hover:bg-[var(--color-surface-sunk)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[var(--color-accent)] px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-accent-hover)]"
                >
                  Continue to email
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </DashboardShell>
  );
}
