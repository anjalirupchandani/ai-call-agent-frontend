import { Mic, MicOff, Volume2, Grid3x3, Pause, Play, PhoneOff } from "lucide-react";

function ControlButton({ active, onClick, icon: Icon, label, danger, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex flex-col items-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <span
        className={`flex h-14 w-14 items-center justify-center rounded-full transition-colors ${
          danger
            ? "bg-[var(--color-warn)] text-white hover:bg-[#d94a3d]"
            : active
            ? "bg-[var(--color-ink)] text-white"
            : "bg-[var(--color-surface-sunk)] text-[var(--color-ink-soft)] hover:bg-[var(--color-border-soft)]"
        }`}
      >
        <Icon size={20} />
      </span>
      <span className="text-xs font-medium text-[var(--color-ink-muted)]">{label}</span>
    </button>
  );
}

export default function CallControls({ muted, onToggleMute, paused, onTogglePause, onEndCall, onKeypad, onSpeaker, speakerOn, ending }) {
  return (
    <div className="flex items-center justify-center gap-5">
      <ControlButton
        active={muted}
        onClick={onToggleMute}
        icon={muted ? MicOff : Mic}
        label={muted ? "Unmute" : "Mute"}
      />
      <ControlButton active={speakerOn} onClick={onSpeaker} icon={Volume2} label="Speaker" />
      <ControlButton onClick={onKeypad} icon={Grid3x3} label="Keypad" />
      <ControlButton
        active={paused}
        onClick={onTogglePause}
        icon={paused ? Play : Pause}
        label={paused ? "Resume" : "Pause"}
      />
      <ControlButton onClick={onEndCall} icon={PhoneOff} label={ending ? "Ending…" : "End Call"} danger disabled={ending} />
    </div>
  );
}
