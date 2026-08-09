const PATHS = {
  home: (
    <>
      <path d="M10 30 L32 10 L54 30" />
      <path d="M16 24 V54 H48 V24" />
      <path d="M26 54 V38 H38 V54" />
    </>
  ),
  chat: (
    <>
      <path d="M10 14 H54 V42 H26 L14 52 V42 H10 Z" />
      <path d="M20 24 H44 M20 32 H36" />
    </>
  ),
  person: (
    <>
      <circle cx="32" cy="22" r="12" />
      <path d="M10 56 C10 42 19 34 32 34 C45 34 54 42 54 56" />
    </>
  ),
  shield: (
    <>
      <path d="M32 6 L58 15 V33 C58 50 45 60 32 66 C19 60 6 50 6 33 V15 Z" />
      <path d="M20 34 L28 42 L45 24" />
    </>
  ),
  route: (
    <>
      <path d="M10 54 C20 54 20 40 30 40 C40 40 40 26 50 26" strokeDasharray="1 10" />
      <circle cx="10" cy="54" r="4" fill="currentColor" stroke="none" />
      <path d="M50 26 L44 20 M50 26 L44 32" />
    </>
  ),
  checkin: (
    <>
      <circle cx="32" cy="32" r="26" />
      <circle cx="32" cy="32" r="15" />
      <circle cx="32" cy="32" r="4" fill="currentColor" stroke="none" />
      <path d="M32 20 V32 L40 38" />
    </>
  ),
  pin: (
    <>
      <path d="M32 60 C32 60 14 40 14 25 A18 18 0 0 1 50 25 C50 40 32 60 32 60 Z" />
      <circle cx="32" cy="25" r="7" />
    </>
  ),
  voice: (
    <>
      <rect x="26" y="10" width="12" height="26" rx="6" />
      <path d="M16 30 a16 16 0 0 0 32 0" />
      <path d="M32 46 V56 M24 56 H40" />
    </>
  ),
  heart: <path d="M32 54 C10 40 8 24 20 18 C27 14 32 20 32 20 C32 20 37 14 44 18 C56 24 54 40 32 54 Z" />,
  target: (
    <>
      <circle cx="32" cy="32" r="20" />
      <circle cx="32" cy="32" r="4" fill="currentColor" stroke="none" />
      <path d="M32 4 V14 M32 50 V60 M4 32 H14 M50 32 H60" />
    </>
  ),
};

export default function Icon({ name, size = 22, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {PATHS[name]}
    </svg>
  );
}
