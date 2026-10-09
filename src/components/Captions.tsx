import { AbsoluteFill, interpolate, Sequence, useCurrentFrame } from "remotion";
import { BRAND } from "../data/brand";
import { CAPTIONS, CAPTIONS_VERIFIED, Caption } from "../data/captions";
import { FPS, srcToOut } from "../data/edit";

// Sous-titres arabes (RTL), dans la zone sûre au-dessus de l'interface des
// plateformes (≈ 320 px réservés en bas).
export const Captions: React.FC = () => (
  <>
    {CAPTIONS.map((c, i) => {
      const a = srcToOut(c.start);
      const b = srcToOut(c.end);
      if (a === null || b === null) return null;
      // Garde le sous-titre jusqu'au suivant si l'écart est court (< 0.6 s).
      const next = CAPTIONS[i + 1] && srcToOut(CAPTIONS[i + 1].start);
      const hold = next !== null && next !== undefined && next - b < 0.6 ? next : b + 0.15;
      return (
        <Sequence
          key={i}
          from={Math.round(a * FPS)}
          durationInFrames={Math.max(1, Math.round((hold - a) * FPS))}
          layout="none"
        >
          <Line c={c} />
        </Sequence>
      );
    })}
    {!CAPTIONS_VERIFIED && <DraftBadge />}
  </>
);

const Line: React.FC<{ c: Caption }> = ({ c }) => {
  const frame = useCurrentFrame();
  const y = interpolate(frame, [0, 4], [14, 0], { extrapolateRight: "clamp" });
  const o = interpolate(frame, [0, 3], [0, 1], { extrapolateRight: "clamp" });
  const color = !CAPTIONS_VERIFIED && c.uncertain ? BRAND.colors.draft : BRAND.colors.white;
  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 380 }}>
      <div
        dir="rtl"
        lang="ar"
        style={{
          maxWidth: 900,
          textAlign: "center",
          fontFamily: `${BRAND.fonts.arabic}, sans-serif`,
          fontWeight: 800,
          fontSize: 62,
          lineHeight: 1.35,
          color,
          opacity: o,
          transform: `translateY(${y}px)`,
          textShadow: "0 3px 14px rgba(0,0,0,0.85), 0 0 3px rgba(0,0,0,0.9)",
          WebkitTextStroke: "1.5px rgba(0,0,0,0.55)",
          paintOrder: "stroke fill",
        }}
      >
        {c.text}
      </div>
    </AbsoluteFill>
  );
};

// Rappel visible tant que les sous-titres ne sont pas validés : à ne pas publier.
const DraftBadge: React.FC = () => (
  <div
    style={{
      position: "absolute",
      top: 60,
      right: 60,
      fontFamily: `${BRAND.fonts.latin}, sans-serif`,
      fontWeight: 800,
      fontSize: 26,
      letterSpacing: 2,
      color: "#111",
      background: BRAND.colors.draft,
      padding: "8px 18px",
      borderRadius: 10,
    }}
  >
    DRAFT · SOUS-TITRES À VALIDER
  </div>
);
