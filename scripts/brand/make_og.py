#!/usr/bin/env python3
"""Social preview images (1200x630) for the English and Korean pages. Pillow only, no browser.

    python3 scripts/brand/make_og.py --font /path/to/PretendardVariable.ttf --out public/assets/og
"""
import argparse
import pathlib
import sys

from PIL import Image, ImageDraw, ImageFilter, ImageFont

sys.path.insert(0, str(pathlib.Path(__file__).parent))
import make_logo as L  # noqa: E402  (reuse the mark renderer)

W, H, S = 1200, 630, 2  # logical size, supersampling factor
BG = (20, 16, 12)
INK = (246, 239, 228)
MUTED = (201, 190, 174)
ORANGE = (255, 122, 43)
STATUS = {"shipped": (52, 211, 153), "oss": (142, 125, 255), "prototype": (255, 122, 43), "planning": (125, 178, 255)}

COPY = {
    "en": {
        "eyebrow": "AI-NATIVE PLATFORMS & SOFTWARE · KOREA",
        "lines": ["Five products.", "Four stages."],
        "sub": "AI-native platforms and software, from first plan to shipped.",
        "name": ["Brilliant Tiger", "빛나는 범"],
        "chips": [("Claude Pet", "shipped"), ("llmwiki_json", "oss"), ("Moshim", "prototype"), ("K-Factory Hub", "planning"), ("Instructor Platform", "planning")],
        "spaced": True,
    },
    "ko": {
        "eyebrow": "AI 네이티브 플랫폼·소프트웨어 · 대한민국",
        "lines": ["제품 다섯 개.", "단계는 넷."],
        "sub": "기획부터 출시까지, AI 네이티브 플랫폼·소프트웨어.",
        "name": ["빛나는 범", "Brilliant Tiger"],
        "chips": [("Claude Pet", "shipped"), ("llmwiki_json", "oss"), ("모심", "prototype"), ("K-Factory Hub", "planning"), ("Instructor Platform", "planning")],
        "spaced": False,
    },
}


def make(lang, font_path, out):
    c = COPY[lang]

    def font(size, weight):
        f = ImageFont.truetype(font_path, round(size * S))
        f.set_variation_by_axes([weight])
        return f

    def blank():
        return Image.new("RGBA", (W * S, H * S), (0, 0, 0, 0))

    img = Image.new("RGBA", (W * S, H * S), BG + (255,))

    # warm glow behind the mark
    glow = blank()
    ImageDraw.Draw(glow).ellipse([(-20) * S, 60 * S, 520 * S, 600 * S], fill=ORANGE + (120,))
    img = Image.alpha_composite(img, glow.filter(ImageFilter.GaussianBlur(70 * S)))

    # slanted tiger-stripe bars on the right edge (translucent, so they go on their own layer)
    bars = blank()
    d = ImageDraw.Draw(bars)
    skew = 192
    for x0, w, col in [(1105, 96, ORANGE + (52,)), (985, 36, INK + (18,)), (932, 14, ORANGE + (96,))]:
        d.polygon([(x0 * S, 0), ((x0 + w) * S, 0), ((x0 + w - skew) * S, H * S), ((x0 - skew) * S, H * S)], fill=col)
    img = Image.alpha_composite(img, bars)

    # the mark, with a soft contact shadow
    shadow = blank()
    ImageDraw.Draw(shadow).ellipse([95 * S, 462 * S, 395 * S, 500 * S], fill=(0, 0, 0, 120))
    img = Image.alpha_composite(img, shadow.filter(ImageFilter.GaussianBlur(14 * S)))
    img.alpha_composite(L.render_mark(round(330 * S)), (round(80 * S), round(112 * S)))

    X = 470
    # title size: shrink until the widest line fits
    size = 78 if lang == "en" else 72
    while max(font(size, 800).getlength(t) for t in c["lines"]) / S > 690:
        size -= 2
    tf = font(size, 800)
    step = round(size * 1.18)
    ys = [150 + i * step for i in range(len(c["lines"]))]

    # translucent shapes: marker highlight + chip backgrounds
    over = blank()
    od = ImageDraw.Draw(over)
    wline = tf.getlength(c["lines"][1]) / S
    top = ys[1] + size * 0.62
    od.polygon(
        [((X - 4) * S, (top + size * 0.30) * S), ((X + wline + 6) * S, (top + size * 0.30) * S),
         ((X + wline - 4) * S, top * S), ((X - 14) * S, top * S)],
        fill=ORANGE + (135,),
    )
    nf = font(20, 700)
    ch, gap = 46, 12
    cx, cy = X, 462
    cells = []
    for name, kind in c["chips"]:
        w = nf.getlength(name) / S + 62
        if cx + w > X + 690:
            cx, cy = X, cy + ch + gap
        cells.append((cx, cy, w, name, kind))
        cx += w + gap
    for x0, y0, w, name, kind in cells:
        col = STATUS[kind]
        od.rounded_rectangle(
            [x0 * S, y0 * S, (x0 + w) * S, (y0 + ch) * S], radius=ch / 2 * S,
            fill=(255, 255, 255, 16), outline=(col + (170,)) if kind == "planning" else (255, 255, 255, 40), width=2 * S,
        )
        r = 6
        od.ellipse([(x0 + 22 - r) * S, (y0 + ch / 2 - r) * S, (x0 + 22 + r) * S, (y0 + ch / 2 + r) * S],
                   fill=None if kind == "planning" else col + (255,), outline=col + (255,), width=2 * S)
    img = Image.alpha_composite(img, over)

    # opaque text on top
    d = ImageDraw.Draw(img)
    ef = font(21, 650)
    x = X
    for ch_ in c["eyebrow"]:
        d.text((x * S, 108 * S), ch_, font=ef, fill=ORANGE)
        x += ef.getlength(ch_) / S + (3.2 if c["spaced"] else 0.6)
    for y, line in zip(ys, c["lines"]):
        d.text((X * S, y * S), line, font=tf, fill=INK)
    # one-line summary under the title, wrapped to the text column
    sf2 = font(27, 500)
    rows, cur = [], ""
    for w in c["sub"].split(" "):
        t = (cur + " " + w).strip()
        if sf2.getlength(t) / S <= 690:
            cur = t
        else:
            rows.append(cur)
            cur = w
    rows.append(cur)
    for i, row in enumerate(rows):
        d.text((X * S, (ys[-1] + step + 6 + i * 38) * S), row, font=sf2, fill=MUTED)
    for x0, y0, w, name, kind in cells:
        d.text(((x0 + 40) * S, (y0 + ch / 2) * S), name, font=nf, fill=INK, anchor="lm")
    d.text((80 * S, 505 * S), c["name"][0], font=font(30, 800), fill=INK)
    d.text((80 * S, 548 * S), c["name"][1], font=font(22, 600), fill=MUTED)
    d.text((80 * S, 584 * S), "brillianttigercorp.com", font=font(18, 600), fill=ORANGE)

    out.mkdir(parents=True, exist_ok=True)
    path = out / f"og-{lang}.png"
    img.convert("RGB").resize((W, H), Image.LANCZOS).save(path, optimize=True)
    print("wrote", path)


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--font", required=True)
    ap.add_argument("--out", default="public/assets/og")
    a = ap.parse_args()
    for lang in COPY:
        make(lang, a.font, pathlib.Path(a.out))
