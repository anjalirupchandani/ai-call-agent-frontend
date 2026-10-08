export default function AuthField({ icon: Icon, label, rightAdornment, ...inputProps }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-xs font-medium text-[var(--color-ink-muted)]">{label}</span>
      <div className="auth-dark-input-group flex items-center gap-3 rounded-xl px-4 py-3">
        <Icon size={17} className="shrink-0 text-[var(--color-accent)]" />
        <input
          {...inputProps}
          className="w-full bg-transparent text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)] focus:outline-none"
        />
        {rightAdornment}
      </div>
    </label>
  );
}
