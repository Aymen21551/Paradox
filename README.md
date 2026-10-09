# Paradox

Projet vidéo construit avec [Remotion](https://www.remotion.dev) (React → vidéo).

## Démarrage

```bash
npm install
npm run dev      # Remotion Studio (aperçu interactif)
npm run build    # rendu MP4 → out/reel.mp4
npm run still    # image fixe → out/still.png
```

## Structure

- `src/Root.tsx` — composition `Reel` (1080 × 1920, 30 i/s)
- `src/Reel.tsx` — assemblage des calques
- `src/data/edit.ts` — montage (EDL), punch-ins, B-roll, musique
- `src/data/captions.ts` — sous-titres (**brouillon à corriger avec le script exact**)
- `src/data/graphics.ts` — habillage graphique et effets sonores
- `src/components/` — footage, B-roll, graphiques, sous-titres, carte de fin, mixage
- `public/footage/` — prise source + voix traitée (`scripts/process-voice.sh`)
- `public/sfx/`, `public/fonts/`, `public/broll/` — SFX générés, polices (OFL), clips IA
- `docs/PLAN_DE_PRODUCTION.md` — plan de production complet (sections A–K)

## Navigateur

Remotion télécharge Chrome Headless Shell au premier rendu. Pour utiliser un
Chromium déjà installé, définissez `REMOTION_BROWSER_EXECUTABLE` :

```bash
REMOTION_BROWSER_EXECUTABLE=/chemin/vers/headless_shell npm run build
```
