#!/usr/bin/env python3
"""Generate Prompt Stash brand raster assets.

Renders the same geometry as public/favicon.svg into:
  - scripts/icon-1024.png   (1024x1024 master icon for `tauri icon`)
  - public/og-image.png     (1200x630 Open Graph image)

Pure PIL + numpy; supersampled 2x then downscaled for clean edges.
"""

import re
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
SS = 2  # supersampling factor

# Palette (matches favicon.svg)
TILE_TOP = (23, 27, 40)
TILE_BOTTOM = (11, 13, 21)
BRACE_TOP = (139, 150, 255)
BRACE_BOTTOM = (101, 112, 240)
DOT = (174, 182, 255)

# Path data copied from public/favicon.svg (64x64 design space)
LEFT_BRACE = "M24.5 15c-4.6 0-6.8 2.4-6.8 6.4 0 2.9.9 4.6 3.3 6.3 1.2.85 1.2 2.35 0 3.2-2.4 1.7-3.3 3.4-3.3 6.3 0 4 2.2 6.4 6.8 6.4"
RIGHT_BRACE = "M39.5 15c4.6 0 6.8 2.4 6.8 6.4 0 2.9-.9 4.6-3.3 6.3-1.2.85-1.2 2.35 0 3.2 2.4 1.7 3.3 3.4 3.3 6.3 0 4-2.2 6.4-6.8 6.4"
STROKE_WIDTH = 3.6
DOT_R = 3.4
CENTER = (32, 32)


def tokenize_numbers(s: str):
    return [float(m) for m in re.findall(r"-?\d*\.?\d+(?:[eE][-+]?\d+)?", s)]


def parse_path(path: str):
    """Parse the fixed 'M x y c ...' brace path into sampled points."""
    nums = tokenize_numbers(path)
    x, y = nums[0], nums[1]
    rest = nums[2:]
    points = [(x, y)]
    for i in range(0, len(rest), 6):
        c1x, c1y, c2x, c2y, ex, ey = rest[i : i + 6]
        p0, p1, p2, p3 = (
            (x, y),
            (x + c1x, y + c1y),
            (x + c2x, y + c2y),
            (x + ex, y + ey),
        )
        for step in range(1, 49):
            t = step / 48
            u = 1 - t
            bx = u**3 * p0[0] + 3 * u**2 * t * p1[0] + 3 * u * t**2 * p2[0] + t**3 * p3[0]
            by = u**3 * p0[1] + 3 * u**2 * t * p1[1] + 3 * u * t**2 * p2[1] + t**3 * p3[1]
            points.append((bx, by))
        x, y = x + ex, y + ey
    return points


def vertical_gradient(size, top, bottom):
    h, w = size[1], size[0]
    t = np.linspace(0, 1, h, dtype=np.float32)[:, None, None]
    top_arr = np.array(top, dtype=np.float32)[None, None, :]
    bot_arr = np.array(bottom, dtype=np.float32)[None, None, :]
    grad = (t * bot_arr + (1 - t) * top_arr).astype(np.uint8)
    return np.repeat(grad, w, axis=1)


def stamp_polyline(draw, points, radius, scale, color_fn):
    """Draw a smooth stroke by stamping filled circles along the path."""
    prev = None
    for px, py in points:
        cx, cy = px * scale, py * scale
        if prev is not None:
            # interpolate between samples so fast curves stay solid
            steps = max(1, int(np.hypot(cx - prev[0], cy - prev[1]) / (radius * 0.4)))
            for k in range(1, steps + 1):
                ix = prev[0] + (cx - prev[0]) * k / steps
                iy = prev[1] + (cy - prev[1]) * k / steps
                draw.ellipse(
                    [ix - radius, iy - radius, ix + radius, iy + radius],
                    fill=color_fn(iy),
                )
        else:
            draw.ellipse(
                [cx - radius, cy - radius, cx + radius, cy + radius],
                fill=color_fn(cy),
            )
        prev = (cx, cy)


def lerp_color(y, height):
    t = max(0.0, min(1.0, y / height))
    return tuple(int(BRACE_TOP[i] + (BRACE_BOTTOM[i] - BRACE_TOP[i]) * t) for i in range(3)) + (255,)


def render_master(size=1024):
    s = SS
    S = size * s
    scale = S / 64.0

    tile = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    grad = vertical_gradient((S, S), TILE_TOP, TILE_BOTTOM)
    tile_bg = Image.fromarray(np.concatenate([grad, np.full((S, S, 1), 255, np.uint8)], axis=2))

    mask = Image.new("L", (S, S), 0)
    radius = 14 / 64 * S
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, S - 1, S - 1], radius=radius, fill=255)
    tile.paste(tile_bg, (0, 0), mask)

    draw = ImageDraw.Draw(tile)

    # subtle inner border
    border = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    bd = ImageDraw.Draw(border)
    bd.rounded_rectangle(
        [1.5 * s, 1.5 * s, S - 1.5 * s, S - 1.5 * s],
        radius=radius - 1.5 * s,
        outline=(255, 255, 255, 24),
        width=int(1.5 * s),
    )
    tile = Image.alpha_composite(tile, border)
    draw = ImageDraw.Draw(tile)

    r = STROKE_WIDTH / 2 * scale
    stamp_polyline(draw, parse_path(LEFT_BRACE), r, scale, lambda y: lerp_color(y, S))
    stamp_polyline(draw, parse_path(RIGHT_BRACE), r, scale, lambda y: lerp_color(y, S))

    dcx, dcy = CENTER[0] * scale, CENTER[1] * scale
    dr = DOT_R * scale
    draw.ellipse([dcx - dr, dcy - dr, dcx + dr, dcy + dr], fill=DOT + (255,))

    # soft glow behind the dot
    glow = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gr = dr * 2.4
    gd.ellipse([dcx - gr, dcy - gr, dcx + gr, dcy + gr], fill=(139, 150, 255, 36))
    glow = glow.filter(__import__("PIL.ImageFilter", fromlist=["ImageFilter"]).GaussianBlur(6 * s))
    tile = Image.alpha_composite(tile, glow)

    # re-mask after compositing
    out = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    out.paste(tile, (0, 0), mask)
    return out.resize((size, size), Image.LANCZOS)


def render_og():
    w, h = 1200, 630
    s = 2
    W, H = w * s, h * s
    grad = vertical_gradient((W, H), (10, 12, 18), (14, 17, 26))
    img = Image.fromarray(np.concatenate([grad, np.full((H, W, 1), 255, np.uint8)], axis=2))
    draw = ImageDraw.Draw(img)

    # faint grid
    grid_color = (255, 255, 255, 9)
    step = 44 * s
    for x in range(0, W, step):
        draw.line([(x, 0), (x, H)], fill=grid_color, width=s)
    for y in range(0, H, step):
        draw.line([(0, y), (W, y)], fill=grid_color, width=s)

    # accent glow
    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    cx, cy = W // 2, int(H * 0.16)
    rr = int(W * 0.42)
    gd.ellipse([cx - rr, cy - rr, cx + rr, cy + rr], fill=(101, 112, 240, 26))
    glow = glow.filter(__import__("PIL.ImageFilter", fromlist=["ImageFilter"]).GaussianBlur(60 * s))
    img = Image.alpha_composite(img.convert("RGBA"), glow)
    draw = ImageDraw.Draw(img)

    # icon mark
    mark = render_master(160).resize((160 * s, 160 * s), Image.LANCZOS)
    img.paste(mark, (80 * s, (H - 160 * s) // 2), mark)

    # wordmark + tagline
    font_path_bold = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
    font_path_reg = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
    name_font = ImageFont.truetype(font_path_bold, 66 * s)
    tag_font = ImageFont.truetype(font_path_reg, 26 * s)
    eyebrow_font = ImageFont.truetype(font_path_reg, 17 * s)

    tx = 280 * s
    ty = H // 2 - 90 * s
    draw.text((tx, ty), "PROMPT STASH", font=eyebrow_font, fill=(139, 150, 255, 255))
    draw.text((tx, ty + 30 * s), "Prompt Stash", font=name_font, fill=(245, 246, 250, 255))
    draw.text((tx, ty + 118 * s), "Your prompts, organized.", font=tag_font, fill=(160, 165, 185, 255))

    return img.resize((w, h), Image.LANCZOS).convert("RGB")


def main():
    scripts_dir = ROOT / "scripts"
    master = render_master(1024)
    master.save(scripts_dir / "icon-1024.png")
    print("wrote", scripts_dir / "icon-1024.png")

    og = render_og()
    og.save(ROOT / "public" / "og-image.png")
    print("wrote", ROOT / "public" / "og-image.png")

    # favicon fallback PNG (SVG is primary)
    render_master(256).save(ROOT / "public" / "icon-256.png")
    print("wrote", ROOT / "public" / "icon-256.png")


if __name__ == "__main__":
    main()
