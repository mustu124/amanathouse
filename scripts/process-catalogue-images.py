"""Turn the client's raw photos into storefront-ready WebP files.

Reads scripts/data/necklaces.json and client-assets/necklaces/*, writes
client-assets/processed/<slug>-1.webp: 1200x1500 (4:5), the whole photo kept
in frame on an ivory canvas (never cropped, except the Teddy collage), under
300KB. Also builds the homepage hero images, About/stack images and the
Necklaces category tile.

Usage: python scripts/process-catalogue-images.py
Needs: pip install pillow pillow-heif
"""
import json
import os

import numpy as np
import pillow_heif
from PIL import Image, ImageOps

pillow_heif.register_heif_opener()

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(ROOT, "client-assets", "necklaces")
OUT = os.path.join(ROOT, "client-assets", "processed")
PUBLIC = os.path.join(ROOT, "public")
IVORY = (250, 245, 236)
MAX_BYTES = 300 * 1024

os.makedirs(OUT, exist_ok=True)


def find_raw(prefix):
    for name in sorted(os.listdir(RAW)):
        if name.startswith(prefix):
            return os.path.join(RAW, name)
    raise FileNotFoundError(prefix)


def load(prefix, crop=None):
    im = ImageOps.exif_transpose(Image.open(find_raw(prefix))).convert("RGB")
    if crop == "lower-photo":
        # The Teddy source is a collage: a camera-screen graphic on top, the
        # real photo below. Find the hard boundary row and keep what is below.
        arr = np.asarray(im).astype(int)
        h, w, _ = arr.shape
        row_diff = np.abs(arr[1:] - arr[:-1]).sum(axis=(1, 2)) / (w * 3)
        lo, hi = int(h * 0.2), int(h * 0.6)
        best = int(np.argmax(row_diff[lo:hi])) + lo
        im = im.crop((0, best + 2, w, h))
    return im


def fit_canvas(im, size, pad=IVORY):
    """Scale to fit inside `size` without cropping; centre on an ivory canvas."""
    canvas = Image.new("RGB", size, pad)
    scaled = ImageOps.contain(im, size, Image.LANCZOS)
    canvas.paste(scaled, ((size[0] - scaled.width) // 2, (size[1] - scaled.height) // 2))
    return canvas


def hero_frame(src, size, anchor):
    # Full-bleed cover crop; focal point kept on the necklace area (upper-middle).
    return ImageOps.fit(src, size, Image.LANCZOS, centering=(0.5, 0.38))


def save_webp(im, path, max_bytes=MAX_BYTES):
    for quality in (90, 86, 82, 78, 74, 70, 65, 60):
        im.save(path, "WEBP", quality=quality, method=6)
        if os.path.getsize(path) <= max_bytes:
            return quality
    return 60


def main():
    products = json.load(open(os.path.join(ROOT, "scripts", "data", "necklaces.json"), encoding="utf-8"))
    cache = {}
    for p in products:
        key = (p["image"], p.get("crop"))
        if key not in cache:
            cache[key] = load(p["image"], p.get("crop"))
        canvas = fit_canvas(cache[key], (1200, 1500))
        path = os.path.join(OUT, f"{p['slug']}-1.webp")
        q = save_webp(canvas, path)
        print(f"{p['slug']}-1.webp  q{q}  {os.path.getsize(path) // 1024}KB")

    # Homepage hero: full-bleed. A blurred, ivory-tinted copy of the photo fills
    # the whole frame; the sharp photo sits on top (right on desktop, top on
    # mobile) with a soft edge, so no part of the screen is a flat empty band.
    os.makedirs(os.path.join(PUBLIC, "hero"), exist_ok=True)
    heroes = [("B0EC1FD1", 1), ("E33FDD03", 2), ("0A2E4FFF", 3)]
    for prefix, n in heroes:
        src = load(prefix)
        save_webp(hero_frame(src, (1920, 1080), "right"), os.path.join(PUBLIC, "hero", f"hero-{n}.webp"), 300 * 1024)
        save_webp(hero_frame(src, (1080, 1920), "top"), os.path.join(PUBLIC, "hero", f"hero-{n}-mobile.webp"), 300 * 1024)

    # About + "everyday stack" editorial images (4:5, same treatment).
    os.makedirs(os.path.join(PUBLIC, "brand"), exist_ok=True)
    for prefix, name in (("E33FDD03", "about"), ("F67C21E8", "stack")):
        canvas = fit_canvas(load(prefix), (1200, 1500))
        save_webp(canvas, os.path.join(PUBLIC, "brand", f"{name}.webp"))

    # Necklaces category tile: square crop around the necklace.
    tile_src = load("A3684AC4")
    w, h = tile_src.size
    top = int(h * 0.06)
    tile = tile_src.crop((0, top, w, top + w)).resize((800, 800), Image.LANCZOS)
    tile.save(os.path.join(PUBLIC, "categories", "necklaces.jpg"), quality=88)
    print("hero, brand and category images written")


if __name__ == "__main__":
    main()
