import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";
import { BRAND } from "./data/brand";

// Polices auto-hébergées (Fontsource, licence OFL) : aucun accès réseau requis.
const faces: [string, string, string][] = [
  [BRAND.fonts.arabic, "cairo-arabic-600-normal.woff2", "600"],
  [BRAND.fonts.arabic, "cairo-arabic-800-normal.woff2", "800"],
  [BRAND.fonts.arabic, "cairo-latin-600-normal.woff2", "600"],
  [BRAND.fonts.arabic, "cairo-latin-800-normal.woff2", "800"],
  [BRAND.fonts.latin, "inter-latin-500-normal.woff2", "500"],
  [BRAND.fonts.latin, "inter-latin-700-normal.woff2", "700"],
  [BRAND.fonts.latin, "inter-latin-800-normal.woff2", "800"],
];

export const fontsReady = Promise.all(
  faces.map(([family, file, weight]) =>
    loadFont({ family, url: staticFile(`fonts/${file}`), weight }),
  ),
);
