import { Audio, interpolate, Sequence, staticFile } from "remotion";
import { CLIPS, FPS, MUSIC_SRC, TOTAL_FRAMES, clipOutStart, srcToOut } from "../data/edit";
import { SFX } from "../data/graphics";

// Voix traitée (public/footage/voice.m4a : passe-haut 80 Hz, débruitage,
// compression légère, normalisation −14 LUFS / −1,5 dBTP), montée selon l'EDL.
export const AudioMix: React.FC = () => (
  <>
    {CLIPS.map((c, i) => (
      <Sequence
        key={i}
        from={Math.round(clipOutStart(i) * FPS)}
        durationInFrames={Math.round((c.srcOut - c.srcIn) * FPS)}
        layout="none"
      >
        <Audio src={staticFile("footage/voice.m4a")} trimBefore={Math.round(c.srcIn * FPS)} />
      </Sequence>
    ))}
    {SFX.map((s, i) => {
      const at = srcToOut(s.at);
      if (at === null) return null;
      return (
        <Sequence key={i} from={Math.max(0, Math.round(at * FPS))} layout="none">
          <Audio src={staticFile(`sfx/${s.file}`)} volume={s.volume} />
        </Sequence>
      );
    })}
    {MUSIC_SRC && (
      <Audio
        src={staticFile(MUSIC_SRC)}
        // Musique sous la voix (≈ −20 dB), remonte sur la carte de fin.
        volume={(f) =>
          interpolate(
            f,
            [0, 15, TOTAL_FRAMES - 120, TOTAL_FRAMES - 100, TOTAL_FRAMES - 20, TOTAL_FRAMES],
            [0, 0.1, 0.1, 0.3, 0.3, 0],
            { extrapolateRight: "clamp" },
          )
        }
      />
    )}
  </>
);
