#!/usr/bin/env bash
# Assemble la vidéo détourée (fond transparent) à partir de la prise source et
# des masques ISNet (un PNG en niveaux de gris par image, nommé %05d.png à
# partir de 00000). Les images sans masque deviennent transparentes.
# Usage : scripts/build-person.sh <dossier_images_source> <dossier_masques>
set -euo pipefail
SRC="$1"; MASKS="$2"; FULL="$(mktemp -d)"
N=$(ls "$SRC" | wc -l)
ffmpeg -v error -y -f lavfi -i "color=black:s=478x850" -frames:v 1 "$FULL/black.png"
for ((i = 0; i < N; i++)); do
  f=$(printf "%05d.png" "$i")
  if [[ -f "$MASKS/$f" ]]; then ln -s "$(realpath "$MASKS/$f")" "$FULL/$f"; else ln -s "$FULL/black.png" "$FULL/$f"; fi
done
# Personne : débruitage léger, agrandissement Lanczos + netteté.
# Masque : lissage temporel (anti-scintillement), érosion 1 px (supprime le
# liseré de ciel), adoucissement des bords.
ffmpeg -v error -y -framerate 30 -start_number 0 -i "$SRC/%05d.png" \
  -framerate 30 -start_number 0 -i "$FULL/%05d.png" \
  -filter_complex "[0]hqdn3d=1.5:1.5:3:3,scale=1080:1920:flags=lanczos,unsharp=5:5:0.7:3:3:0[f];[1]format=gray,tmix=frames=3:weights='1 2 1',erosion,gblur=sigma=0.8,scale=1080:1920:flags=bicubic[m];[f][m]alphamerge,format=yuva420p" \
  -c:v libvpx-vp9 -b:v 0 -crf 20 -row-mt 1 -auto-alt-ref 0 -pix_fmt yuva420p \
  public/footage/person.webm
rm -rf "$FULL"
echo "OK -> public/footage/person.webm"
