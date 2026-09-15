export default function AuthRobot({ className = "" }) {
  return (
    <svg
      viewBox="0 0 360 300"
      className={className}
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="robotBody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1B2159" />
          <stop offset="100%" stopColor="#131A47" />
        </linearGradient>
        <linearGradient id="robotFace" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>
        <radialGradient id="robotGlow" cx="50%" cy="45%" r="60%">
          <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* ambient glow behind the robot */}
      <ellipse cx="170" cy="150" rx="150" ry="130" fill="url(#robotGlow)" />

      {/* call waves, left */}
      <g className="auth-robot-wave" stroke="#8B5CF6" strokeOpacity="0.55" strokeWidth="2.5" fill="none">
        <path d="M18 150 Q 4 150 4 130" strokeLinecap="round" />
        <path d="M34 150 Q 10 150 10 110" strokeLinecap="round" />
      </g>
      {/* call waves, right */}
      <g className="auth-robot-wave" stroke="#3B82F6" strokeOpacity="0.55" strokeWidth="2.5" fill="none" style={{ animationDelay: "0.4s" }}>
        <path d="M342 150 Q 356 150 356 130" strokeLinecap="round" />
        <path d="M326 150 Q 350 150 350 110" strokeLinecap="round" />
      </g>

      {/* headset band */}
      <path d="M110 108 Q 180 46 250 108" stroke="#5B6BC7" strokeWidth="7" fill="none" strokeLinecap="round" />
      <rect x="98" y="102" width="18" height="34" rx="9" fill="#5B6BC7" />
      <rect x="244" y="102" width="18" height="34" rx="9" fill="#5B6BC7" />
      {/* mic boom */}
      <path d="M108 128 Q 92 150 118 162" stroke="#5B6BC7" strokeWidth="5" fill="none" strokeLinecap="round" />
      <circle cx="119" cy="163" r="6" fill="#8B5CF6" className="auth-robot-mic" />

      {/* head */}
      <rect x="95" y="118" width="170" height="130" rx="38" fill="url(#robotBody)" stroke="rgba(139,92,246,0.35)" strokeWidth="1.5" />
      {/* face plate */}
      <rect x="118" y="150" width="124" height="70" rx="24" fill="#0B1035" stroke="rgba(139,92,246,0.4)" strokeWidth="1.5" />
      {/* eyes */}
      <g className="auth-robot-blink">
        <rect x="142" y="176" width="26" height="10" rx="5" fill="url(#robotFace)" />
        <rect x="192" y="176" width="26" height="10" rx="5" fill="url(#robotFace)" />
      </g>
      {/* antenna light */}
      <line x1="180" y1="118" x2="180" y2="96" stroke="#5B6BC7" strokeWidth="4" strokeLinecap="round" />
      <circle cx="180" cy="90" r="7" fill="#8B5CF6" className="auth-robot-pulse" />

      {/* speech bubble */}
      <g className="auth-robot-bubble">
        <rect x="238" y="60" width="78" height="40" rx="14" fill="#151B4D" stroke="rgba(139,92,246,0.45)" strokeWidth="1.5" />
        <path d="M252 100 L246 114 L266 100 Z" fill="#151B4D" stroke="rgba(139,92,246,0.45)" strokeWidth="1.5" />
        <text x="277" y="85" textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="15" fontWeight="600" fill="#FFFFFF">
          Hello!
        </text>
      </g>
    </svg>
  );
}