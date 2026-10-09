// Sous-titres phrase par phrase, en temps source (secondes).
//
// ⚠️ BROUILLON : ce texte provient d'une transcription automatique (Whisper
// small, local) du dialecte tunisien. Il n'est PAS le script verrouillé.
// Remplacez chaque `text` par la phrase exacte de votre script, puis passez
// `CAPTIONS_VERIFIED` à true. Les phrases `uncertain: true` s'affichent en
// jaune dans la vidéo tant que CAPTIONS_VERIFIED vaut false.

export const CAPTIONS_VERIFIED = false;

export type Caption = {
  start: number;
  end: number;
  text: string;
  uncertain?: boolean;
};

export const CAPTIONS: Caption[] = [
  { start: 0.45, end: 2.64, text: "عشرة بالمية هي المعلومة", uncertain: true },
  { start: 3.13, end: 3.85, text: "مية بالمية", uncertain: true },
  { start: 4.18, end: 5.94, text: "هي الفكرة باش تخرج بيها من آخر الفيديو" },
  { start: 6.65, end: 9.58, text: "اليوم قادر يعاونك إنك تعمل إدارة المشاريع", uncertain: true },
  { start: 10.59, end: 11.58, text: "وكي انت تبقى سنين", uncertain: true },
  { start: 12.26, end: 13.34, text: "تحب تحلّ ... معيّن", uncertain: true },
  { start: 13.81, end: 16.52, text: "قادر إنه يعملك إدارة مشروع كاملة", uncertain: true },
  { start: 16.94, end: 17.67, text: "ويعطيك الفكرة", uncertain: true },
  { start: 18.75, end: 19.74, text: "كاملة", uncertain: true },
  { start: 20.87, end: 22.0, text: "المشروع عليك الكلّو", uncertain: true },
  { start: 22.56, end: 24.77, text: "وتسكّر معاها التفاصيل", uncertain: true },
  { start: 26.1, end: 27.23, text: "كيفاش يطلع", uncertain: true },
  { start: 27.89, end: 29.41, text: "و ... نحبّنا نبداو", uncertain: true },
  { start: 30.53, end: 32.14, text: "وانت كخبير في مجال التسويق", uncertain: true },
  { start: 32.7, end: 33.48, text: "فكّر كيفاش", uncertain: true },
  { start: 33.78, end: 34.34, text: "قدّاش", uncertain: true },
  { start: 35.71, end: 37.14, text: "ولذلك احنا عملنا ويبينار" },
  { start: 37.77, end: 38.2, text: "ساعتين", uncertain: true },
  { start: 38.44, end: 39.97, text: "باش نحكيو في كل هذا بالتفصيل", uncertain: true },
  // 40.6 → 48.45 : premier essai du CTA, coupé au montage (voir edit.ts).
  { start: 48.64, end: 49.62, text: "إذا كنت مهتم" },
  { start: 49.98, end: 51.17, text: "كتبلي مهتم في التعليقات", uncertain: true },
  { start: 51.61, end: 51.93, text: "وإلا", uncertain: true },
  { start: 52.32, end: 53.31, text: "سجّل في الرابط تحت الفيديو", uncertain: true },
];
