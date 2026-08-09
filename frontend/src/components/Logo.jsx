export default function Logo({ size = 32, variant = "brand", className = "" }) {
  const badgeFill = variant === "inverse" ? "#FFFFFF" : "var(--color-primary)";
  const glyphColor = variant === "inverse" ? "var(--color-primary)" : "#FFFFFF";
  const foldFill = variant === "inverse" ? "rgba(184,86,119,0.14)" : "rgba(255,255,255,0.9)";
  const foldStroke = variant === "inverse" ? "var(--color-primary)" : "var(--color-primary-dark)";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <rect x="4" y="4" width="92" height="92" rx="22" fill={badgeFill} />
      <path d="M4 26 V16 C4 9.4 9.4 4 16 4 H26 L4 26 Z" fill={foldFill} />
      <path d="M6 24 L24 6" stroke={foldStroke} strokeWidth="1.4" opacity="0.5" />
      <path
        d="M50 24 L74 32 V52 C74 65 63 72 50 78 C37 72 26 65 26 52 V32 Z"
        fill="none"
        stroke={glyphColor}
        strokeWidth="4.5"
        strokeLinejoin="round"
      />
      <path
        d="M40 52c0-5 2.6-7.5 5-7.5s5 2.5 5 7.5"
        fill="none"
        stroke={glyphColor}
        strokeWidth="4.2"
        strokeLinecap="round"
      />
      <circle cx="45" cy="40" r="4.6" fill={glyphColor} />
    </svg>
  );
}
