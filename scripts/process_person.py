#!/usr/bin/env python3
"""Prépare la personne détourée pour un décor donné et l'encode en vidéo
transparente (VP9 + alpha) pour Remotion.

Par image : masque ISNet lissé dans le temps, polo recoloré (les plis et
ombres sont conservés), couleurs de la personne rapprochées de celles du
décor, « light wrap » (la lumière du décor déborde légèrement sur les
contours), débruitage + agrandissement Lanczos + netteté.

Usage :
  scripts/process_person.py SRC_DIR MASK_DIR BG.jpg OUT.webm [--shirt beige] [--preview N]
"""
import argparse, os, subprocess, sys
import numpy as np
from PIL import Image, ImageFilter

W, H = 1080, 1920
SHIRTS = {  # couleur de base du tissu (RGB linéaire 0-1), sous éclairage moyen
    "none": None,
    "white": (0.93, 0.92, 0.89),
    "beige": (0.80, 0.70, 0.55),
    "navy": (0.13, 0.18, 0.30),
    "black": (0.11, 0.11, 0.12),
    "olive": (0.40, 0.42, 0.30),
}

def load_mask(path, shape):
    if not os.path.exists(path):
        return np.zeros(shape, np.float32)
    return np.asarray(Image.open(path).convert("L")).astype(np.float32) / 255

def shirt_mask(img, m):
    hsv = np.asarray(img.convert("HSV")).astype(np.float32)
    h, s, v = hsv[..., 0] * 360 / 255, hsv[..., 1] / 255, hsv[..., 2] / 255
    yy = np.arange(m.shape[0])[:, None] / m.shape[0]
    blue = (h > 180) & (h < 250) & (s > 0.05) & (v > 0.42)
    white = (v > 0.72) & (s < 0.14) & (yy > 0.45)
    upper = yy < 0.46
    sm = (blue | white) & (m > 0.5) & (yy > 0.36) & ~(upper & ((v < 0.6) | (s < 0.12)))
    sm = Image.fromarray((sm * 255).astype(np.uint8)).filter(ImageFilter.MedianFilter(5)).filter(ImageFilter.GaussianBlur(1))
    return np.asarray(sm).astype(np.float32) / 255

def recolor(im, sm, target):
    lum = im @ np.array([0.299, 0.587, 0.114], np.float32)
    sel = sm > 0.5
    ref = np.median(lum[sel]) if sel.any() else 0.7
    shade = np.clip(lum / max(ref, 1e-3), 0, 1.6) ** 1.1  # plis / ombres relatifs
    new = np.clip(np.array(target, np.float32)[None, None] * shade[..., None], 0, 1)
    return im * (1 - sm[..., None]) + new * sm[..., None]

def harmonize(im, m, bg_mean, amount=0.18):
    sel = m > 0.5
    if not sel.any():
        return im
    mean = im[sel].mean(0)
    # Décale la balance des couleurs vers celle du décor sans toucher la luminance.
    shift = (bg_mean - bg_mean.mean()) - (mean - mean.mean())
    return np.clip(im + amount * shift[None, None], 0, 1)

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("src"); ap.add_argument("masks"); ap.add_argument("bg"); ap.add_argument("out")
    ap.add_argument("--shirt", default="beige", choices=SHIRTS)
    ap.add_argument("--preview", type=int, default=-1, help="n'écrit qu'une image PNG composée")
    a = ap.parse_args()

    frames = sorted(f for f in os.listdir(a.src) if f.endswith(".png"))
    bg = Image.open(a.bg).convert("RGB").resize((W, H), Image.LANCZOS)
    bg_np = np.asarray(bg).astype(np.float32) / 255
    bg_mean = bg_np.reshape(-1, 3).mean(0)
    bg_glow = np.asarray(bg.filter(ImageFilter.GaussianBlur(40))).astype(np.float32) / 255

    idxs = [a.preview] if a.preview >= 0 else range(len(frames))
    enc = None
    if a.preview < 0:
        enc = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgba",
            "-s", f"{W}x{H}", "-r", "30", "-i", "-", "-c:v", "libvpx-vp9", "-b:v", "0", "-crf", "20",
            "-row-mt", "1", "-auto-alt-ref", "0", "-pix_fmt", "yuva420p", a.out], stdin=subprocess.PIPE)

    first = Image.open(os.path.join(a.src, frames[0]))
    shape = (first.height, first.width)
    for i in idxs:
        name = frames[i]
        img = Image.open(os.path.join(a.src, name)).convert("RGB")
        # Lissage temporel du masque (1-2-1) contre le scintillement des bords.
        ms = [load_mask(os.path.join(a.masks, frames[j]), shape) for j in (max(0, i - 1), i, min(len(frames) - 1, i + 1))]
        m = (ms[0] + 2 * ms[1] + ms[2]) / 4
        im = np.asarray(img).astype(np.float32) / 255
        if SHIRTS[a.shirt] is not None and m.max() > 0:
            im = recolor(im, shirt_mask(img, ms[1]), SHIRTS[a.shirt])
        im = harmonize(im, m, bg_mean)
        # Agrandissement + netteté.
        big = Image.fromarray((im * 255).astype(np.uint8)).resize((W, H), Image.LANCZOS)
        big = big.filter(ImageFilter.UnsharpMask(radius=2.2, percent=70, threshold=2))
        mb = Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(3)).resize((W, H), Image.BICUBIC)
        mb = mb.filter(ImageFilter.GaussianBlur(1.6))
        alpha = np.asarray(mb).astype(np.float32) / 255
        rgb = np.asarray(big).astype(np.float32) / 255
        # Light wrap : bande de bord éclairée par le décor.
        inner = np.asarray(mb.filter(ImageFilter.GaussianBlur(10))).astype(np.float32) / 255
        edge = np.clip(alpha - inner, 0, 1) * 2.2
        rgb = rgb * (1 - 0.45 * edge[..., None]) + bg_glow * (0.45 * edge[..., None])
        if a.preview >= 0:
            comp = rgb * alpha[..., None] + np.asarray(bg.filter(ImageFilter.GaussianBlur(5))).astype(np.float32) / 255 * (1 - alpha[..., None])
            Image.fromarray((np.clip(comp, 0, 1) * 255).astype(np.uint8)).save(a.out)
            return
        rgba = np.dstack([np.clip(rgb, 0, 1), alpha])
        enc.stdin.write((rgba * 255).astype(np.uint8).tobytes())
        if i % 100 == 0:
            print(f"{i}/{len(frames)}", flush=True)
    enc.stdin.close(); enc.wait()
    print("OK ->", a.out)

if __name__ == "__main__":
    main()
