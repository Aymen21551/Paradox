# Paradox

Projet vidéo construit avec [Remotion](https://www.remotion.dev) (React → vidéo).

## Démarrage

```bash
npm install
npm run dev      # Remotion Studio (aperçu interactif)
npm run build    # rendu MP4 → out/video.mp4
npm run still    # image fixe → out/still.png
```

## Structure

- `src/index.ts` — point d'entrée (`registerRoot`)
- `src/Root.tsx` — déclaration des compositions (taille, fps, durée)
- `src/Main.tsx` — composition principale
- `public/` — médias (images, sons, vidéos) utilisables via `staticFile()`
- `remotion.config.ts` — configuration de la CLI

## Navigateur

Remotion télécharge Chrome Headless Shell au premier rendu. Pour utiliser un
Chromium déjà installé, définissez `REMOTION_BROWSER_EXECUTABLE` :

```bash
REMOTION_BROWSER_EXECUTABLE=/chemin/vers/headless_shell npm run build
```
