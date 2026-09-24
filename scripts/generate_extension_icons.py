#!/usr/bin/env python3
"""Generate crisp, non-AI vector logo and multi-resolution PNG icons for Prompt Stash.

Renders:
  - extension/icons/icon16.png
  - extension/icons/icon32.png
  - extension/icons/icon48.png
  - extension/icons/icon128.png
  - public/icon-256.png
  - scripts/icon-1024.png
  - public/favicon.svg
"""

import math
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent

# Vibrant, professional palette
BG_TOP = (24, 28, 46)        # #181C2E
BG_BOT = (10, 12, 22)        # #0A0C16
STROKE_BORDER = (255, 255, 255, 30)

# Chevron gradient: Electric Indigo to Vivid Violet
CHEVRON_START = (168, 85, 247)  # #A855F7 (Purple 500)
CHEVRON_MID   = (99, 102, 241)  # #6366F1 (Indigo 500)
CHEVRON_END   = (56, 189, 248)  # #38BDF8 (Sky 400)

CURSOR_COLOR = (99, 102, 241)   # #6366F1
SPARK_COLOR  = (56, 189, 248)   # #38BDF8 (Vibrant cyan)

SVG_CONTENT = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <defs>
    <linearGradient id="ps-bg" x1="8" y1="4" x2="56" y2="60" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#181c2e"/>
      <stop offset="100%" stop-color="#0a0c16"/>
    </linearGradient>
    <linearGradient id="ps-chevron" x1="18" y1="20" x2="38" y2="44" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#a855f7"/>
      <stop offset="50%" stop-color="#6366f1"/>
      <stop offset="100%" stop-color="#38bdf8"/>
    </linearGradient>
    <linearGradient id="ps-tray" x1="34" y1="44" x2="48" y2="44" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#6366f1"/>
      <stop offset="100%" stop-color="#38bdf8"/>
    </linearGradient>
    <filter id="ps-glow" x="24" y="6" width="34" height="34" filterUnits="userSpaceOnUse">
      <feGaussianBlur stdDeviation="3" result="blur"/>
    </filter>
  </defs>

  <!-- Squircle Base -->
  <rect x="2" y="2" width="60" height="60" rx="15" fill="url(#ps-bg)"/>
  <rect x="2.75" y="2.75" width="58.5" height="58.5" rx="14.25" stroke="#ffffff" stroke-opacity="0.12" stroke-width="1.5"/>

  <!-- Subtle stash stack backplate -->
  <rect x="14" y="14" width="36" height="36" rx="8" fill="#ffffff" fill-opacity="0.03" stroke="#ffffff" stroke-opacity="0.05" stroke-width="1"/>

  <!-- Ambient Glow behind spark -->
  <circle cx="43" cy="21" r="7" fill="#38bdf8" fill-opacity="0.25" filter="url(#ps-glow)"/>

  <!-- Prompt Chevron > -->
  <path d="M21 20L34 32L21 44" stroke="url(#ps-chevron)" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>

  <!-- Stash Cursor / Underline _ -->
  <path d="M37 44H47" stroke="url(#ps-tray)" stroke-width="5" stroke-linecap="round"/>

  <!-- Spark Star (Variable / AI Spark) -->
  <path d="M43 14C43 19 45 21 50 21C45 21 43 23 43 28C43 23 41 21 36 21C41 21 43 19 43 14Z" fill="#38bdf8"/>
  <circle cx="43" cy="21" r="1.5" fill="#ffffff"/>
</svg>
'''


def render_icon(target_size, solid_bg=False):
    """Render high-quality supersampled raster icon."""
    scale = 4  # 4x supersampling for ultra sharp antialiasing
    canvas_size = target_size * scale
    
    # Base 64x64 coordinate multiplier
    s = canvas_size / 64.0
    
    # Image canvas
    img = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    
    # 1. Background gradient
    grad = np.zeros((canvas_size, canvas_size, 4), dtype=np.uint8)
    for y in range(canvas_size):
        t = y / (canvas_size - 1)
        r = int(BG_TOP[0] * (1 - t) + BG_BOT[0] * t)
        g = int(BG_TOP[1] * (1 - t) + BG_BOT[1] * t)
        b = int(BG_TOP[2] * (1 - t) + BG_BOT[2] * t)
        grad[y, :] = [r, g, b, 255]
    
    bg_img = Image.fromarray(grad, mode="RGBA")
    
    if solid_bg:
        img.paste(bg_img, (0, 0))
    else:
        # Rounded mask for standalone transparent icons
        mask = Image.new("L", (canvas_size, canvas_size), 0)
        corner_radius = int(15 * s)
        margin = int(2 * s)
        ImageDraw.Draw(mask).rounded_rectangle(
            [margin, margin, canvas_size - margin - 1, canvas_size - margin - 1],
            radius=corner_radius,
            fill=255
        )
        img.paste(bg_img, (0, 0), mask)
        
        draw = ImageDraw.Draw(img)
        border_w = max(1, int(1.5 * s))
        draw.rounded_rectangle(
            [margin, margin, canvas_size - margin - 1, canvas_size - margin - 1],
            radius=corner_radius,
            outline=STROKE_BORDER,
            width=border_w
        )
    
    # 3. Ambient Glow behind spark
    glow = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow)
    sp_cx, sp_cy = int(43 * s), int(21 * s)
    glow_r = int(12 * s)
    glow_draw.ellipse(
        [sp_cx - glow_r, sp_cy - glow_r, sp_cx + glow_r, sp_cy + glow_r],
        fill=(56, 189, 248, 70)
    )
    glow = glow.filter(ImageFilter.GaussianBlur(int(4 * s)))
    img = Image.alpha_composite(img, glow)
    draw = ImageDraw.Draw(img)
    
    # 4. Subtle inner plate
    plate_x0, plate_y0 = int(14 * s), int(14 * s)
    plate_x1, plate_y1 = int(50 * s), int(50 * s)
    draw.rounded_rectangle(
        [plate_x0, plate_y0, plate_x1, plate_y1],
        radius=int(8 * s),
        fill=(255, 255, 255, 8),
        outline=(255, 255, 255, 14),
        width=max(1, int(1 * s))
    )
    
    # 5. Prompt Chevron >
    # Points: (21, 20) -> (34, 32) -> (21, 44)
    stroke_w = max(2, int(5.2 * s))
    
    def lerp_color(t):
        if t < 0.5:
            f = t / 0.5
            r = int(CHEVRON_START[0] * (1 - f) + CHEVRON_MID[0] * f)
            g = int(CHEVRON_START[1] * (1 - f) + CHEVRON_MID[1] * f)
            b = int(CHEVRON_START[2] * (1 - f) + CHEVRON_MID[2] * f)
        else:
            f = (t - 0.5) / 0.5
            r = int(CHEVRON_MID[0] * (1 - f) + CHEVRON_END[0] * f)
            g = int(CHEVRON_MID[1] * (1 - f) + CHEVRON_END[1] * f)
            b = int(CHEVRON_MID[2] * (1 - f) + CHEVRON_END[2] * f)
        return (r, g, b, 255)
    
    # Draw chevron by stamping along segment with gradient
    pts_segment1 = [(21 * s + (34 - 21) * s * t, 20 * s + (32 - 20) * s * t, t * 0.5) for t in np.linspace(0, 1, 60)]
    pts_segment2 = [(34 * s + (21 - 34) * s * t, 32 * s + (44 - 32) * s * t, 0.5 + t * 0.5) for t in np.linspace(0, 1, 60)]
    
    rad = stroke_w / 2.0
    for x, y, t in pts_segment1 + pts_segment2:
        c = lerp_color(t)
        draw.ellipse([x - rad, y - rad, x + rad, y + rad], fill=c)
    
    # 6. Cursor / Tray Underline
    # (37, 44) to (47, 44)
    cur_rad = stroke_w / 2.0
    for t in np.linspace(0, 1, 30):
        x = 37 * s + (47 - 37) * s * t
        y = 44 * s
        col = (
            int(CURSOR_COLOR[0] * (1 - t) + SPARK_COLOR[0] * t),
            int(CURSOR_COLOR[1] * (1 - t) + SPARK_COLOR[1] * t),
            int(CURSOR_COLOR[2] * (1 - t) + SPARK_COLOR[2] * t),
            255
        )
        draw.ellipse([x - cur_rad, y - cur_rad, x + cur_rad, y + cur_rad], fill=col)
        
    # 7. Spark Star at (43, 21)
    sp_arm_h = 7 * s
    sp_arm_w = 7 * s
    spark_points = []
    # 4-point star polygon via curved bezier or multi-point approximation
    for angle_deg in range(0, 360, 5):
        rad_angle = math.radians(angle_deg)
        cos_t = math.cos(rad_angle)
        sin_t = math.sin(rad_angle)
        px = sp_cx + (math.copysign(abs(cos_t)**3, cos_t)) * sp_arm_w
        py = sp_cy + (math.copysign(abs(sin_t)**3, sin_t)) * sp_arm_h
        spark_points.append((px, py))
        
    draw.polygon(spark_points, fill=SPARK_COLOR + (255,))
    center_dot_r = max(1.0, 1.6 * s)
    draw.ellipse(
        [sp_cx - center_dot_r, sp_cy - center_dot_r, sp_cx + center_dot_r, sp_cy + center_dot_r],
        fill=(255, 255, 255, 255)
    )
    
    # Downsample cleanly with Lanczos filter
    final_img = img.resize((target_size, target_size), Image.LANCZOS)
    return final_img


def main():
    print("Generating vector SVG and multi-resolution PNG icons...")
    
    # 1. Save SVG
    fav_svg = ROOT / "public" / "favicon.svg"
    fav_svg.write_text(SVG_CONTENT, encoding="utf-8")
    print(f"Saved: {fav_svg}")
    
    # 2. Chrome Extension Icons
    ext_icons_dir = ROOT / "extension" / "icons"
    ext_icons_dir.mkdir(parents=True, exist_ok=True)
    
    for sz in [16, 32, 48, 128]:
        out_path = ext_icons_dir / f"icon{sz}.png"
        img = render_icon(sz)
        img.save(out_path, format="PNG")
        print(f"Saved: {out_path} ({sz}x{sz})")
        
    # 3. Public icons, Apple Touch Icon, and PWA assets
    pub_dir = ROOT / "public"
    
    # Apple Touch Icon (180x180 with solid background for iOS/macOS Safari)
    apple_icon = render_icon(180, solid_bg=True)
    apple_icon.save(pub_dir / "apple-touch-icon.png", format="PNG")
    apple_icon.save(pub_dir / "apple-touch-icon-precomposed.png", format="PNG")
    print("Saved: public/apple-touch-icon.png (180x180 solid for Safari)")
    print("Saved: public/apple-touch-icon-precomposed.png (180x180 solid for Safari)")
    
    # Standard PWA Icons (192x192, 512x512)
    icon192 = render_icon(192, solid_bg=True)
    icon192.save(pub_dir / "icon-192.png", format="PNG")
    print("Saved: public/icon-192.png (192x192 for PWA)")
    
    icon512 = render_icon(512, solid_bg=True)
    icon512.save(pub_dir / "icon-512.png", format="PNG")
    print("Saved: public/icon-512.png (512x512 for PWA)")

    p256 = pub_dir / "icon-256.png"
    img256 = render_icon(256)
    img256.save(p256, format="PNG")
    print(f"Saved: {p256} (256x256)")
    
    p1024 = ROOT / "scripts" / "icon-1024.png"
    img1024 = render_icon(1024)
    img1024.save(p1024, format="PNG")
    print(f"Saved: {p1024} (1024x1024)")
    
    print("All icons generated successfully!")


if __name__ == "__main__":
    main()
