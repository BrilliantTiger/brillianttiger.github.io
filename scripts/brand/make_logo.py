#!/usr/bin/env python3
"""Generate the Brilliant Tiger placeholder logo set.

The mark is a low-poly ("brilliant cut") tiger head: the right half is defined once and
mirrored, the left half uses slightly lighter facets so the head reads as a lit gem. The
forehead stripes form the 王 pattern East Asian tigers are known for. Flat fills only, so
the SVG can be inlined many times on one page.

    pip install pillow fonttools brotli
    python3 scripts/brand/make_logo.py --font /path/to/PretendardVariable.ttf --out public

Writes SVGs and PNG/ICO exports. No browser involved.
"""
import argparse
import math
import pathlib

from PIL import Image, ImageDraw

INK = "#1B1410"
PAPER = "#F6EFE4"
EYE = "#FFC845"

# name: (points of the RIGHT half, right colour, left colour)
FACETS = {
    "forehead": ([(64, 18), (80, 22), (90, 40), (64, 46)], "#FF7A18", "#FF8B30"),
    "ear_outer": ([(80, 22), (104, 8), (112, 36), (90, 40)], "#FFAA4D", "#FFBC6A"),
    "temple": ([(90, 40), (112, 36), (120, 62), (96, 58)], "#F2660A", "#FF7616"),
    "brow": ([(64, 46), (90, 40), (96, 58), (76, 56)], "#E85A05", "#F56B14"),
    "bridge": ([(64, 46), (76, 56), (64, 66)], "#FF9333", "#FFA44F"),
    "cheek_in": ([(76, 56), (96, 58), (98, 80), (78, 78), (64, 66)], "#FF8226", "#FF9642"),
    "cheek": ([(96, 58), (120, 62), (106, 92), (98, 80)], "#E85D0A", "#F67019"),
    "jaw": ([(78, 78), (98, 80), (106, 92), (82, 114), (70, 100)], "#FFB45E", "#FFC479"),
    # muzzle and chin are tinted so the lower silhouette still reads on cream backgrounds
    "muzzle": ([(64, 66), (78, 78), (70, 100), (64, 104)], "#FFE9CC", "#FFF1DD"),
    "chin": ([(64, 104), (70, 100), (82, 114), (64, 120)], "#FFDDB6", "#FFE8CA"),
}
EAR_INNER = ([(86, 26), (102, 14), (106, 32)], "#FFE4BF", "#FFEED6")
STRIPES = [  # right half, mirrored
    [(66, 26), (79, 24), (77.5, 28.5), (66, 30)],
    [(66, 35), (85, 32), (83, 37), (66, 39)],
    [(112.2, 38), (99, 44), (115, 47)],
    [(118.2, 56), (102, 60), (118.6, 66)],
    [(114.5, 74), (99, 77), (110, 84)],
]
CENTER_STRIPE = [(64, 18), (68.6, 19.2), (66.6, 32), (64, 45), (61.4, 32), (59.4, 19.2)]
NOSE = [(55, 66), (73, 66), (64, 77.5)]
EYE_POLY = [(78, 52), (86, 47), (96, 46), (88, 56)]
PUPIL = (87.6, 51.4, 1.7, 3.5, -20)  # cx, cy, rx, ry, rotation (right eye)
MOUTH = [  # quadratic paths: start, control, end
    [(64, 77.5), (64, 85), None],
    [(64, 85), (58.5, 91.5), (51.5, 89)],
    [(64, 85), (69.5, 91.5), (76.5, 89)],
]
MOUTH_W = 2.6


def mir(pts):
    return [(128 - x, y) for x, y in pts]


def fmt(v):
    return f"{v:.2f}".rstrip("0").rstrip(".")


# ------------------------------------------------------------------ SVG


def poly(pts, fill, seam=True):
    p = " ".join(f"{fmt(x)},{fmt(y)}" for x, y in pts)
    stroke = f' stroke="{fill}" stroke-width=".6" stroke-linejoin="round"' if seam else ""
    return f'<polygon points="{p}" fill="{fill}"{stroke}/>'


def head_svg():
    out = []
    for pts, right, left in FACETS.values():
        out += [poly(pts, right), poly(mir(pts), left)]
    out += [poly(EAR_INNER[0], EAR_INNER[1]), poly(mir(EAR_INNER[0]), EAR_INNER[2])]
    out.append(poly(CENTER_STRIPE, INK, seam=False))
    for s in STRIPES:
        out += [poly(s, INK, seam=False), poly(mir(s), INK, seam=False)]
    out += [poly(EYE_POLY, EYE, seam=False), poly(mir(EYE_POLY), EYE, seam=False)]
    cx, cy, rx, ry, rot = PUPIL
    out.append(f'<ellipse cx="{fmt(cx)}" cy="{fmt(cy)}" rx="{rx}" ry="{ry}" transform="rotate({rot} {fmt(cx)} {fmt(cy)})" fill="{INK}"/>')
    out.append(f'<ellipse cx="{fmt(128 - cx)}" cy="{fmt(cy)}" rx="{rx}" ry="{ry}" transform="rotate({-rot} {fmt(128 - cx)} {fmt(cy)})" fill="{INK}"/>')
    out.append(poly(NOSE, INK, seam=False))
    out.append(
        f'<path d="M64 77.5V85M64 85Q58.5 91.5 51.5 89M64 85Q69.5 91.5 76.5 89" fill="none" '
        f'stroke="{INK}" stroke-width="{MOUTH_W}" stroke-linecap="round" stroke-linejoin="round"/>'
    )
    return "\n  ".join(out)


def svg_mark(label=True):
    aria = ' role="img" aria-label="Brilliant Tiger"' if label else ' aria-hidden="true"'
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="8 8 112 112"{aria}>\n  {head_svg()}\n</svg>\n'


def svg_icon(bg=INK, rx=26, scale=0.78):
    return (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">\n'
        f'  <rect width="128" height="128" rx="{rx}" fill="{bg}"/>\n'
        f'  <g transform="translate(64 64) scale({scale}) translate(-64 -64)">\n  {head_svg()}\n  </g>\n</svg>\n'
    )


# --------------------------------------------------------------- raster


def rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i : i + 2], 16) for i in (0, 2, 4))


def quad(p0, p1, p2, n=24):
    pts = []
    for i in range(n + 1):
        t = i / n
        x = (1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * p1[0] + t**2 * p2[0]
        y = (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * p1[1] + t**2 * p2[1]
        pts.append((x, y))
    return pts


def ellipse_pts(cx, cy, rx, ry, rot, n=40):
    a = math.radians(rot)
    pts = []
    for i in range(n):
        t = 2 * math.pi * i / n
        x, y = rx * math.cos(t), ry * math.sin(t)
        pts.append((cx + x * math.cos(a) - y * math.sin(a), cy + x * math.sin(a) + y * math.cos(a)))
    return pts


def draw_head(d, s, ox, oy):
    """Draw the head on ImageDraw d. (ox, oy) = pixel position of the 128-box origin, s = px per unit."""

    def P(pts):
        return [(ox + x * s, oy + y * s) for x, y in pts]

    def fill(pts, color):
        d.polygon(P(pts), fill=rgb(color), outline=rgb(color))

    for pts, right, left in FACETS.values():
        fill(pts, right)
        fill(mir(pts), left)
    fill(EAR_INNER[0], EAR_INNER[1])
    fill(mir(EAR_INNER[0]), EAR_INNER[2])
    fill(CENTER_STRIPE, INK)
    for st in STRIPES:
        fill(st, INK)
        fill(mir(st), INK)
    fill(EYE_POLY, EYE)
    fill(mir(EYE_POLY), EYE)
    cx, cy, rx, ry, rot = PUPIL
    fill(ellipse_pts(cx, cy, rx, ry, rot), INK)
    fill(ellipse_pts(128 - cx, cy, rx, ry, -rot), INK)
    fill(NOSE, INK)
    w = MOUTH_W * s
    for p0, p1, p2 in MOUTH:
        pts = [p0, p1] if p2 is None else quad(p0, p1, p2)
        px = P(pts)
        d.line(px, fill=rgb(INK), width=round(w), joint="curve")
        for x, y in (px[0], px[-1]):
            d.ellipse([x - w / 2, y - w / 2, x + w / 2, y + w / 2], fill=rgb(INK))


SS = 8  # supersampling


def render_mark(size):
    """Transparent PNG of the bare mark (viewBox 8..120)."""
    big = size * SS
    img = Image.new("RGBA", (big, big), (0, 0, 0, 0))
    s = big / 112
    draw_head(ImageDraw.Draw(img), s, -8 * s, -8 * s)
    return img.resize((size, size), Image.LANCZOS)


def render_icon(size, scale=0.78, radius=26, bg=INK, rounded=True):
    big = size * SS
    img = Image.new("RGBA", (big, big), (0, 0, 0, 0) if rounded else rgb(bg) + (255,))
    d = ImageDraw.Draw(img)
    if rounded:
        d.rounded_rectangle([0, 0, big - 1, big - 1], radius=radius / 128 * big, fill=rgb(bg))
    s = big / 128 * scale
    off = big / 2 - 64 * s
    draw_head(d, s, off, off)
    return img.resize((size, size), Image.LANCZOS)


# ------------------------------------------------------------- wordmark


def wordmark_paths(font_path, text, wght, em_px, tracking_em):
    """Outline `text` with Pretendard at weight `wght`; returns (path_d, advance_width_px, cap_height_px)."""
    from fontTools.pens.svgPathPen import SVGPathPen
    from fontTools.pens.transformPen import TransformPen
    from fontTools.ttLib import TTFont
    from fontTools.varLib import instancer

    font = instancer.instantiateVariableFont(TTFont(font_path), {"wght": wght}, inplace=False)
    gs, cmap, hmtx = font.getGlyphSet(), font.getBestCmap(), font["hmtx"]
    upm = font["head"].unitsPerEm
    scale = em_px / upm
    cap = getattr(font["OS/2"], "sCapHeight", 0.7 * upm) * scale

    # kerning from the GPOS 'kern' feature (pair adjustment lookups only)
    kern_lookups = set()
    if "GPOS" in font:
        gpos = font["GPOS"].table
        for fr in gpos.FeatureList.FeatureRecord:
            if fr.FeatureTag == "kern":
                kern_lookups.update(fr.Feature.LookupListIndex)

    def kern(a, b):
        if "GPOS" not in font:
            return 0
        total = 0
        for idx in kern_lookups:
            lookup = font["GPOS"].table.LookupList.Lookup[idx]
            for st in lookup.SubTable:
                ltype = lookup.LookupType
                if ltype == 9:
                    ltype, st = st.ExtensionLookupType, st.ExtSubTable
                if ltype != 2 or a not in st.Coverage.glyphs:
                    continue
                if st.Format == 1:
                    ps = st.PairSet[st.Coverage.glyphs.index(a)]
                    for rec in ps.PairValueRecord:
                        if rec.SecondGlyph == b:
                            total += getattr(rec.Value1, "XAdvance", 0) or 0
                else:
                    c1 = st.ClassDef1.classDefs.get(a, 0)
                    c2 = st.ClassDef2.classDefs.get(b, 0)
                    total += getattr(st.Class1Record[c1].Class2Record[c2].Value1, "XAdvance", 0) or 0
                break  # first subtable that covers the glyph wins within a lookup
        return total

    x = 0.0
    d = []
    prev = None
    for ch in text:
        g = cmap[ord(ch)]
        if prev:
            x += kern(prev, g) * scale
        pen = SVGPathPen(gs, ntos=lambda v: f"{v:.2f}".rstrip("0").rstrip("."))
        gs[g].draw(TransformPen(pen, (scale, 0, 0, -scale, x, 0)))
        d.append(pen.getCommands())
        x += hmtx[g][0] * scale + tracking_em * em_px
        prev = g
    return " ".join(p for p in d if p), x - tracking_em * em_px, cap


def svg_lockup(font_path, text_color):
    em = 40
    d, width, cap = wordmark_paths(font_path, "Brilliant Tiger", 800, em, -0.025)
    badge, gap = 56, 16
    h = badge
    baseline = badge / 2 + cap / 2
    w = badge + gap + width + 2
    icon_inner = head_svg()
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {fmt(w)} {h}" role="img" aria-label="Brilliant Tiger">\n'
        f'  <g transform="scale({badge / 128})">\n  <rect width="128" height="128" rx="26" fill="{INK}"/>\n'
        f'  <g transform="translate(64 64) scale(.78) translate(-64 -64)">\n  {icon_inner}\n  </g>\n  </g>\n'
        f'  <path transform="translate({badge + gap} {fmt(baseline)})" d="{d}" fill="{text_color}"/>\n</svg>\n'
    )


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default="public", help="output root (default: public)")
    ap.add_argument("--font", help="PretendardVariable.ttf, needed for the horizontal lockups")
    a = ap.parse_args()
    out = pathlib.Path(a.out)
    logo = out / "assets" / "logo"
    logo.mkdir(parents=True, exist_ok=True)

    (logo / "logo-mark.svg").write_text(svg_mark())
    (logo / "logo-icon.svg").write_text(svg_icon())
    (out / "favicon.svg").write_text(svg_icon())
    if a.font:
        (logo / "logo-horizontal.svg").write_text(svg_lockup(a.font, INK))
        (logo / "logo-horizontal-light.svg").write_text(svg_lockup(a.font, PAPER))

    render_mark(1024).save(logo / "logo-mark-1024.png", optimize=True)
    for n in (192, 512):
        render_icon(n).save(logo / f"logo-icon-{n}.png", optimize=True)
    render_icon(180, scale=0.74, rounded=False).convert("RGB").save(out / "apple-touch-icon.png", optimize=True)
    render_icon(256).save(out / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)])
    print("wrote", logo)


if __name__ == "__main__":
    main()
