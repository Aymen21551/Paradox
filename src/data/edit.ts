// Montage (EDL) et plan de cadrage, exprimés en secondes de la prise source
// `public/footage/take1.mp4`. Tout le reste (sous-titres, graphiques, SFX)
// est aussi exprimé en temps source puis converti automatiquement.

export const FPS = 30;

export type Clip = { srcIn: number; srcOut: number };

// Clip B commence à la reprise du CTA : le passage 40.60 → 48.45 est une
// première tentative du CTA, interrompue (pause de 1,5 s) puis reprise.
export const CLIPS: Clip[] = [
  { srcIn: 0.3, srcOut: 40.6 },
  { srcIn: 48.45, srcOut: 53.6 },
];

export const END_CARD_SECONDS = 3.5;

// Cadrage numérique (une seule caméra) : 1 = plan source, >1 = punch-in.
// `to` permet un push-in lent pendant le plan.
export type Shot = {
  srcStart: number;
  scale: number;
  to?: number;
  // Plan de coupe (B-roll) à la place du talking-head, voix continue dessous.
  broll?: BrollId;
};

export type BrollId = "project" | "build" | "marketing";

export const SHOTS: Shot[] = [
  { srcStart: 0, scale: 1.18, to: 1.26 }, // hook : gros plan, push-in lent
  { srcStart: 3.1, scale: 1.0 }, // plan large
  { srcStart: 6.4, scale: 1.12 }, // plan rapproché
  { srcStart: 10.2, scale: 1.0 },
  { srcStart: 13.6, scale: 1.0, broll: "project" },
  { srcStart: 16.75, scale: 1.12 },
  { srcStart: 20.4, scale: 1.0 },
  { srcStart: 22.4, scale: 1.0, broll: "build" },
  { srcStart: 25.9, scale: 1.12 },
  { srcStart: 30.3, scale: 1.0, broll: "marketing" },
  { srcStart: 33.0, scale: 1.25 },
  { srcStart: 35.4, scale: 1.0, to: 1.06 },
  { srcStart: 48.45, scale: 1.22 }, // la coupe du retake est masquée par le changement d'échelle
  { srcStart: 51.4, scale: 1.1 },
];

// Clips IA à déposer dans public/broll/. Tant qu'une valeur est null, un
// plan de coupe animé (motion design) est généré à la place.
export const BROLL_SOURCES: Record<BrollId, string | null> = {
  project: null, // ex. "broll/broll1_project.mp4"
  build: null,
  marketing: null,
};

// Musique sous licence à déposer dans public/music/ (null = pas de musique).
export const MUSIC_SRC: string | null = null;

// --- Conversions temps source <-> temps de sortie -------------------------

const clipOffsets = (() => {
  let acc = 0;
  return CLIPS.map((c) => {
    const start = acc;
    acc += c.srcOut - c.srcIn;
    return start;
  });
})();

export const SPEECH_SECONDS = CLIPS.reduce((s, c) => s + c.srcOut - c.srcIn, 0);
export const TOTAL_SECONDS = SPEECH_SECONDS + END_CARD_SECONDS;
export const TOTAL_FRAMES = Math.round(TOTAL_SECONDS * FPS);

export const clipOutStart = (i: number) => clipOffsets[i];

/** Temps source -> temps de sortie, ou null si ce moment a été coupé. */
export const srcToOut = (src: number): number | null => {
  for (let i = 0; i < CLIPS.length; i++) {
    const c = CLIPS[i];
    if (src >= c.srcIn && src <= c.srcOut) return clipOffsets[i] + src - c.srcIn;
  }
  return null;
};

/** Temps de sortie -> temps source (null pendant la carte de fin). */
export const outToSrc = (out: number): number | null => {
  for (let i = 0; i < CLIPS.length; i++) {
    const c = CLIPS[i];
    const len = c.srcOut - c.srcIn;
    if (out >= clipOffsets[i] && out < clipOffsets[i] + len) {
      return c.srcIn + out - clipOffsets[i];
    }
  }
  return null;
};

export const shotAtSrc = (src: number): { shot: Shot; index: number } => {
  let index = 0;
  for (let i = 0; i < SHOTS.length; i++) if (SHOTS[i].srcStart <= src) index = i;
  return { shot: SHOTS[index], index };
};

/** Fin (temps source) du plan d'index donné. */
export const shotSrcEnd = (index: number) =>
  index + 1 < SHOTS.length ? SHOTS[index + 1].srcStart : CLIPS[CLIPS.length - 1].srcOut;
