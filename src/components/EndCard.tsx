import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BRAND } from "../data/brand";

const { bg, blue, purple, white } = BRAND.colors;
const LAT = `${BRAND.fonts.latin}, sans-serif`;

// Carte de fin : identité + lien du webinar, assez longtemps pour être lu.
export const EndCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fade = interpolate(frame, [0, 8], [0, 1], { extrapolateRight: "clamp" });
  const s = (d: number) => spring({ frame: frame - d, fps, config: { damping: 16 } });
  const glow = 0.5 + 0.15 * Math.sin(frame / 8);

  return (
    <AbsoluteFill
      style={{
        opacity: fade,
        backgroundColor: bg,
        alignItems: "center",
        justifyContent: "center",
        fontFamily: LAT,
        color: white,
      }}
    >
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 50% 45%, ${purple}${Math.round(glow * 80)
            .toString(16)
            .padStart(2, "0")} 0%, transparent 55%)`,
        }}
      />
      <div style={{ textAlign: "center", marginTop: -120 }}>
        <div style={{ fontWeight: 800, fontSize: 104, letterSpacing: -2, opacity: s(2), transform: `translateY(${(1 - s(2)) * 40}px)` }}>
          {BRAND.name}
        </div>
        <div style={{ fontWeight: 500, fontSize: 44, opacity: 0.75 * s(6), marginTop: 6 }}>{BRAND.project}</div>
        <div
          style={{
            margin: "90px auto 0",
            width: 120,
            height: 4,
            borderRadius: 2,
            background: `linear-gradient(90deg, ${blue}, ${purple})`,
            transform: `scaleX(${s(10)})`,
          }}
        />
        <div style={{ fontWeight: 800, fontSize: 52, letterSpacing: 8, marginTop: 70, opacity: s(12) }}>WEBINAR</div>
        <div
          style={{
            marginTop: 34,
            fontWeight: 700,
            fontSize: 50,
            padding: "24px 44px",
            borderRadius: 999,
            background: `linear-gradient(135deg, ${blue}, ${purple})`,
            boxShadow: `0 16px 60px ${purple}66`,
            opacity: s(16),
            transform: `scale(${0.9 + 0.1 * s(16)})`,
          }}
        >
          {BRAND.webinarUrlDisplay}
        </div>
      </div>
    </AbsoluteFill>
  );
};
