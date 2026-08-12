import { AVATAR_BACKGROUNDS, AVATAR_STYLES, buildAvatarUrl, randomSeed } from "../utils/avatar";

export default function AvatarPicker({ style, seed, background, onChange }) {
  const effectiveSeed = seed || "safestep";

  return (
    <div className="avatar-picker">
      <div className="avatar-picker-preview">
        <img
          className="avatar-picker-preview-img"
          src={buildAvatarUrl(style, effectiveSeed, background, 160)}
          alt="Avatar preview"
          width={112}
          height={112}
        />
        <button type="button" className="btn-secondary" onClick={() => onChange({ seed: randomSeed() })}>
          🎲 Shuffle
        </button>
      </div>

      <div className="avatar-picker-section">
        <span className="avatar-picker-label">Style</span>
        <div className="avatar-style-grid">
          {AVATAR_STYLES.map((s) => (
            <button
              type="button"
              key={s.id}
              className={"avatar-style-option" + (s.id === style ? " active" : "")}
              onClick={() => onChange({ style: s.id })}
              title={s.label}
            >
              <img src={buildAvatarUrl(s.id, effectiveSeed, background, 64)} alt={s.label} />
            </button>
          ))}
        </div>
      </div>

      <div className="avatar-picker-section">
        <span className="avatar-picker-label">Background</span>
        <div className="avatar-bg-swatches">
          {AVATAR_BACKGROUNDS.map((b) => (
            <button
              type="button"
              key={b.id || "none"}
              className={"avatar-bg-swatch" + (b.id === (background || "") ? " active" : "")}
              style={{ backgroundColor: b.swatch }}
              onClick={() => onChange({ background: b.id })}
              title={b.label}
              aria-label={b.label}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
