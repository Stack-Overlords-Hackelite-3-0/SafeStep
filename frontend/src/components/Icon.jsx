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
  phone: (
    <path d="M14 12 C14 10 16 8 18 8 L24 8 C26 8 27 9 28 11 L30 17 C31 19 30 21 28 22 L24 25 C27 33 31 37 39 40 L42 36 C43 34 45 33 47 34 L53 36 C55 37 56 38 56 40 L56 46 C56 48 54 50 52 50 C30 50 14 34 14 12 Z" />
  ),
  chevron: <path d="M38 12 L22 32 L38 52" />,
  globe: (
    <>
      <circle cx="32" cy="32" r="24" />
      <path d="M8 32 H56 M32 8 C42 18 42 46 32 56 C22 46 22 18 32 8 Z" />
    </>
  ),
  logout: (
    <>
      <path d="M28 8 H14 V56 H28" />
      <path d="M24 32 H54 M54 32 L44 22 M54 32 L44 42" />
    </>
  ),
  trash: (
    <>
      <path d="M12 18 H52" />
      <path d="M24 18 V12 C24 10 26 8 28 8 H36 C38 8 40 10 40 12 V18" />
      <path d="M18 18 L21 54 C21 56 23 58 25 58 H39 C41 58 43 56 43 54 L46 18" />
      <path d="M27 27 V48 M32 27 V48 M37 27 V48" />
    </>
  ),
  link: (
    <>
      <path d="M26 38 L38 26" />
      <path d="M30 18 L36 12 C41 7 49 7 54 12 C59 17 59 25 54 30 L48 36" />
      <path d="M34 46 L28 52 C23 57 15 57 10 52 C5 47 5 39 10 34 L16 28" />
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
