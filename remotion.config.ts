// Configuration Remotion — s'applique à la CLI (studio, render, still).
// https://www.remotion.dev/docs/config
import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);

// Permet d'utiliser un Chromium déjà installé (ex. environnement cloud sans
// accès au téléchargement de Chrome Headless Shell par Remotion).
if (process.env.REMOTION_BROWSER_EXECUTABLE) {
  Config.setBrowserExecutable(process.env.REMOTION_BROWSER_EXECUTABLE);
}
