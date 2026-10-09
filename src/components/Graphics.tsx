import {
  AbsoluteFill,
  interpolate,
  Sequence,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { BRAND } from "../data/brand";
import { FPS, srcToOut } from "../data/edit";
import { Graphic, GRAPHICS } from "../data/graphics";

const { blue, purple, white } = BRAND.colors;
const AR = `${BRAND.fonts.arabic}, sans-serif`;
const LAT = `${BRAND.fonts.latin}, sans-serif`;

// Zone graphique : sur le buste, au-dessus des sous-titres, hors du visage.
const ZONE_TOP = 1060;

export const Graphics: React.FC = () => (
  <>
    {GRAPHICS.map((g, i) => {
      const a = srcToOut(g.start);
      const b = srcToOut(g.end);
      if (a === null || b === null) return null;
      const dur = Math.round((b - a) * FPS);
      return (
        <Sequence key={i} from={Math.round(a * FPS)} durationInFrames={dur} layout="none">
          <Item g={g} dur={dur} />
        </Sequence>
      );
    })}
  </>
);

const useInOut = (dur: number) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const inS = spring({ frame, fps, config: { damping: 15, stiffness: 180 } });
  const out = interpolate(frame, [dur - 7, dur], [1, 0], { extrapolateLeft: "clamp" });
  return { frame, inS, out };
};

const Item: React.FC<{ g: Graphic; dur: number }> = ({ g, dur }) => {
  const { frame, inS, out } = useInOut(dur);

  switch (g.kind) {
    case "stat":
      return (
        <AbsoluteFill style={{ alignItems: "center", top: ZONE_TOP - 40, opacity: out }}>
          <div
            style={{
              fontFamily: LAT,
              fontWeight: 800,
              fontSize: 230,
              lineHeight: 1,
              letterSpacing: -6,
              color: white,
              transform: `scale(${0.6 + 0.4 * inS})`,
              textShadow: `0 0 50px ${purple}aa, 0 8px 30px rgba(0,0,0,0.6)`,
            }}
          >
            {g.value}
          </div>
        </AbsoluteFill>
      );
    case "nameTag":
      return (
        <div
          style={{
            position: "absolute",
            top: 210,
            left: 60,
            opacity: out,
            transform: `translateX(${(1 - inS) * -40}px)`,
            display: "flex",
            alignItems: "center",
            gap: 18,
            padding: "14px 26px 14px 18px",
            borderRadius: 999,
            background: "rgba(7,7,13,0.55)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255,255,255,0.18)",
          }}
        >
          <div
            style={{
              width: 14,
              height: 14,
              borderRadius: 7,
              background: `linear-gradient(135deg, ${blue}, ${purple})`,
              boxShadow: `0 0 16px ${purple}`,
            }}
          />
          <div style={{ fontFamily: LAT, color: white }}>
            <div style={{ fontWeight: 700, fontSize: 34 }}>{BRAND.name}</div>
            <div style={{ fontWeight: 500, fontSize: 24, opacity: 0.75 }}>{BRAND.project}</div>
          </div>
        </div>
      );
    case "keyword":
      return (
        <AbsoluteFill style={{ alignItems: "center", top: ZONE_TOP, opacity: out }}>
          <div
            dir="rtl"
            style={{
              fontFamily: AR,
              fontWeight: 800,
              fontSize: 78,
              color: white,
              padding: "14px 44px 22px",
              borderRadius: 28,
              background: `linear-gradient(135deg, ${blue}e6, ${purple}e6)`,
              boxShadow: `0 12px 50px ${purple}66`,
              transform: `translateY(${(1 - inS) * 60}px) scale(${0.9 + 0.1 * inS})`,
              opacity: inS,
            }}
          >
            {g.text}
          </div>
        </AbsoluteFill>
      );
    case "webinar":
      return (
        <AbsoluteFill style={{ alignItems: "center", top: ZONE_TOP - 20, opacity: out }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 26,
              padding: "24px 38px",
              borderRadius: 30,
              background: "rgba(7,7,13,0.72)",
              backdropFilter: "blur(12px)",
              border: `2px solid ${purple}88`,
              boxShadow: `0 0 60px ${purple}44`,
              transform: `translateY(${(1 - inS) * 70}px)`,
              opacity: inS,
            }}
          >
            <PlayIcon />
            <div>
              <div style={{ fontFamily: LAT, fontWeight: 800, fontSize: 64, color: white, letterSpacing: 4 }}>
                WEBINAR
              </div>
              <div
                dir="rtl"
                style={{
                  fontFamily: AR,
                  fontWeight: 600,
                  fontSize: 46,
                  color: white,
                  opacity: interpolate(frame, [10, 18], [0, 0.9], { extrapolateRight: "clamp" }),
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <ClockIcon />
                {g.duration}
              </div>
            </div>
          </div>
        </AbsoluteFill>
      );
    case "comment":
      return (
        <AbsoluteFill style={{ alignItems: "center", top: ZONE_TOP - 10, opacity: out }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 22,
              padding: "20px 40px 26px 26px",
              borderRadius: "36px 36px 36px 8px",
              background: white,
              boxShadow: "0 14px 50px rgba(0,0,0,0.35)",
              transform: `scale(${inS})`,
              transformOrigin: "0% 100%",
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                background: `linear-gradient(135deg, ${blue}, ${purple})`,
              }}
            />
            <div dir="rtl" style={{ fontFamily: AR, fontWeight: 800, fontSize: 76, color: "#111" }}>
              {g.word}
            </div>
          </div>
        </AbsoluteFill>
      );
    case "link":
      return (
        <AbsoluteFill style={{ alignItems: "center", top: ZONE_TOP + 10, opacity: out }}>
          <div
            style={{
              fontFamily: LAT,
              fontWeight: 700,
              fontSize: 44,
              color: white,
              padding: "18px 34px",
              borderRadius: 999,
              background: `linear-gradient(135deg, ${blue}, ${purple})`,
              boxShadow: `0 10px 40px ${purple}77`,
              transform: `translateY(${(1 - inS) * 50}px)`,
              opacity: inS,
            }}
          >
            {BRAND.webinarUrlDisplay}
          </div>
          <div
            style={{
              marginTop: 16,
              fontSize: 64,
              color: white,
              transform: `translateY(${Math.sin(frame / 4) * 8}px)`,
            }}
          >
            ↓
          </div>
        </AbsoluteFill>
      );
  }
};

const PlayIcon = () => (
  <svg width={92} height={92} viewBox="0 0 92 92">
    <defs>
      <linearGradient id="pi" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0" stopColor={blue} />
        <stop offset="1" stopColor={purple} />
      </linearGradient>
    </defs>
    <rect width={92} height={92} rx={24} fill="url(#pi)" />
    <path d="M 36 26 L 66 46 L 36 66 Z" fill="white" />
  </svg>
);

const ClockIcon = () => (
  <svg width={40} height={40} viewBox="0 0 40 40">
    <circle cx={20} cy={20} r={16} fill="none" stroke="white" strokeWidth={4} />
    <path d="M 20 10 L 20 20 L 27 24" fill="none" stroke="white" strokeWidth={4} strokeLinecap="round" />
  </svg>
);
