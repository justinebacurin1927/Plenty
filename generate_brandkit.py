#!/usr/bin/env python3
"""
Plenty Brand-Kit Board Generator
Generates a premium 3x3 brand-kit image for the Plenty water reminder mascot.
"""

from PIL import Image, ImageDraw, ImageFont, ImageFilter
import math
import os

# ── Constants ──────────────────────────────────────────────────────────────

W, H = 3960, 2970  # 4:3 canvas
MARGIN = 45
GUTTER = 45
PANEL_W = (W - 2 * MARGIN - 2 * GUTTER) // 3  # 1260
PANEL_H = (H - 2 * MARGIN - 2 * GUTTER) // 3  # 930
CORNER_RADIUS = 18

# Colors
BG = (18, 18, 20)          # Dark charcoal canvas
PANEL_BG = (24, 24, 28)    # Panel surface
PANEL_BORDER = (38, 38, 44) # Subtle panel border
PRIMARY_BLUE = (74, 144, 217)     # #4A90D9
PRIMARY_BLUE_RGB = (74, 144, 217)
TEAL = (68, 195, 205)            # Gentle teal accent
CORAL = (255, 140, 120)          # Warm coral/orange
WARM_WHITE = (242, 240, 236)     # Warm white
LIGHT_BLUE = (160, 202, 240)     # Light blue
DARK_BLUE = (35, 75, 145)        # Darker blue
SOFT_BLUE = (210, 228, 245)      # Very soft blue
MID_BLUE = (55, 115, 185)        # Middle blue
GOLD = (245, 195, 120)           # Subtle gold accent

# Panel positions [(x, y), ...] row-major
def panel_rect(index):
    col = index % 3
    row = index // 3
    x = MARGIN + col * (PANEL_W + GUTTER)
    y = MARGIN + row * (PANEL_H + GUTTER)
    return (x, y, x + PANEL_W, y + PANEL_H)

def panel_origin(index):
    col = index % 3
    row = index // 3
    x = MARGIN + col * (PANEL_W + GUTTER)
    y = MARGIN + row * (PANEL_H + GUTTER)
    return (x, y)

# ── Font Loading ──────────────────────────────────────────────────────────

FONT_DIR = "/usr/share/fonts/truetype/noto/"

def load_font(name, size):
    path = os.path.join(FONT_DIR, name)
    try:
        return ImageFont.truetype(path, size)
    except Exception:
        return ImageFont.load_default()

FONT_LIGHT = lambda s: load_font("NotoSans-Light.ttf", s)
FONT_REG = lambda s: load_font("NotoSans-Regular.ttf", s)
FONT_MED = lambda s: load_font("NotoSans-Medium.ttf", s)
FONT_SB = lambda s: load_font("NotoSans-SemiBold.ttf", s)
FONT_BOLD = lambda s: load_font("NotoSans-Bold.ttf", s)
FONT_SERIF_BOLD = lambda s: load_font("NotoSerif-Bold.ttf", s)

# Fallback
for fn in ["NotoSans-Light.ttf", "NotoSans-Regular.ttf", "NotoSans-Medium.ttf",
           "NotoSans-SemiBold.ttf", "NotoSans-Bold.ttf", "NotoSerif-Bold.ttf"]:
    if not os.path.exists(os.path.join(FONT_DIR, fn)):
        print(f"Warning: {fn} not found")

print(f"Using fonts from {FONT_DIR}")

# ── Drawing Helpers ───────────────────────────────────────────────────────

def rounded_rect(draw, xy, radius, fill=None, outline=None, width=1):
    """Draw a rounded rectangle."""
    x1, y1, x2, y2 = xy
    radius = min(radius, (x2 - x1) // 2, (y2 - y1) // 2)
    draw.rounded_rectangle(xy, radius, fill=fill, outline=outline, width=width)

def draw_droplet_shape(draw, cx, cy, r, fill, outline=None, outline_width=0, stretch=1.3):
    """Draw a teardrop/droplet shape using parametric formula.
    Bottom is rounded (circular), top tapers to a point.
    stretch > 1 makes more pronounced teardrop shape.
    """
    n = 80
    pts = []
    for i in range(n):
        t = 2 * math.pi * i / n
        sx = cx + r * math.sin(t)
        # stretch factor: max at top (t=pi), 0 at bottom (t=0, t=2pi)
        sf = (1 - math.cos(t)) / 2  # 0 to 1
        sy = cy + r * (math.cos(t) + stretch * sf)
        pts.append((sx, sy))
    draw.polygon(pts, fill=fill)
    if outline and outline_width > 0:
        draw.polygon(pts, outline=outline, width=outline_width)

def draw_droplet_highlight(draw, cx, cy, r, stretch=1.3):
    """Draw a glossy highlight on the droplet."""
    # Small white ellipse highlight on upper-left area
    hx = cx - r * 0.35
    hy = cy - r * 0.3
    hrx = r * 0.2
    hry = r * 0.12
    draw.ellipse([hx - hrx, hy - hry, hx + hrx, hy + hry],
                 fill=(255, 255, 255, 60) if hasattr(draw, 'alpha') else (255, 255, 255))

def draw_droplet_blush(draw, cx, cy, r):
    """Draw blush marks on the droplet."""
    for side in [-1, 1]:
        bx = cx + side * r * 0.5
        by = cy + r * 0.22
        draw.ellipse([bx - r * 0.15, by - r * 0.08, bx + r * 0.15, by + r * 0.08],
                     fill=(255, 180, 170, 80))

def draw_eye(draw, cx, cy, r, open_frac=1.0, sparkle=False, squint=False):
    """Draw an eye. open_frac: 1=open, 0.5=half, 0.2=closed/sleepy"""
    wr = r * 0.2  # eye width radius
    hr = r * 0.25 * open_frac  # eye height radius (scaled for open/closed)

    if squint and open_frac < 0.6:
        # Squint: draw a curved line
        draw.arc([cx - wr, cy - hr, cx + wr, cy + hr], 180, 360,
                 fill=(40, 40, 50), width=max(2, int(r * 0.06)))
    elif open_frac < 0.3:
        # Closed: horizontal line
        draw.line([cx - wr, cy, cx + wr, cy], fill=(40, 40, 50), width=max(2, int(r * 0.06)))
    else:
        # Open eye: white oval + pupil
        draw.ellipse([cx - wr, cy - hr, cx + wr, cy + hr], fill=(255, 255, 255))
        pupil_r = wr * 0.6
        draw.ellipse([cx - pupil_r, cy - pupil_r * 0.9,
                      cx + pupil_r, cy + pupil_r * 0.9], fill=(30, 35, 50))
        # Pupil highlight
        hl_r = pupil_r * 0.35
        draw.ellipse([cx + pupil_r * 0.2 - hl_r, cy - pupil_r * 0.4 - hl_r,
                      cx + pupil_r * 0.2 + hl_r, cy - pupil_r * 0.4 + hl_r],
                     fill=(255, 255, 255))
        if sparkle:
            # Star/sparkle effect - two extra highlights
            sx = cx - pupil_r * 0.1
            sy = cy + pupil_r * 0.3
            sr = hl_r * 0.6
            draw.ellipse([sx - sr, sy - sr, sx + sr, sy + sr], fill=(255, 255, 255))

def draw_mouth(draw, cx, cy, r, expression="smile"):
    """Draw mouth based on expression."""
    mw = r * 0.25
    mh = r * 0.15
    if expression == "smile":
        # Happy curved smile
        draw.arc([cx - mw, cy - mh, cx + mw, cy + mh], 0, 180,
                 fill=(40, 40, 50), width=max(2, int(r * 0.05)))
    elif expression == "big_smile":
        # Bigger, wider smile
        draw.arc([cx - mw * 1.3, cy - mh * 0.8, cx + mw * 1.3, cy + mh * 1.2], 10, 170,
                 fill=(40, 40, 50), width=max(3, int(r * 0.07)))
    elif expression == "open":
        # Open mouth (oval) - excited
        draw.ellipse([cx - mw * 0.8, cy, cx + mw * 0.8, cy + mh * 1.5],
                     fill=(40, 40, 50))
    elif expression == "gentle":
        # Gentle, soft smile
        draw.arc([cx - mw * 0.8, cy + mh * 0.3, cx + mw * 0.8, cy + mh * 1.5], 0, 180,
                 fill=(40, 40, 50), width=max(2, int(r * 0.05)))
    elif expression == "yawn":
        # Sleepy yawn
        draw.ellipse([cx - mw * 0.7, cy + mh * 0.2, cx + mw * 0.7, cy + mh * 1.3],
                     fill=(40, 40, 50))
    elif expression == "o":
        # Surprised "O" mouth
        draw.ellipse([cx - mw * 0.6, cy - mh * 0.4, cx + mw * 0.6, cy + mh * 0.8],
                     fill=(40, 40, 50))

def draw_droplet(draw, cx, cy, r, fill=PRIMARY_BLUE, expression="smile",
                 stretch=1.3, highlight=True, blush=True, eye_open=1.0,
                 sparkle=False, squint=False, outline=None, outline_width=0,
                 second_color=None):
    """Draw a complete water droplet character."""
    # Main droplet body
    if second_color:
        # Gradient-like effect: draw a slightly offset body
        draw_droplet_shape(draw, cx + r * 0.06, cy + r * 0.06, r,
                          fill=second_color, outline=outline, outline_width=outline_width,
                          stretch=stretch)
    draw_droplet_shape(draw, cx, cy, r, fill=fill,
                       outline=outline, outline_width=outline_width, stretch=stretch)

    # Highlight (glossy water effect)
    if highlight:
        draw_droplet_highlight(draw, cx, cy, r, stretch)

    # Blush
    if blush:
        draw_droplet_blush(draw, cx, cy, r)

    # Eyes
    eye_y = cy - r * 0.08
    eye_spacing = r * 0.25
    draw_eye(draw, cx - eye_spacing, eye_y, r * 0.55, open_frac=eye_open,
             sparkle=sparkle, squint=squint)
    draw_eye(draw, cx + eye_spacing, eye_y, r * 0.55, open_frac=eye_open,
             sparkle=sparkle, squint=squint)

    # Eyebrows
    brow_y = cy - r * 0.35
    for side in [-1, 1]:
        bx = cx + side * eye_spacing
        if expression == "sleepy":
            # Droopy eyebrows
            draw.arc([bx - r * 0.15, brow_y + r * 0.05, bx + r * 0.15, brow_y + r * 0.2],
                     190 if side < 0 else 350, 350 if side < 0 else 170,
                     fill=(40, 40, 50), width=2)
        elif expression == "excited" or sparkle:
            # Raised eyebrows
            draw.arc([bx - r * 0.15, brow_y - r * 0.15, bx + r * 0.15, brow_y],
                     0, 180, fill=(40, 40, 50), width=2)
        else:
            # Neutral eyebrows
            draw.arc([bx - r * 0.15, brow_y, bx + r * 0.15, brow_y + r * 0.1],
                     0, 180, fill=(40, 40, 50), width=2)

    # Mouth
    expr_map = {
        "happy": "smile",
        "excited": "big_smile",
        "reminding": "gentle",
        "sleepy": "yawn",
        "smile": "smile",
        "big_smile": "big_smile",
        "open": "open",
        "gentle": "gentle",
    }
    mouth_expr = expr_map.get(expression, "smile")

    if expression == "excited":
        draw_mouth(draw, cx, cy + r * 0.12, r, "open")
        draw_mouth(draw, cx, cy + r * 0.05, r, "big_smile")
    elif expression == "sleepy":
        draw_mouth(draw, cx, cy + r * 0.18, r, "yawn")
    elif expression == "reminding":
        draw_mouth(draw, cx, cy + r * 0.1, r, "gentle")
    else:
        draw_mouth(draw, cx, cy + r * 0.05, r, mouth_expr)


def draw_simple_droplet_icon(draw, cx, cy, r, fill=PRIMARY_BLUE):
    """Draw a simplified droplet icon (no face, just the shape)."""
    n = 50
    pts = []
    stretch = 1.25
    for i in range(n):
        t = 2 * math.pi * i / n
        sx = cx + r * math.sin(t)
        sf = (1 - math.cos(t)) / 2
        sy = cy + r * (math.cos(t) + stretch * sf)
        pts.append((sx, sy))
    draw.polygon(pts, fill=fill)

def draw_label(draw, x, y, text, font, fill=WARM_WHITE, anchor=None):
    """Draw text with optional anchor."""
    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    if anchor == "center":
        draw.text((x - tw // 2, y), text, font=font, fill=fill)
    elif anchor == "right":
        draw.text((x - tw, y), text, font=font, fill=fill)
    else:
        draw.text((x, y), text, font=font, fill=fill)
    return (tw, th)

def draw_centered_text(draw, cx, y, text, font, fill=WARM_WHITE):
    """Draw centered text at cx, y."""
    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    draw.text((cx - tw // 2, y), text, font=font, fill=fill)
    return (tw, th)

def draw_gradient_rect(draw, xy, color_top, color_bottom):
    """Draw a rectangle with vertical gradient."""
    x1, y1, x2, y2 = xy
    height = y2 - y1
    for i in range(height):
        t = i / height
        r = int(color_top[0] * (1 - t) + color_bottom[0] * t)
        g = int(color_top[1] * (1 - t) + color_bottom[1] * t)
        b = int(color_top[2] * (1 - t) + color_bottom[2] * t)
        draw.line([(x1, y1 + i), (x2, y1 + i)], fill=(r, g, b))

def draw_color_swatch(draw, cx, cy, color, label, r=55):
    """Draw a color swatch circle with hex label."""
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=color)
    # Subtle border
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], outline=(60, 60, 70), width=1)
    f = FONT_REG(22)
    draw_centered_text(draw, cx, cy + r + 30, label, f, fill=(160, 160, 165))

def draw_panel_label(draw, x, y, text, fill=(150, 150, 155)):
    """Draw a small label at the bottom of a panel."""
    f = FONT_REG(22)
    draw_centered_text(draw, x + PANEL_W // 2, y + PANEL_H - 38, text, f, fill=fill)

def draw_page_number(draw, x, y, num, fill=(100, 100, 110)):
    """Draw a page number in the corner."""
    f = FONT_LIGHT(18)
    draw.text((x + PANEL_W - 40, y + 15), f"{num:02d}", font=f, fill=fill)

# ── Panel Drawing Functions ───────────────────────────────────────────────

def panel_1_logo_cover(draw, px, py):
    """Panel 1: Logo cover with mascot and Plenty wordmark."""
    # Large droplet mascot
    cx, cy = px + PANEL_W // 2, py + PANEL_H // 2 - 80
    draw_droplet(draw, cx, cy - 15, 180, fill=PRIMARY_BLUE, expression="happy",
                 highlight=True, blush=True, second_color=TEAL)

    # "Plenty" wordmark
    f_logo = FONT_BOLD(100)
    draw_centered_text(draw, cx, cy + 195, "plenty", f_logo, fill=WARM_WHITE)

    # Subtitle
    f_sub = FONT_LIGHT(28)
    draw_centered_text(draw, cx, cy + 250, "water reminder", f_sub, fill=(160, 160, 165))

    draw_page_number(draw, px, py, 1)
    draw_panel_label(draw, px, py, "logo cover")

def panel_2_expressions(draw, px, py):
    """Panel 2: Mascot expressions - 4 moods."""
    w_inner = PANEL_W - 100
    gap = 30
    d_w = (w_inner - 3 * gap) // 4  # 4 droplets across

    expressions = [
        ("happy", "Happy"),
        ("excited", "Excited"),
        ("reminding", "Remind"),
        ("sleepy", "Sleepy"),
    ]

    start_x = px + (PANEL_W - (4 * d_w + 3 * gap)) // 2 + d_w // 2
    y_center = py + PANEL_H // 2 - 25
    r = d_w * 0.38

    for i, (expr, label) in enumerate(expressions):
        cx = start_x + i * (d_w + gap)
        draw_droplet(draw, cx, y_center, r, fill=PRIMARY_BLUE, expression=expr,
                     highlight=True, blush=(expr != "sleepy"))

        f_label = FONT_MED(24)
        draw_centered_text(draw, cx, y_center + r + 50, label, f_label, fill=(180, 180, 185))

    draw_page_number(draw, px, py, 2)
    draw_panel_label(draw, px, py, "mascot expressions")

def panel_3_digital(draw, px, py):
    """Panel 3: Digital application - app phone mockup."""
    # Phone frame
    phone_w, phone_h = 240, 480
    phone_x = px + (PANEL_W - phone_w) // 2
    phone_y = py + (PANEL_H - phone_h) // 2

    # Phone body
    rounded_rect(draw, (phone_x, phone_y, phone_x + phone_w, phone_y + phone_h),
                 30, fill=(18, 18, 22), outline=(50, 50, 55), width=2)

    # Top notch/island
    notch_w, notch_h = 80, 24
    notch_x = phone_x + (phone_w - notch_w) // 2
    rounded_rect(draw, (notch_x, phone_y + 15, notch_x + notch_w, notch_y := phone_y + 15 + notch_h),
                 12, fill=(10, 10, 12))

    # Status bar
    f_status = FONT_REG(16)
    draw.text((phone_x + 25, phone_y + 22), "9:41", font=f_status, fill=(180, 180, 185))

    # App header area
    header_y = phone_y + 55
    faded = (30, 32, 38)
    rounded_rect(draw, (phone_x + 5, header_y, phone_x + phone_w - 5, header_y + 60),
                 10, fill=faded)

    # Small mascot in header
    draw_droplet(draw, phone_x + 40, header_y + 30, 18, fill=PRIMARY_BLUE,
                 expression="happy", highlight=True, blush=True)

    f_app = FONT_MED(22)
    draw_centered_text(draw, phone_x + phone_w // 2 + 10, header_y + 18, "Plenty", f_app, fill=WARM_WHITE)

    # Notification card
    notif_y = header_y + 85
    rounded_rect(draw, (phone_x + 12, notif_y, phone_x + phone_w - 12, notif_y + 70),
                 12, fill=faded)
    # Notification mascot
    draw_droplet(draw, phone_x + 38, notif_y + 35, 14, fill=PRIMARY_BLUE,
                 expression="reminding", highlight=True, blush=False)
    f_notif = FONT_REG(18)
    draw_centered_text(draw, phone_x + phone_w // 2 + 5, notif_y + 22, "Time to drink!", f_notif, fill=WARM_WHITE)
    f_notif2 = FONT_LIGHT(16)
    draw_centered_text(draw, phone_x + phone_w // 2 + 5, notif_y + 44, "2 cups left today", f_notif2, fill=(140, 140, 145))

    # Water progress ring (simplified)
    prog_y = notif_y + 95
    prog_cx = phone_x + phone_w // 2
    prog_cy = prog_y + 35
    prog_r = 30
    # Background ring
    draw.ellipse([prog_cx - prog_r, prog_cy - prog_r,
                  prog_cx + prog_r, prog_cy + prog_r], outline=(50, 50, 55), width=4)
    # Progress arc (simplified as a filled arc)
    for angle in range(0, 240, 2):
        rad = math.radians(angle - 90)
        x = prog_cx + (prog_r - 3) * math.cos(rad)
        y = prog_cy + (prog_r - 3) * math.sin(rad)
        # Small dots along the arc
        draw.ellipse([x - 2, y - 2, x + 2, y + 2], fill=PRIMARY_BLUE)

    # Center text
    f_prog = FONT_SB(26)
    draw_centered_text(draw, prog_cx, prog_cy - 10, "3", f_prog, fill=WARM_WHITE)
    f_prog2 = FONT_REG(16)
    draw_centered_text(draw, prog_cx, prog_cy + 15, "cups", f_prog2, fill=(150, 150, 155))

    # Bottom nav dots
    nav_y = phone_y + phone_h - 30
    for i in range(4):
        dx = phone_x + phone_w // 2 - 30 + i * 20
        col = PRIMARY_BLUE if i == 0 else (60, 60, 70)
        draw.ellipse([dx - 3, nav_y - 3, dx + 3, nav_y + 3], fill=col)

    draw_page_number(draw, px, py, 3)
    draw_panel_label(draw, px, py, "digital application")

def panel_4_brand_essence(draw, px, py):
    """Panel 4: Brand essence with tagline."""
    cx = px + PANEL_W // 2
    cy = py + PANEL_H // 2

    # Tagline - large and prominent
    f_tagline = FONT_LIGHT(72)
    draw_centered_text(draw, cx, cy - 100, "Stay", f_tagline, fill=WARM_WHITE)
    draw_centered_text(draw, cx, cy - 20, "Hydrated", FONT_BOLD(82), fill=PRIMARY_BLUE)

    # Subtitle
    f_sub = FONT_LIGHT(28)
    draw_centered_text(draw, cx, cy + 50, "with Plenty", f_sub, fill=(160, 160, 165))

    # Small mascot
    draw_droplet(draw, cx, cy + 150, 45, fill=PRIMARY_BLUE, expression="happy",
                 highlight=True, blush=True)

    # Decorative wave lines
    wave_y = cy + 240
    for i in range(2):
        wy = wave_y + i * 12
        for x in range(cx - 60, cx + 61, 10):
            dx = x - cx
            h = int(4 * math.sin(dx * 0.05 + i * 1.5))
            if x % 3 == 0:
                draw.ellipse([x - 1.5, wy + h - 1.5, x + 1.5, wy + h + 1.5],
                            fill=PRIMARY_BLUE if i == 0 else TEAL)

    draw_page_number(draw, px, py, 4)
    draw_panel_label(draw, px, py, "brand essence")

def panel_5_color_system(draw, px, py):
    """Panel 5: Color system / palette."""
    colors = [
        (PRIMARY_BLUE, "#4A90D9", "Primary"),
        (MID_BLUE, "#3773B9", "Deep"),
        (TEAL, "#44C3CD", "Accent"),
        (CORAL, "#FF8C78", "Warmth"),
        (WARM_WHITE, "#F2F0EC", "Light"),
        (DARK_BLUE, "#234B91", "Dark"),
    ]

    swatch_r = 60
    total_w = len(colors) * (swatch_r * 2 + 5) - 5
    gap = 12
    set_w = len(colors) * (swatch_r * 2 + gap) - gap
    start_x = px + (PANEL_W - set_w) // 2 + swatch_r
    y_center = py + PANEL_H // 2 - 15

    for i, (color, hex_val, name) in enumerate(colors):
        cx = start_x + i * (swatch_r * 2 + gap)
        draw_color_swatch(draw, cx, y_center - 10, color, hex_val, r=swatch_r)
        f_name = FONT_REG(20)
        draw_centered_text(draw, cx, y_center + swatch_r + 60, name, f_name, fill=(140, 140, 145))

    # Gradient bar
    bar_y = y_center + swatch_r + 100
    bar_h = 10
    bar_w = PANEL_W - 120
    bar_x = px + (PANEL_W - bar_w) // 2
    for i in range(bar_w):
        t = i / bar_w
        if t < 0.33:
            lt = t / 0.33
            r = int(PRIMARY_BLUE[0] * (1 - lt) + TEAL[0] * lt)
            g = int(PRIMARY_BLUE[1] * (1 - lt) + TEAL[1] * lt)
            b = int(PRIMARY_BLUE[2] * (1 - lt) + TEAL[2] * lt)
        elif t < 0.66:
            lt = (t - 0.33) / 0.33
            r = int(TEAL[0] * (1 - lt) + CORAL[0] * lt)
            g = int(TEAL[1] * (1 - lt) + CORAL[1] * lt)
            b = int(TEAL[2] * (1 - lt) + CORAL[2] * lt)
        else:
            lt = (t - 0.66) / 0.34
            r = int(CORAL[0] * (1 - lt) + DARK_BLUE[0] * lt)
            g = int(CORAL[1] * (1 - lt) + DARK_BLUE[1] * lt)
            b = int(CORAL[2] * (1 - lt) + DARK_BLUE[2] * lt)
        draw.line([(bar_x + i, bar_y), (bar_x + i, bar_y + bar_h)], fill=(r, g, b))

    rounded_rect(draw, (bar_x, bar_y, bar_x + bar_w, bar_y + bar_h), 5,
                 fill=None, outline=(50, 50, 55), width=0)

    draw_page_number(draw, px, py, 5)
    draw_panel_label(draw, px, py, "color system")

def panel_6_construction(draw, px, py):
    """Panel 6: Mascot construction / geometric breakdown."""
    cx = px + PANEL_W // 2
    cy = py + PANEL_H // 2 - 15

    # Construction circles
    r_main = 110
    construction_color = (120, 200, 240)
    guide_color = (60, 160, 200)

    # Circle outline for body
    draw.ellipse([cx - r_main, cy - r_main, cx + r_main, cy + r_main],
                 outline=guide_color, width=2)

    # Top point construction lines
    # Vertical center line
    draw.line([(cx, cy - r_main - 30), (cx, cy + r_main + 10)], fill=guide_color, width=2)

    # Droplet outline (semi-transparent fill)
    draw_droplet_shape(draw, cx, cy, r_main, fill=(74, 144, 217, 30) if False else PRIMARY_BLUE,
                       outline=construction_color, outline_width=2)

    # Guide lines for eyes
    eye_y = cy - 10
    eye_sp = r_main * 0.25
    draw.line([(cx - eye_sp - 15, eye_y), (cx - eye_sp + 15, eye_y)], fill=guide_color, width=1)
    draw.line([(cx + eye_sp - 15, eye_y), (cx + eye_sp + 15, eye_y)], fill=guide_color, width=1)

    # Horizontal guide below
    draw.line([(cx - r_main - 10, cy + 10), (cx + r_main + 10, cy + 10)], fill=guide_color, width=1)

    # Dimension arcs
    # Golden ratio marking
    draw.arc([cx - r_main * 1.2, cy - r_main * 0.8, cx + r_main * 1.2, cy + r_main * 1.2],
             0, 360, fill=(80, 180, 220), width=1)

    # Construction dots
    for angle in range(0, 360, 15):
        rad = math.radians(angle)
        dx = cx + r_main * 1.15 * math.cos(rad)
        dy = cy + r_main * 0.9 * math.sin(rad)
        draw.ellipse([dx - 2, dy - 2, dx + 2, dy + 2], fill=guide_color)

    # Measurement labels
    f_dim = FONT_LIGHT(20)
    draw.text((cx - 40, cy + 190), "ø2r", font=f_dim, fill=(100, 200, 220))
    draw.text((cx + r_main + 15, cy - 5), "h", font=f_dim, fill=(100, 200, 220))

    # Small diagram showing face construction
    face_x = cx - 240
    face_y = cy + 120
    draw.text((face_x, face_y), "facial geometry", font=f_dim, fill=(100, 200, 220))

    # Bottom note
    f_note = FONT_LIGHT(19)
    draw_centered_text(draw, cx, py + PANEL_H - 55, "circular base + tapered top + facial ratios",
                       f_note, fill=(120, 120, 130))

    draw_page_number(draw, px, py, 6)
    draw_panel_label(draw, px, py, "mascot construction")

def panel_7_icon_application(draw, px, py):
    """Panel 7: Icon/badge applications."""
    cx = px + PANEL_W // 2
    cy = py + PANEL_H // 2 - 15

    # App icon (main)
    icon_r = 65
    icon_cx = cx - 150
    icon_cy = cy - 10
    # Icon background
    rounded_rect(draw, (icon_cx - icon_r - 15, icon_cy - icon_r - 15,
                       icon_cx + icon_r + 15, icon_cy + icon_r + 15),
                 20, fill=PRIMARY_BLUE)
    draw_simple_droplet_icon(draw, icon_cx, icon_cy, icon_r * 0.55, fill=(255, 255, 255, 230))

    # Badge notification icon
    badge_cx = cx + 150
    badge_cy = cy - 10
    badge_r = 50
    draw_simple_droplet_icon(draw, badge_cx, badge_cy, badge_r * 0.6, fill=PRIMARY_BLUE)
    # Notification dot
    draw.ellipse([badge_cx + badge_r * 0.5 - 8, badge_cy - badge_r * 0.5 - 8,
                  badge_cx + badge_r * 0.5 + 8, badge_cy - badge_r * 0.5 + 8],
                 fill=CORAL)

    # Icon sizes (row below)
    sizes = [20, 28, 36, 44, 52]
    f_labels = FONT_REG(20)
    for i, s in enumerate(sizes):
        ix = px + 100 + i * 90
        iy = cy + 110
        draw_simple_droplet_icon(draw, ix, iy, s * 0.35, fill=PRIMARY_BLUE)
        draw_centered_text(draw, ix, iy + s * 0.35 + 20, f"{s}px", f_labels, fill=(140, 140, 145))

    # Labels
    f_icon_label = FONT_MED(24)
    draw_centered_text(draw, cx - 150, cy + 110, "App Icon", f_icon_label, fill=(180, 180, 185))
    draw_centered_text(draw, cx + 150, cy + 110, "Badge", f_icon_label, fill=(180, 180, 185))

    # Notification bar style
    notif_bar_y = cy + 210
    rounded_rect(draw, (px + 80, notif_bar_y, px + PANEL_W - 80, notif_bar_y + 36),
                 18, fill=(35, 35, 40))
    draw_simple_droplet_icon(draw, px + 108, notif_bar_y + 18, 10, fill=PRIMARY_BLUE)
    f_bar = FONT_REG(18)
    draw_centered_text(draw, px + PANEL_W // 2, notif_bar_y + 9, "Plenty reminder", f_bar, fill=WARM_WHITE)
    draw_centered_text(draw, px + PANEL_W // 2 + 40, notif_bar_y + 25, "3:00 PM", f_bar, fill=(140, 140, 145))

    draw_page_number(draw, px, py, 7)
    draw_panel_label(draw, px, py, "icon application")

def panel_8_image_direction(draw, px, py):
    """Panel 8: Atmospheric water/hydration themed background."""
    # Abstract water background
    for y in range(py, py + PANEL_H):
        t = (y - py) / PANEL_H
        r = int(15 + 20 * (1 - t))
        g = int(30 + 60 * (1 - t))
        b = int(60 + 90 * (1 - t))
        draw.line([(px, y), (px + PANEL_W, y)], fill=(r, g, b))

    # Water wave patterns
    cx = px + PANEL_W // 2
    cy = py + PANEL_H // 2

    # Concentric wave circles (water ripples)
    for r in range(40, min(PANEL_W, PANEL_H) // 2 - 20, 25):
        alpha_factor = max(0, 1 - (r - 40) / (min(PANEL_W, PANEL_H) // 2 - 60))
        opacity = int(30 * alpha_factor)
        # Draw a slightly transparent ripple using alternating dots
        for angle in range(0, 360, 3):
            rad = math.radians(angle + r * 0.5)  # rotate with radius for spiral effect
            dx = cx + r * math.cos(rad)
            dy = cy + r * math.sin(rad) * 0.7  # slightly flattened
            if px < dx < px + PANEL_W and py < dy < py + PANEL_H:
                draw.ellipse([dx - 1.5, dy - 1.5, dx + 1.5, dy + 1.5],
                            fill=(PRIMARY_BLUE[0], PRIMARY_BLUE[1], PRIMARY_BLUE[2], opacity)
                            if hasattr(draw, 'alpha') else PRIMARY_BLUE)

    # Light rays from above
    for i in range(5):
        x = px + 80 + i * (PANEL_W - 160) // 4
        w = 20 + i * 8
        for j in range(PANEL_H):
            tt = j / PANEL_H
            alpha = int(8 * (1 - tt) * (0.5 + 0.5 * math.sin(i * 2.1 + j * 0.01)))
            offset = int(3 * math.sin(i + j * 0.05))
            ray_x = x + offset
            if alpha > 0:
                draw.line([(ray_x - w // 2, py + j), (ray_x + w // 2, py + j)],
                         fill=(200, 230, 255, alpha) if hasattr(draw, 'alpha') else (200, 230, 255))

    # Silhouetted droplet (large, semi-transparent)
    large_r = min(PANEL_W, PANEL_H) // 3
    for r in range(int(large_r), 0, -1):
        alpha_s = int(15 * (1 - r / large_r))
        if alpha_s > 0:
            # Just draw the outline at several scales
            pass
    # Draw a large faint droplet outline
    pts = []
    n = 60
    stretch = 1.2
    for i in range(n):
        t = 2 * math.pi * i / n
        sx = cx + large_r * math.sin(t)
        sf = (1 - math.cos(t)) / 2
        sy = cy + large_r * (math.cos(t) + stretch * sf)
        pts.append((sx, sy))
    # Draw multiple outlines fading in
    for scale in [1.0, 0.85, 0.7, 0.55, 0.4]:
        pts_scaled = []
        for pt in pts:
            sx = cx + (pt[0] - cx) * scale
            sy = cy + (pt[1] - cy) * scale
            pts_scaled.append((sx, sy))
        draw.polygon(pts_scaled, fill=None, outline=(LIGHT_BLUE[0], LIGHT_BLUE[1], LIGHT_BLUE[2], 20), width=1)

    # Small sparkle/highlight dots
    for i in range(15):
        sx = px + 50 + i * (PANEL_W - 100) // 14
        sy = py + 30 + int(60 * math.sin(i * 2.7))
        sr = 1.5 + 1 * math.sin(i * 1.3)
        draw.ellipse([sx - sr, sy - sr, sx + sr, sy + sr],
                     fill=(255, 255, 255, 100))

    # Text overlay - very subtle
    f_water = FONT_LIGHT(60)
    draw_centered_text(draw, cx, py + PANEL_H - 140, "water", f_water, fill=(255, 255, 255, 25))

    draw_page_number(draw, px, py, 8)
    draw_panel_label(draw, px, py, "image direction")

def panel_9_system_detail(draw, px, py):
    """Panel 9: UI system details with mascot."""
    cx = px + PANEL_W // 2
    cy = py + PANEL_H // 2

    # CTA Button
    btn_w, btn_h = 260, 52
    btn_x = cx - btn_w // 2
    btn_y = py + 45
    rounded_rect(draw, (btn_x, btn_y, btn_x + btn_w, btn_y + btn_h), 26,
                 fill=PRIMARY_BLUE)
    # Droplet icon in button
    draw_simple_droplet_icon(draw, btn_x + 50, btn_y + btn_h // 2, 13, fill=(255, 255, 255))
    f_btn = FONT_SB(24)
    draw_centered_text(draw, cx + 10, btn_y + 14, "Remind Me", f_btn, fill=(255, 255, 255))

    # Ghost button
    gb_y = btn_y + btn_h + 15
    rounded_rect(draw, (btn_x, gb_y, btn_x + btn_w, gb_y + btn_h), 26,
                 fill=None, outline=PRIMARY_BLUE, width=2)
    draw_simple_droplet_icon(draw, btn_x + 50, gb_y + btn_h // 2, 13, fill=PRIMARY_BLUE)
    f_gbtn = FONT_MED(24)
    draw_centered_text(draw, cx + 10, gb_y + 14, "Skip", f_gbtn, fill=PRIMARY_BLUE)

    # Toast notification
    toast_y = gb_y + btn_h + 30
    toast_w, toast_h = PANEL_W - 100, 48
    toast_x = px + (PANEL_W - toast_w) // 2
    rounded_rect(draw, (toast_x, toast_y, toast_x + toast_w, toast_y + toast_h),
                 12, fill=(35, 38, 42))
    draw_droplet(draw, toast_x + 38, toast_y + toast_h // 2, 13, fill=PRIMARY_BLUE,
                 expression="happy", highlight=True, blush=True)
    f_toast = FONT_REG(20)
    draw_centered_text(draw, cx + 10, toast_y + 14, "1 cup logged! Keep going", f_toast, fill=WARM_WHITE)

    # Empty state
    empty_y = toast_y + toast_h + 40
    draw_simple_droplet_icon(draw, cx, empty_y + 30, 30, fill=(50, 55, 65))
    f_empty1 = FONT_MED(24)
    draw_centered_text(draw, cx, empty_y + 80, "No reminders yet", f_empty1, fill=(160, 160, 165))
    f_empty2 = FONT_LIGHT(20)
    draw_centered_text(draw, cx, empty_y + 108, "Tap + to create your first", f_empty2, fill=(120, 120, 130))

    # Plus button
    pb_x = cx + 120
    pb_y = empty_y + 30
    pb_r = 22
    draw.ellipse([pb_x - pb_r, pb_y - pb_r, pb_x + pb_r, pb_y + pb_r], fill=PRIMARY_BLUE)
    f_plus = FONT_LIGHT(36)
    draw_centered_text(draw, pb_x, pb_y - 8, "+", f_plus, fill=(255, 255, 255))

    # Chip row
    chip_y = py + PANEL_H - 70
    chips = ["daily", "goals", "track", "hydrate"]
    chip_w = 70
    chip_gap = 8
    total_chip_w = len(chips) * (chip_w + chip_gap) - chip_gap
    chip_start = px + (PANEL_W - total_chip_w) // 2

    for i, chip_text in enumerate(chips):
        c_x = chip_start + i * (chip_w + chip_gap)
        rounded_rect(draw, (c_x, chip_y, c_x + chip_w, chip_y + 28),
                     14, fill=(38, 40, 46))
        f_chip = FONT_REG(18)
        draw_centered_text(draw, c_x + chip_w // 2, chip_y + 4, chip_text,
                          f_chip, fill=(140, 140, 145))

    draw_page_number(draw, px, py, 9)
    draw_panel_label(draw, px, py, "system detail")

# ── Main ───────────────────────────────────────────────────────────────────

def main():
    print("Creating Plenty brand-kit board...")

    # Create canvas
    canvas = Image.new('RGB', (W, H), BG)
    draw = ImageDraw.Draw(canvas)

    # Draw panel backgrounds
    for i in range(9):
        x, y, x2, y2 = panel_rect(i)
        rounded_rect(draw, (x, y, x2, y2), CORNER_RADIUS, fill=PANEL_BG)
        # Subtle border
        rounded_rect(draw, (x, y, x2, y2), CORNER_RADIUS, fill=None,
                    outline=PANEL_BORDER, width=1)

    # Draw each panel
    print("  Panel 1: Logo cover")
    panel_1_logo_cover(draw, *panel_origin(0))

    print("  Panel 2: Mascot expressions")
    panel_2_expressions(draw, *panel_origin(1))

    print("  Panel 3: Digital application")
    panel_3_digital(draw, *panel_origin(2))

    print("  Panel 4: Brand essence")
    panel_4_brand_essence(draw, *panel_origin(3))

    print("  Panel 5: Color system")
    panel_5_color_system(draw, *panel_origin(4))

    print("  Panel 6: Mascot construction")
    panel_6_construction(draw, *panel_origin(5))

    print("  Panel 7: Icon application")
    panel_7_icon_application(draw, *panel_origin(6))

    print("  Panel 8: Image direction")
    panel_8_image_direction(draw, *panel_origin(7))

    print("  Panel 9: System detail")
    panel_9_system_detail(draw, *panel_origin(8))

    # Save
    output_path = "/home/jaycee/Projects/Plenty/plenty_brandkit_board.png"
    canvas.save(output_path, "PNG")
    print(f"\nSaved: {output_path}")
    print(f"Size: {W}x{H}")

if __name__ == "__main__":
    main()
