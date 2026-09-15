const SIZE_MAP = {
  sm: { bars: 4, height: 14, width: 3, gap: 2 },
  md: { bars: 5, height: 20, width: 3, gap: 3 },
  lg: { bars: 6, height: 36, width: 4, gap: 4 },
};

const DELAYS = [0, 0.15, 0.3, 0.1, 0.25, 0.05];

/**
 * The waveform is the AI Call Agent signature mark: it stands in for a
 * "logo", a live-call indicator, and a call-to-action flourish. `active`
 * controls whether the bars animate (idle vs. listening/speaking).
 */
export default function Waveform({ size = "md", active = true, color = "currentColor", className = "" }) {
  const { bars, height, width, gap } = SIZE_MAP[size];

  return (
    <span
      className={`inline-flex items-end ${className}`}
      style={{ height, gap }}
      aria-hidden="true"
    >
      {Array.from({ length: bars }).map((_, i) => (
        <span
          key={i}
          className={active ? "animate-wave-bar" : ""}
          style={{
            width,
            height: "100%",
            borderRadius: width,
            background: color,
            display: "inline-block",
            animationDelay: `${DELAYS[i % DELAYS.length]}s`,
            transform: active ? undefined : "scaleY(0.45)",
          }}
        />
      ))}
    </span>
  );
}
