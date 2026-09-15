import { Phone, MoreHorizontal } from "lucide-react";

const TAG_STYLES = {
  Lead: "bg-[var(--color-gold-dim)] text-[var(--color-gold-ink)]",
  Customer: "bg-[var(--color-signal-dim)] text-[var(--color-signal-ink)]",
  VIP: "bg-[var(--color-accent-dim)] text-[var(--color-accent-ink)]",
};

export default function ContactCard({ contact, onCall }) {
  const initials = contact.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("");

  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-card)]">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--color-surface-sunk)] text-sm font-semibold text-[var(--color-ink-soft)]">
          {initials}
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-medium text-[var(--color-ink)]">{contact.name}</p>
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${TAG_STYLES[contact.tag] || "bg-[var(--color-surface-sunk)] text-[var(--color-ink-muted)]"}`}>
              {contact.tag}
            </span>
          </div>
          <p className="truncate font-[family-name:var(--font-mono)] text-xs text-[var(--color-ink-muted)]">
            {contact.phone}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={() => onCall?.(contact)}
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-accent)] text-white transition-colors hover:bg-[var(--color-accent-hover)]"
          aria-label={`Call ${contact.name}`}
        >
          <Phone size={15} />
        </button>
        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--color-border)] text-[var(--color-ink-muted)] hover:bg-[var(--color-surface-sunk)]"
          aria-label="More options"
        >
          <MoreHorizontal size={15} />
        </button>
      </div>
    </div>
  );
}
