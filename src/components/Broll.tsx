import {
  AbsoluteFill,
  interpolate,
  OffthreadVideo,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { BRAND } from "../data/brand";
import { BROLL_SOURCES, BrollId } from "../data/edit";

const { blue, purple, bg } = BRAND.colors;

// Plan de coupe : clip IA s'il est fourni, sinon motion design généré.
// Aucun texte ni donnée inventée à l'écran.
export const Broll: React.FC<{ id: BrollId; durationInFrames: number }> = ({
  id,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const enter = interpolate(frame, [0, 6], [0, 1], { extrapolateRight: "clamp" });
  const exit = interpolate(frame, [durationInFrames - 5, durationInFrames], [1, 0], {
    extrapolateLeft: "clamp",
  });
  const scale = interpolate(frame, [0, durationInFrames], [1.06, 1.0]);
  const src = BROLL_SOURCES[id];

  return (
    <AbsoluteFill style={{ opacity: Math.min(enter, exit), backgroundColor: bg }}>
      <AbsoluteFill style={{ transform: `scale(${scale})` }}>
        {src ? (
          <OffthreadVideo
            src={staticFile(src)}
            muted
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : id === "project" ? (
          <ProjectGraph />
        ) : id === "build" ? (
          <BuildBoard />
        ) : (
          <Funnel />
        )}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const Backdrop: React.FC = () => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(circle at 50% 38%, #1a1840 0%, ${bg} 62%)`,
    }}
  >
    <AbsoluteFill
      style={{
        backgroundImage:
          "linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)",
        backgroundSize: "60px 60px",
        maskImage: "radial-gradient(circle at 50% 40%, black 20%, transparent 70%)",
      }}
    />
  </AbsoluteFill>
);

// « Gestion de projet » : un hub IA relié à des tâches qui se valident une à une.
const ProjectGraph: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cx = 540;
  const cy = 820;
  const r = 330;
  const nodes = Array.from({ length: 6 }, (_, i) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / 6;
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  });
  const hub = spring({ frame, fps, config: { damping: 14 } });
  const pulse = 1 + 0.04 * Math.sin(frame / 5);

  return (
    <AbsoluteFill>
      <Backdrop />
      <svg viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0 }}>
        <defs>
          <linearGradient id="g1" x1="0" x2="1">
            <stop offset="0" stopColor={blue} />
            <stop offset="1" stopColor={purple} />
          </linearGradient>
        </defs>
        {nodes.map((n, i) => {
          const t0 = 6 + i * 7;
          const draw = interpolate(frame, [t0, t0 + 10], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const done = spring({ frame: frame - t0 - 10, fps, config: { damping: 12 } });
          const len = Math.hypot(n.x - cx, n.y - cy);
          return (
            <g key={i}>
              <line
                x1={cx}
                y1={cy}
                x2={n.x}
                y2={n.y}
                stroke="url(#g1)"
                strokeWidth={5}
                strokeDasharray={len}
                strokeDashoffset={len * (1 - draw)}
                opacity={0.8}
              />
              <g transform={`translate(${n.x} ${n.y}) scale(${done})`}>
                <circle r={58} fill="#11122b" stroke={i % 2 ? purple : blue} strokeWidth={5} />
                <path
                  d="M -22 2 L -6 18 L 24 -16"
                  fill="none"
                  stroke="white"
                  strokeWidth={9}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>
            </g>
          );
        })}
        <g transform={`translate(${cx} ${cy}) scale(${hub * pulse})`}>
          <circle r={130} fill={blue} opacity={0.18} />
          <circle r={95} fill="url(#g1)" />
          <circle r={34} fill="white" opacity={0.95} />
          <circle r={56} fill="none" stroke="white" strokeWidth={4} opacity={0.6} />
        </g>
      </svg>
    </AbsoluteFill>
  );
};

// « Projet complet » : des cartes qui s'assemblent en colonnes + barre de progression.
const BuildBoard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cols = [0, 1, 2];
  const progress = interpolate(frame, [8, 90], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill>
      <Backdrop />
      <div
        style={{
          position: "absolute",
          left: 110,
          right: 110,
          top: 470,
          display: "flex",
          gap: 34,
        }}
      >
        {cols.map((c) => (
          <div key={c} style={{ flex: 1, display: "flex", flexDirection: "column", gap: 26 }}>
            {[0, 1, 2, 3].map((k) => {
              const s = spring({ frame: frame - (c * 4 + k * 6), fps, config: { damping: 15 } });
              return (
                <div
                  key={k}
                  style={{
                    height: 120 + ((c + k) % 2) * 40,
                    borderRadius: 22,
                    background: "rgba(255,255,255,0.06)",
                    border: `2px solid ${k % 2 ? purple : blue}55`,
                    transform: `translateY(${(1 - s) * 140}px)`,
                    opacity: s,
                    padding: 22,
                    display: "flex",
                    flexDirection: "column",
                    gap: 14,
                  }}
                >
                  <div style={{ height: 14, width: "70%", borderRadius: 7, background: "rgba(255,255,255,0.35)" }} />
                  <div style={{ height: 12, width: "45%", borderRadius: 6, background: "rgba(255,255,255,0.15)" }} />
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div
        style={{
          position: "absolute",
          left: 140,
          right: 140,
          top: 1350,
          height: 22,
          borderRadius: 11,
          background: "rgba(255,255,255,0.08)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${progress * 100}%`,
            height: "100%",
            background: `linear-gradient(90deg, ${blue}, ${purple})`,
            boxShadow: `0 0 30px ${purple}`,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

// « Marketing » : un entonnoir abstrait traversé par des points lumineux.
const Funnel: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const layers = [
    { w: 760, y: 560 },
    { w: 560, y: 760 },
    { w: 380, y: 960 },
    { w: 220, y: 1160 },
  ];
  const dots = Array.from({ length: 22 }, (_, i) => i);
  return (
    <AbsoluteFill>
      <Backdrop />
      <svg viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0 }}>
        {layers.map((l, i) => {
          const s = spring({ frame: frame - i * 5, fps, config: { damping: 14 } });
          const next = layers[i + 1]?.w ?? l.w * 0.6;
          const h = 150;
          const x0 = 540 - l.w / 2;
          return (
            <path
              key={i}
              d={`M ${x0} ${l.y} L ${x0 + l.w} ${l.y} L ${540 + next / 2} ${l.y + h} L ${540 - next / 2} ${l.y + h} Z`}
              fill={i % 2 ? purple : blue}
              opacity={0.22 + i * 0.12}
              stroke="white"
              strokeOpacity={0.25}
              strokeWidth={2}
              transform={`translate(0 ${(1 - s) * 80})`}
              style={{ opacity: s }}
            />
          );
        })}
        {dots.map((d) => {
          const t = ((frame + d * 9) % 60) / 60;
          const spread = (1 - t) * 330 * Math.sin(d * 12.9898);
          const y = 480 + t * 900;
          return <circle key={d} cx={540 + spread} cy={y} r={7} fill="white" opacity={0.7 * (1 - t) + 0.2} />;
        })}
        <circle cx={540} cy={1420} r={60 + 6 * Math.sin(frame / 4)} fill={purple} opacity={0.35} />
        <circle cx={540} cy={1420} r={30} fill="white" />
      </svg>
    </AbsoluteFill>
  );
};
