#!/usr/bin/env python3
"""
Generate Plenty Play Store listing assets.
  - Feature graphic (1024×500)
  - Phone screenshots (1080×1920) for 5 key screens

Requirements: Pillow (PIL)
"""

import math, os
from PIL import Image, ImageDraw, ImageFont

ASSETS_DIR = os.path.join(os.path.dirname(__file__), "..", "assets", "store")
os.makedirs(ASSETS_DIR, exist_ok=True)

# ── Palette (light theme from constants/colors.js) ──
BG        = "#E8F4FD"
SURFACE   = "#FFFFFF"
SURFACE2  = "#F5F9FF"
PRIMARY   = "#4A90D9"
PRIMARY_LT= "#A0C4E8"
PRIMARY_BG= "#E8F0FE"
TEXT      = "#1A3A5C"
TEXT_SEC  = "#6B8CAB"
TEXT_TER  = "#A0B8D0"
SUCCESS   = "#27AE60"
WARNING   = "#E67E22"
ERROR     = "#E8596E"
BORDER    = "#D6E4F0"

W, H = 1080, 1920  # screenshot dimensions
STATUS_BAR_H = 60
TAB_BAR_H = 100
MARGIN = 40

# ── Font helpers ──

def _font(size, bold=False):
    weight = "Bold" if bold else "Regular"
    for p in [
        f"/usr/share/fonts/truetype/dejavu/DejaVuSans-{weight}.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    ]:
        if os.path.exists(p):
            try:
                return ImageFont.truetype(p, size)
            except (IOError, OSError):
                pass
    return ImageFont.load_default()


def _hex(hex_str):
    h = hex_str.lstrip("#")
    return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))


def _rounded_rect(draw, xy, r, fill=None, outline=None, width=1):
    draw.rounded_rectangle(xy, radius=r, fill=fill, outline=outline, width=width)


def _water_drop(draw, cx, cy, size, color):
    r = size / 2
    draw.ellipse([cx - r, cy - r*0.3, cx + r, cy + r*0.8], fill=color)
    draw.polygon([(cx, cy - r*1.2), (cx - r*0.8, cy + r*0.1), (cx + r*0.8, cy + r*0.1)], fill=color)


# ── Screen boilerplate ──

def new_screen():
    img = Image.new("RGB", (W, H), BG)
    return img, ImageDraw.Draw(img)


def status_bar(draw):
    draw.rectangle([0, 0, W, STATUS_BAR_H], fill="#1A3A5C")
    draw.text((36, 14), "9:41", fill="#fff", font=_font(24))


def tab_bar(draw, active=0):
    by = H - TAB_BAR_H
    draw.rectangle([0, by, W, H], fill=SURFACE)
    draw.line([(0, by), (W, by)], fill=BORDER, width=2)
    items = [("Home", 0), ("Log", 1), ("Awards", 2), ("Settings", 3)]
    sw = W / len(items)
    for i, (label, idx) in enumerate(items):
        cx = int(sw * i + sw / 2)
        color = PRIMARY if idx == active else TEXT_TER
        draw.text((cx - 16, by + 14), "●", fill=color, font=_font(24))
        draw.text((cx - len(label)*8, by + 44), label, fill=color, font=_font(22))


# ═══════════════════════════════════════
#   FEATURE GRAPHIC  1024 × 500
# ═══════════════════════════════════════

def create_feature_graphic():
    FW, FH = 1024, 500
    img = Image.new("RGB", (FW, FH), BG)
    draw = ImageDraw.Draw(img)

    # soft vertical gradient
    for y in range(FH):
        t = y / FH
        r = int(232*(1-t) + 220*t)
        g = int(244*(1-t) + 235*t)
        b = int(253*(1-t) + 248*t)
        draw.line([(0, y), (FW, y)], fill=(r, g, b))

    # decorative background circles
    for cx, cy, r, a in [
        (800, 100, 160, 35), (920, 420, 100, 20),
        (120, 400, 120, 25), (50, 80, 80, 15),
    ]:
        overlay = Image.new("RGBA", (r*2, r*2), (0,0,0,0))
        od = ImageDraw.Draw(overlay)
        od.ellipse([0, 0, r*2, r*2], fill=(*_hex(PRIMARY_LT), a))
        img.paste(overlay, (cx-r, cy-r), overlay)

    # water drops
    _water_drop(draw, 280, 240, 160, PRIMARY_LT)
    _water_drop(draw, 180, 160, 80, PRIMARY)
    for cx, cy, s, c in [(350,140,40,PRIMARY_LT),(200,320,50,PRIMARY),(420,260,30,PRIMARY_LT)]:
        _water_drop(draw, cx, cy, s, c)

    # brand text
    draw.text((460, 150), "Plenty", fill=TEXT, font=_font(72, bold=True))
    draw.text((460, 230), "Build your hydration habit", fill=TEXT_SEC, font=_font(28))

    # feature bullets
    bullets = [
        "Beautiful water animation",
        "Streak tracking with rewards",
        "Smart weather-aware reminders",
        "Achievements & milestones",
        "100% private — all on-device",
    ]
    for i, b in enumerate(bullets):
        draw.text((460, 300 + i*34), f"  {b}", fill=TEXT_SEC, font=_font(20))

    path = os.path.join(ASSETS_DIR, "feature-graphic.png")
    img.save(path)
    print(f"  Created {path}  {img.size}")


# ═══════════════════════════════════════
#   1 — HOME SCREEN
# ═══════════════════════════════════════

def screenshot_1_home():
    img, draw = new_screen()
    status_bar(draw)
    tab_bar(draw, 0)

    # Water fill (oval)
    cx, cy = W//2, 220
    wr, hr = 140, 90
    water_pct = 0.55
    # container outline
    draw.ellipse([cx-wr, cy-hr, cx+wr, cy+hr], outline=PRIMARY_LT, width=5)
    # filled portion
    fill_bottom = cy + hr
    fill_top = fill_bottom - int(hr * 2 * water_pct)
    for y in range(max(cy-hr, fill_top), fill_bottom):
        row_t = (y - (cy-hr)) / (hr*2)
        if 0 <= row_t <= 1:
            half = wr * math.sqrt(1 - (row_t-0.5)**2 * 4)
        else:
            half = wr
        alpha = int(80 + 40 * (1 - (y - fill_top) / (fill_bottom - fill_top + 1)))
        draw.line([(cx - half, y), (cx + half, y)], fill=(*_hex(PRIMARY), alpha))

    # water text
    draw.text((cx-60, cy-24), "55%", fill=TEXT, font=_font(44, bold=True))
    draw.text((cx-46, cy+20), "1100 / 2000ml", fill=TEXT_SEC, font=_font(22))

    # Streak flame
    draw.text((W-180, 90), "🔥", fill=WARNING, font=_font(44))
    draw.text((W-130, 90), "7", fill=TEXT, font=_font(38, bold=True))
    draw.text((W-130, 126), "day streak", fill=TEXT_SEC, font=_font(18))

    # Mascot bubble
    mx, my = W//2 - 160, 390
    draw.ellipse([mx-38, my-38, mx+38, my+38], fill=PRIMARY_LT)
    draw.ellipse([mx-12, my-10, mx-4, my-2], fill=TEXT)
    draw.ellipse([mx+4, my-10, mx+12, my-2], fill=TEXT)
    draw.arc([mx-10, my+2, mx+10, my+14], 0, 180, fill=TEXT, width=2)
    _rounded_rect(draw, [mx+50, my-24, mx+380, my+16], 10, fill=SURFACE, outline=BORDER, width=2)
    draw.text((mx+62, my-14), "Great start today!  Keep it up", fill=TEXT_SEC, font=_font(22))

    # glasses count
    draw.text((W//2-80, 330), "5", fill=PRIMARY, font=_font(56, bold=True))
    draw.text((W//2+10, 342), "glasses today", fill=TEXT_SEC, font=_font(22))

    # Quick-log button
    bw, bh = 300, 66
    bx, by = W//2 - bw//2, 500
    _rounded_rect(draw, [bx, by, bx+bw, by+bh], 33, fill=PRIMARY)
    draw.text((bx+60, by+14), "Log 250ml", fill="#fff", font=_font(28, bold=True))

    # Interval chips
    chips = ["1m", "5m", "15m", "30m", "1h", "2h"]
    cw, ch, cgap = 82, 42, 10
    total = len(chips)*(cw+cgap)-cgap
    sx = W//2 - total//2
    for i, label in enumerate(chips):
        x = sx + i*(cw+cgap)
        _rounded_rect(draw, [x, 590, x+cw, 590+ch], 21, fill=SURFACE, outline=BORDER, width=2)
        draw.text((x+24, 598), label, fill=TEXT_SEC, font=_font(20))

    # Heatmap (simplified grid)
    hm_x, hm_y = MARGIN, 680
    cell = 18
    gap = 3
    cols, rows = 32, 5
    for r in range(rows):
        for c in range(cols):
            x = hm_x + c*(cell+gap)
            y = hm_y + r*(cell+gap)
            val = 0.15 + 0.7 * (math.sin(c*0.6+r*2.1)**2 * 0.6 + 0.4 * (r/rows) * (1 - abs(c-cols/2)/cols))
            shade = int(180 + 75*val)
            draw.rectangle([x, y, x+cell, y+cell], fill=(shade, shade, shade))
    draw.text((hm_x, hm_y + rows*(cell+gap) + 10), "Last 30 days  07:00-22:00  750ml avg", fill=TEXT_TER, font=_font(18))

    # Save
    img.save(os.path.join(ASSETS_DIR, "screenshot-1-home.png"))
    print("  Created screenshot-1-home.png")


# ═══════════════════════════════════════
#   2 — QUICK-LOG (amount picker modal)
# ═══════════════════════════════════════

def screenshot_2_quick_log():
    img, draw = new_screen()
    status_bar(draw)
    # dimmed background hint
    draw.rectangle([0, STATUS_BAR_H, W, H-TAB_BAR_H], fill="#D4E4F0")

    # Bottom sheet
    sheet_y = H - 720
    draw.rounded_rectangle([0, sheet_y, W, H], radius=40, fill=SURFACE)
    # handle
    draw.rounded_rectangle([W//2-28, sheet_y+12, W//2+28, sheet_y+20], radius=4, fill=BORDER)

    draw.text((MARGIN, sheet_y+50), "Quick Log", fill=TEXT, font=_font(34, bold=True))
    draw.text((MARGIN, sheet_y+92), "How much did you drink?", fill=TEXT_SEC, font=_font(22))

    opts = [("100 ml", "Small sip", False), ("200 ml", "Small glass", False),
            ("250 ml", "Standard glass", True), ("500 ml", "Large glass", False)]
    for i, (amt, desc, active) in enumerate(opts):
        oy = sheet_y + 150 + i*88
        fill = PRIMARY_BG if active else SURFACE2
        outline = PRIMARY if active else None
        ow = 3 if active else 0
        _rounded_rect(draw, [MARGIN, oy, W-MARGIN, oy+72], 14, fill=fill, outline=outline, width=ow)
        c = PRIMARY if active else TEXT
        draw.text((MARGIN+20, oy+10), amt, fill=c, font=_font(28, bold=True))
        draw.text((MARGIN+20, oy+42), desc, fill=TEXT_SEC, font=_font(20))

    # Custom input
    iy = sheet_y + 150 + 4*88 + 16
    _rounded_rect(draw, [MARGIN, iy, W-MARGIN, iy+64], 14, fill=SURFACE2)
    draw.text((MARGIN+24, iy+16), "Custom amount", fill=TEXT_TER, font=_font(24))

    img.save(os.path.join(ASSETS_DIR, "screenshot-2-quick-log.png"))
    print("  Created screenshot-2-quick-log.png")


# ═══════════════════════════════════════
#   3 — ACHIEVEMENTS
# ═══════════════════════════════════════

def screenshot_3_achievements():
    img, draw = new_screen()
    status_bar(draw)
    tab_bar(draw, 2)

    # Mascot header
    mx, my = MARGIN+40, 110
    draw.ellipse([mx-42, my-42, mx+42, my+42], fill=PRIMARY_LT)
    draw.ellipse([mx-10, my-8, mx-3, my-1], fill=TEXT)
    draw.ellipse([mx+3, my-8, mx+10, my-1], fill=TEXT)
    draw.arc([mx-10, my+4, mx+10, my+16], 0, 180, fill=TEXT, width=2)
    draw.text((mx+70, 100), "Achievements", fill=TEXT, font=_font(32, bold=True))
    draw.text((mx+70, 138), "3 / 12 unlocked", fill=TEXT_SEC, font=_font(22))

    # Streak Rewards
    draw.text((MARGIN, 220), "Streak Rewards", fill=TEXT, font=_font(26, bold=True))

    rewards = [("Bronze", True, "3 days"), ("Silver", True, "7 days"),
               ("Gold", False, "14 days"), ("Diamond", False, "30 days")]
    rw = 170
    for i, (title, unlocked, desc) in enumerate(rewards):
        rx = MARGIN + i*(rw+14)
        ry = 260
        fill = SURFACE if unlocked else SURFACE2
        _rounded_rect(draw, [rx, ry, rx+rw, ry+200], 14, fill=fill, outline=SUCCESS if unlocked else BORDER, width=2)
        level = ["III", "II", "I", ""][i]
        draw.text((rx+60, ry+12), level, fill=TEXT, font=_font(34, bold=True))
        draw.text((rx+40, ry+50), title, fill=TEXT if unlocked else TEXT_TER, font=_font(22, bold=True))
        if unlocked:
            draw.rounded_rectangle([rx+16, ry+100, rx+rw-16, ry+120], radius=6, fill="#E8F8EE")
            draw.text((rx+32, ry+102), "Unlocked", fill=SUCCESS, font=_font(18))
        else:
            draw.text((rx+28, ry+105), f"to go: {desc}", fill=TEXT_SEC, font=_font(18))

    # Divider
    draw.line([(MARGIN, 490), (W-MARGIN, 490)], fill=BORDER, width=2)

    # Achievement grid
    items = [
        ("First Sip", True), ("On Fire", True), ("Early Bird", True),
        ("Night Owl", False), ("Streak Master", False), ("Marathon", False),
    ]
    gw = (W - MARGIN*3) // 2
    for i, (title, unlocked) in enumerate(items):
        col = i % 2
        row = i // 2
        gx = MARGIN + col*(gw+MARGIN)
        gy = 520 + row*170
        fill = SURFACE if unlocked else SURFACE2
        _rounded_rect(draw, [gx, gy, gx+gw, gy+150], 14, fill=fill)
        draw.text((gx+80, gy+12), title, fill=TEXT if unlocked else TEXT_TER, font=_font(22, bold=True))
        if unlocked:
            draw.rounded_rectangle([gx+24, gy+50, gx+gw-24, gy+68], radius=6, fill="#E8F8EE")
            draw.text((gx+(gw-90)//2, gy+52), "Unlocked", fill=SUCCESS, font=_font(18))
        else:
            bar_w = gw - 60
            draw.rounded_rectangle([gx+30, gy+60, gx+30+bar_w, gy+68], radius=4, fill=BORDER)
            pct = 0.3 + 0.4 * (i*0.08)
            draw.rounded_rectangle([gx+30, gy+60, gx+30+int(bar_w*pct), gy+68], radius=4, fill=PRIMARY_LT)
            draw.text((gx+30, gy+78), "3 / 10", fill=TEXT_TER, font=_font(18))

    img.save(os.path.join(ASSETS_DIR, "screenshot-3-achievements.png"))
    print("  Created screenshot-3-achievements.png")


# ═══════════════════════════════════════
#   4 — ONBOARDING
# ═══════════════════════════════════════

def screenshot_4_onboarding():
    img, draw = new_screen()
    status_bar(draw)

    # Skip
    draw.text((W-90, 90), "Skip", fill=PRIMARY, font=_font(26, bold=True))

    # Large water icon in circle
    icx, icy = W//2, 340
    draw.ellipse([icx-90, icy-90, icx+90, icy+90], fill=PRIMARY_BG)
    _water_drop(draw, icx, icy+8, 80, PRIMARY)

    # Title
    draw.text((W//2-160, 500), "Welcome to Plenty", fill=TEXT, font=_font(46, bold=True))
    lines = ["Plenty helps you drink enough", "water every day.", "No fuss, no accounts."]
    for i, ln in enumerate(lines):
        w = len(ln)*13
        draw.text(((W-w)//2, 570+i*38), ln, fill=TEXT_SEC, font=_font(26))

    # Dots
    for i in range(3):
        r = 10 if i == 0 else 6
        c = PRIMARY if i == 0 else BORDER
        draw.ellipse([W//2 + i*44 - r, 700-r, W//2 + i*44 - r + r*2, 700+r], fill=c)

    # Feature cards
    features = [("Smart Tracking", "Log water with one tap"),
                ("Streak System", "Build your habit"),
                ("Rewards", "Unlock achievements")]
    for i, (ttl, desc) in enumerate(features):
        fy = 780 + i*160
        _rounded_rect(draw, [MARGIN+30, fy, W-MARGIN-30, fy+130], 18, fill=SURFACE)
        draw.text((MARGIN+80, fy+18), ttl, fill=TEXT, font=_font(28, bold=True))
        draw.text((MARGIN+80, fy+58), desc, fill=TEXT_SEC, font=_font(22))

    img.save(os.path.join(ASSETS_DIR, "screenshot-4-onboarding.png"))
    print("  Created screenshot-4-onboarding.png")


# ═══════════════════════════════════════
#   5 — SETTINGS
# ═══════════════════════════════════════

def screenshot_5_settings():
    img, draw = new_screen()
    status_bar(draw)
    tab_bar(draw, 3)

    draw.text((MARGIN, 110), "Settings", fill=TEXT, font=_font(34, bold=True))

    sections = [
        ("Theme", [
            ("Light", True, "chip"), ("Dark", False, "chip"), ("Auto", False, "chip"),
        ]),
        ("Notification Messages", [
            ("Encouraging", True, "toggle"),
            ("Funny", False, "toggle"),
            ("Urgent", True, "toggle"),
            ("Health Facts", True, "toggle"),
        ]),
        ("Data", [
            ("Export CSV", "Download drink history", "row"),
            ("Backup & Restore", "Save or restore data", "row"),
            ("Reset All Data", "Clear everything", "row"),
        ]),
    ]

    y = 170
    for section_title, items in sections:
        draw.text((MARGIN, y), section_title, fill=TEXT_SEC, font=_font(24, bold=True))
        y += 44
        for item in items:
            if item[-1] == "chip":
                label, active = item[0], item[1]
                fill = PRIMARY_BG if active else SURFACE
                _rounded_rect(draw, [MARGIN, y, MARGIN+160, y+56], 12, fill=fill, outline=PRIMARY if active else BORDER, width=2 if active else 1)
                draw.text((MARGIN+40, y+14), label, fill=PRIMARY if active else TEXT, font=_font(22))
                y += 72
            elif item[-1] == "toggle":
                label, active = item[0], item[1]
                _rounded_rect(draw, [MARGIN, y, W-MARGIN, y+50], 12, fill=SURFACE)
                draw.text((MARGIN+20, y+12), label, fill=TEXT, font=_font(24))
                # toggle switch
                tx, ty = W-MARGIN-60, y+12
                fill_t = PRIMARY_LT if active else BORDER
                draw.rounded_rectangle([tx, ty, tx+44, ty+24], radius=12, fill=fill_t)
                thumb_x = tx+20 if active else tx+2
                draw.ellipse([thumb_x, ty+2, thumb_x+20, ty+22], fill=SURFACE)
                y += 66
            else:
                label, desc = item[0], item[1]
                _rounded_rect(draw, [MARGIN, y, W-MARGIN, y+64], 12, fill=SURFACE)
                draw.text((MARGIN+20, y+10), label, fill=TEXT, font=_font(24, bold=True))
                draw.text((MARGIN+20, y+38), desc, fill=TEXT_SEC, font=_font(18))
                y += 78

    # Version
    draw.text((MARGIN, y+16), "Plenty v1.0.0", fill=TEXT_TER, font=_font(18))

    img.save(os.path.join(ASSETS_DIR, "screenshot-5-settings.png"))
    print("  Created screenshot-5-settings.png")


# ═══════════════════════════════════════
#   Main
# ═══════════════════════════════════════

if __name__ == "__main__":
    print("Generating Plenty Play Store assets...\n")
    create_feature_graphic()
    screenshot_1_home()
    screenshot_2_quick_log()
    screenshot_3_achievements()
    screenshot_4_onboarding()
    screenshot_5_settings()
    print(f"\nDone. All assets in {ASSETS_DIR}")
