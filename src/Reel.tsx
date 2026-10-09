import { AbsoluteFill, Sequence } from "remotion";
import { AudioMix } from "./components/AudioMix";
import { Broll } from "./components/Broll";
import { Captions } from "./components/Captions";
import { EndCard } from "./components/EndCard";
import { Footage } from "./components/Footage";
import { Graphics } from "./components/Graphics";
import { END_CARD_SECONDS, FPS, SHOTS, SPEECH_SECONDS, shotSrcEnd, srcToOut } from "./data/edit";

export const Reel: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "black" }}>
    <Footage />
    {SHOTS.map((s, i) => {
      if (!s.broll) return null;
      const a = srcToOut(s.srcStart);
      const b = srcToOut(shotSrcEnd(i));
      if (a === null || b === null) return null;
      const dur = Math.round((b - a) * FPS);
      return (
        <Sequence key={i} from={Math.round(a * FPS)} durationInFrames={dur}>
          <Broll id={s.broll} durationInFrames={dur} />
        </Sequence>
      );
    })}
    <Graphics />
    <Captions />
    <Sequence from={Math.round(SPEECH_SECONDS * FPS)} durationInFrames={Math.round(END_CARD_SECONDS * FPS)}>
      <EndCard />
    </Sequence>
    <AudioMix />
  </AbsoluteFill>
);
