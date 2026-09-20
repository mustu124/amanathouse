"""Rebuild every logo asset in /public from brand-source-logo.png.

The source is a 2000x2000 canvas with the lockup floating in the middle
(tagline / AMANAT wordmark / leopard + ESTD 2019). Each asset is a tight crop
with breathing room, recoloured onto the site's exact ivory (#FAF5EC) so there
is no visible seam against the page background.

Usage: python scripts/build-logo-assets.py   (needs pillow, numpy)
"""
import os

import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "brand-source-logo.png")
PUBLIC = os.path.join(ROOT, "public")
IVORY = np.array([250, 245, 236], dtype=float)

src = Image.open(SRC).convert("RGB")
arr = np.asarray(src).astype(float)
bg = arr[5, 5]
# Multiply-blend onto the site ivory: keeps ink and anti-aliasing intact.
recoloured = np.clip(arr * IVORY / bg, 0, 255).astype(np.uint8)
base = Image.fromarray(recoloured)

diff = np.abs(arr - bg).sum(axis=2)
ink = diff > 18


def bbox(y0, y1, threshold_mask=ink):
    band = threshold_mask[y0 : y1 + 1]
    xs = np.where(band.any(axis=0))[0]
    return xs.min(), xs.max()


def crop(x0, y0, x1, y1, pad):
    # pad is a single number or (left, top, right, bottom).
    l, t, r, b = pad if isinstance(pad, tuple) else (pad, pad, pad, pad)
    box = (max(x0 - l, 0), max(y0 - t, 0), min(x1 + r, 2000), min(y1 + b, 2000))
    return base.crop(box)


# Bands measured from the source: tagline, wordmark, leopard + ESTD.
TAG = (755, 795)
WORD = (834, 1098)
MARK = (1151, 1268)

lx0, lx1 = bbox(TAG[0], MARK[1])
lockup = crop(lx0, TAG[0], lx1, MARK[1], 110)
lockup.save(os.path.join(PUBLIC, "logo.png"), optimize=True)

wx0, wx1 = bbox(*WORD)
# Only ~39px separates the tagline from the wordmark: keep the top pad small.
wordmark = crop(wx0, WORD[0], wx1, WORD[1], (40, 18, 40, 30))
wordmark.save(os.path.join(PUBLIC, "logo-wordmark.png"), optimize=True)

# Leopard only: the strongly coloured pixels (ESTD 2019 is near-white).
strong = diff > 90
band = strong[MARK[0] : MARK[1] + 1]
mx = np.where(band.any(axis=0))[0]
my = np.where(band.any(axis=1))[0] + MARK[0]
mark_box = (mx.min(), my.min(), mx.max(), my.max())
# Only ~53px separates the wordmark from the leopard: keep the top pad small.
mark = crop(*mark_box, (25, 20, 25, 25))
side = max(mark.size)
mark_sq = Image.new("RGB", (side, side), tuple(int(v) for v in IVORY))
mark_sq.paste(mark, ((side - mark.width) // 2, (side - mark.height) // 2))
mark_sq.resize((1024, 1024), Image.LANCZOS).save(os.path.join(PUBLIC, "logo-mark.png"), optimize=True)


def on_canvas(img, size, fill_ratio):
    canvas = Image.new("RGB", size, tuple(int(v) for v in IVORY))
    scale = min(size[0] * fill_ratio / img.width, size[1] * fill_ratio / img.height)
    scaled = img.resize((max(1, int(img.width * scale)), max(1, int(img.height * scale))), Image.LANCZOS)
    canvas.paste(scaled, ((size[0] - scaled.width) // 2, (size[1] - scaled.height) // 2))
    return canvas


# Icons use the leopard mark; social card uses the full lockup.
icon_src = Image.open(os.path.join(PUBLIC, "logo-mark.png"))
for name, size in (("icon-512.png", 512), ("icon-192.png", 192), ("apple-touch-icon.png", 180)):
    on_canvas(icon_src, (size, size), 0.92).save(os.path.join(PUBLIC, name), optimize=True)
icon_src.resize((256, 256), Image.LANCZOS).save(
    os.path.join(PUBLIC, "favicon.ico"), sizes=[(16, 16), (32, 32), (48, 48)]
)
on_canvas(lockup, (1200, 630), 0.7).save(os.path.join(PUBLIC, "og-image.png"), optimize=True)

print("lockup", lockup.size, "wordmark", wordmark.size, "mark box", mark_box)
