#!/usr/bin/env bash
# Régénère la piste voix traitée à partir de la prise source.
# Usage : scripts/process-voice.sh [public/footage/take1.mp4]
set -euo pipefail
IN="${1:-public/footage/take1.mp4}"
ffmpeg -v error -y -i "$IN" -vn \
  -af "highpass=f=80,afftdn=nf=-25,acompressor=threshold=-22dB:ratio=3:attack=10:release=150,loudnorm=I=-14:TP=-1.5:LRA=9" \
  -ar 48000 -c:a aac -b:a 192k public/footage/voice.m4a
echo "OK -> public/footage/voice.m4a"
