const DICEBEAR_BASE = "https://api.dicebear.com/9.x";

export const AVATAR_STYLES = [
  { id: "adventurer", label: "Adventurer" },
  { id: "avataaars", label: "Avataaars" },
  { id: "notionists", label: "Notionists" },
  { id: "lorelei", label: "Lorelei" },
  { id: "micah", label: "Micah" },
  { id: "big-smile", label: "Big Smile" },
  { id: "croodles", label: "Croodles" },
  { id: "bottts", label: "Bottts" },
  { id: "pixel-art", label: "Pixel Art" },
  { id: "thumbs", label: "Thumbs" },
];

export const AVATAR_BACKGROUNDS = [
  { id: "", label: "None", swatch: "transparent" },
  { id: "b85677", label: "Rose", swatch: "#b85677" },
  { id: "7a3b54", label: "Plum", swatch: "#7a3b54" },
  { id: "fdedf1", label: "Blush", swatch: "#fdedf1" },
  { id: "ffd166", label: "Sunshine", swatch: "#ffd166" },
  { id: "06d6a0", label: "Mint", swatch: "#06d6a0" },
  { id: "118ab2", label: "Sky", swatch: "#118ab2" },
];

const VALID_STYLE_IDS = new Set(AVATAR_STYLES.map((s) => s.id));

export function buildAvatarUrl(style, seed, background, size = 128) {
  // The style segment is embedded in raw HTML for map marker icons (see MapView),
  // so it's restricted to the curated whitelist rather than trusted as free text.
  const safeStyle = VALID_STYLE_IDS.has(style) ? style : "adventurer";
  const params = new URLSearchParams({ seed: seed || "safestep", size: String(size) });
  if (background) params.set("backgroundColor", background);
  return `${DICEBEAR_BASE}/${safeStyle}/svg?${params.toString()}`;
}

export function randomSeed() {
  return Math.random().toString(36).slice(2, 10);
}
