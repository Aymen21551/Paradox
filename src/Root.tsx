import { Composition, continueRender, delayRender } from "remotion";
import { fontsReady } from "./fonts";
import { Reel } from "./Reel";
import { FPS, TOTAL_FRAMES } from "./data/edit";

const fontHandle = delayRender("Chargement des polices");
fontsReady.then(() => continueRender(fontHandle));

// Format vertical 9:16 pour Reels / TikTok / Shorts.
export const RemotionRoot: React.FC = () => (
  <Composition
    id="Reel"
    component={Reel}
    durationInFrames={TOTAL_FRAMES}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
