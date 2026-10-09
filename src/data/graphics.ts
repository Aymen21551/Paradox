// Habillage graphique, en temps source. Les textes arabes qui citent le
// script ne reprennent que des mots clairement audibles ; à revérifier avec
// le script verrouillé.

export type Graphic =
  | { kind: "nameTag"; start: number; end: number }
  | { kind: "stat"; start: number; end: number; value: string }
  | { kind: "keyword"; start: number; end: number; text: string }
  | { kind: "webinar"; start: number; end: number; duration: string }
  | { kind: "comment"; start: number; end: number; word: string }
  | { kind: "link"; start: number; end: number };

export const GRAPHICS: Graphic[] = [
  { kind: "stat", start: 0.45, end: 2.9, value: "10%" },
  { kind: "nameTag", start: 3.2, end: 6.3 },
  { kind: "keyword", start: 7.4, end: 10.1, text: "إدارة المشاريع" },
  { kind: "webinar", start: 35.7, end: 40.4, duration: "ساعتين" },
  { kind: "comment", start: 48.64, end: 51.3, word: "مهتم" },
  { kind: "link", start: 51.6, end: 53.6 },
];

// Effets sonores (fichiers dans public/sfx/), en temps source.
export type Sfx = { at: number; file: string; volume: number };

export const SFX: Sfx[] = [
  { at: 0.42, file: "impact.wav", volume: 0.55 },
  { at: 7.35, file: "click.wav", volume: 0.5 },
  { at: 13.5, file: "whoosh.wav", volume: 0.35 },
  { at: 22.3, file: "whoosh.wav", volume: 0.35 },
  { at: 30.2, file: "whoosh.wav", volume: 0.35 },
  { at: 34.2, file: "riser.wav", volume: 0.3 },
  { at: 35.65, file: "click.wav", volume: 0.5 },
  { at: 48.45, file: "whoosh.wav", volume: 0.3 },
  { at: 48.7, file: "click.wav", volume: 0.45 },
];
