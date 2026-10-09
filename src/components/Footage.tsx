import {
  AbsoluteFill,
  interpolate,
  OffthreadVideo,
  Sequence,
  staticFile,
  useCurrentFrame,
} from "remotion";
import {
  CLIPS,
  FPS,
  clipOutStart,
  outToSrc,
  shotAtSrc,
  shotSrcEnd,
} from "../data/edit";

// Visage ≈ 50 % en largeur, 30 % en hauteur : centre des punch-ins.
const ORIGIN = "50% 30%";

// Talking-head monté selon l'EDL, avec recadrages numériques.
export const Footage: React.FC = () => {
  const frame = useCurrentFrame();
  const src = outToSrc(frame / FPS);
  let scale = 1;
  if (src !== null) {
    const { shot, index } = shotAtSrc(src);
    const end = shotSrcEnd(index);
    scale =
      shot.to === undefined
        ? shot.scale
        : interpolate(src, [shot.srcStart, end], [shot.scale, shot.to], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
  }

  return (
    <AbsoluteFill style={{ backgroundColor: "black" }}>
      <AbsoluteFill style={{ transform: `scale(${scale})`, transformOrigin: ORIGIN }}>
        {CLIPS.map((c, i) => (
          <Sequence
            key={i}
            from={Math.round(clipOutStart(i) * FPS)}
            durationInFrames={Math.round((c.srcOut - c.srcIn) * FPS)}
          >
            <OffthreadVideo
              src={staticFile("footage/take1.mp4")}
              trimBefore={Math.round(c.srcIn * FPS)}
              muted
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                // Étalonnage léger : un peu plus de contraste, ciel moins délavé.
                filter: "contrast(1.07) saturate(1.08) brightness(0.98)",
              }}
            />
          </Sequence>
        ))}
      </AbsoluteFill>
      {/* Vignette douce pour concentrer le regard sur le visage */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse 75% 60% at 50% 35%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.35) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};
