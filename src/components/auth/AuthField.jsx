export default function AuthField({ icon: Icon, label, rightAdornment, ...inputProps }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-xs font-medium text-[#A7B0D6]">{label}</span>
      <div className="auth-dark-input-group flex items-center gap-3 rounded-xl px-4 py-3">
        <Icon size={17} className="shrink-0 text-[#8B5CF6]" />
        <input
          {...inputProps}
          className="w-full bg-transparent text-sm text-white placeholder:text-[#5C6699] focus:outline-none"
        />
        {rightAdornment}
      </div>
    </label>
  );
}