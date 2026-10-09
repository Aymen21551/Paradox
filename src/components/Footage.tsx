import {
  AbsoluteFill,
  Img,
  interpolate,
  OffthreadVideo,
  Sequence,
  staticFile,
  useCurrentFrame,
} from "remotion";
import {
  BACKGROUND,
  CLIPS,
  FPS,
  clipOutStart,
  outToSrc,
  shotAtSrc,
  shotSrcEnd,
} from "../data/edit";

// Visage ≈ 50 % en largeur, 30 % en hauteur : centre des punch-ins.
const ORIGIN = "50% 30%";

// Talking-head monté selon l'EDL, avec recadrages numériques. Avec un décor
// (BACKGROUND), la personne détourée est posée sur la photo et le décor
// bouge moins que la personne lors des punch-ins (parallaxe).
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

  const bg = BACKGROUND;
  // Dérive lente du décor pour éviter l'effet « photo figée ».
  const drift = interpolate(frame, [0, 1500], [0, -30]);
  const bgScale = 1.08 + (scale - 1) * 0.45;

  return (
    <AbsoluteFill style={{ backgroundColor: "black" }}>
      {bg && (
        <AbsoluteFill style={{ transform: `translateX(${drift}px) scale(${bgScale})`, transformOrigin: ORIGIN }}>
          <Img
            src={staticFile(bg.src)}
            style={{ width: "100%", height: "100%", objectFit: "cover", filter: `blur(${bg.blur}px)` }}
          />
        </AbsoluteFill>
      )}
      <AbsoluteFill style={{ transform: `scale(${scale})`, transformOrigin: ORIGIN }}>
        {CLIPS.map((c, i) => (
          <Sequence
            key={i}
            from={Math.round(clipOutStart(i) * FPS)}
            durationInFrames={Math.round((c.srcOut - c.srcIn) * FPS)}
          >
            <OffthreadVideo
              src={staticFile(bg ? "footage/person.webm" : "footage/take1.mp4")}
              transparent={Boolean(bg)}
              trimBefore={Math.round(c.srcIn * FPS)}
              muted
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                filter: bg ? bg.personFilter : "contrast(1.07) saturate(1.08) brightness(0.98)",
              }}
            />
            {bg?.personTint && (
              // Voile coloré : harmonise la lumière de la personne avec le décor.
              <AbsoluteFill style={{ mixBlendMode: "soft-light", backgroundColor: bg.personTint }} />
            )}
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
