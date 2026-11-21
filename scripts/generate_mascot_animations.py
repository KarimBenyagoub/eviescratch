#!/usr/bin/env python3
"""
Generate pixel-art mascot animations for EvieScratch:
1. evie-sleep.webp: Seamless loop with slow natural breathing and ear twitch (fixed 1:1 proportions, no seams).
2. evie-yawn.webp: 2.8-second yawning animation (aligned 1:1 with awake pose, no body stretching).
3. evie-tail-twitch.webp: 0.8-second playful tail flick between blinks and yawns.
4. evie-intro.webp: 3.5-second intro animation where journal fades in at paws, Evie quickly scratches it,
   shelf fades in without moving, and Evie watches journal move into shelf before looking at viewer.
"""

import json
import math
import os
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS_DIR = os.path.join(ROOT, 'assets', 'mascot')
PUBLIC_IMG_DIR = os.path.join(ROOT, 'public', 'images')
SHEET_PATH = os.path.join(ASSETS_DIR, 'evie-spritesheet.png')
JSON_PATH = os.path.join(ASSETS_DIR, 'evie-spritesheet.json')

with open(JSON_PATH, 'r') as f:
    META = json.load(f)

SHEET = Image.open(SHEET_PATH).convert('RGBA')

def get_clean_frame(name):
    """Crops a frame from spritesheet into a 314x314 virtual canvas and cleans any stray alpha < 20."""
    fr = META['frames'][name]['frame']
    cell = SHEET.crop((fr['x'], fr['y'], fr['x'] + fr['w'], fr['y'] + fr['h']))
    # Clean alpha
    cleaned = cell.copy()
    alpha = cleaned.split()[-1].point(lambda p: 255 if p > 20 else 0)
    cleaned.putalpha(alpha)
    res = Image.new('RGBA', (314, 314), (0, 0, 0, 0))
    res.paste(cleaned, (0, 0))
    return res

IDLE_OPEN = get_clean_frame('idle-open')
IDLE_HALF = get_clean_frame('idle-half-blink')
IDLE_BLINK = get_clean_frame('idle-blink')
IDLE_EAR = get_clean_frame('idle-ear-twitch')
WAVE_REST = get_clean_frame('wave-rest')
WAVE_LIFT = get_clean_frame('wave-lift')
WAVE_RAISED = get_clean_frame('wave-raised')
WAVE_LOWER = get_clean_frame('wave-lower')
SLEEP_REST = get_clean_frame('sleep-rest')
SLEEP_INHALE = get_clean_frame('sleep-inhale')
SLEEP_EXHALE = get_clean_frame('sleep-exhale')
SLEEP_EAR = get_clean_frame('sleep-ear-twitch')

def fit_to_512(img, scale_factor=1.4):
    """Centers and scales onto a 512x512 canvas with uniform nearest-neighbor scaling."""
    canvas = Image.new('RGBA', (512, 512), (0, 0, 0, 0))
    target_w = int(img.size[0] * scale_factor)
    target_h = int(img.size[1] * scale_factor)
    scaled = img.resize((target_w, target_h), Image.NEAREST)
    x = (512 - target_w) // 2
    y = 480 - target_h
    canvas.paste(scaled, (x, y), scaled)
    return canvas

def make_lookdown_frame(base_pose=None):
    """Create a look-down frame where Evie glances down at the journal."""
    base = (base_pose or IDLE_HALF).copy()
    head_box = (90, 70, 230, 185)
    head_crop = IDLE_HALF.crop(head_box)
    res = base.copy()
    res.paste(head_crop, (head_box[0], head_box[1] + 2), head_crop)
    draw = ImageDraw.Draw(res)
    # Add downward eye focus pixels in golden-green and dark pupil
    draw.point([(127, 141), (128, 141), (187, 141), (188, 141)], fill=(211, 181, 74, 255))
    draw.point([(127, 142), (128, 142), (187, 142), (188, 142)], fill=(40, 28, 30, 255))
    return res

LOOK_DOWN = make_lookdown_frame(IDLE_OPEN)
LOOK_DOWN_LIFT = make_lookdown_frame(WAVE_LIFT)
LOOK_DOWN_RAISED = make_lookdown_frame(WAVE_RAISED)
LOOK_DOWN_LOWER = make_lookdown_frame(WAVE_LOWER)

# Save runtime intro pose fallbacks
LOOK_DOWN.resize((216, 216), Image.NEAREST).save(os.path.join(PUBLIC_IMG_DIR, 'evie-intro-rest.webp'), 'WEBP', quality=95)
LOOK_DOWN.resize((216, 216), Image.NEAREST).save(os.path.join(PUBLIC_IMG_DIR, 'evie-intro-lookdown.webp'), 'WEBP', quality=95)
LOOK_DOWN_LIFT.resize((216, 216), Image.NEAREST).save(os.path.join(PUBLIC_IMG_DIR, 'evie-intro-lift.webp'), 'WEBP', quality=95)
LOOK_DOWN_LOWER.resize((216, 216), Image.NEAREST).save(os.path.join(PUBLIC_IMG_DIR, 'evie-intro-scratch.webp'), 'WEBP', quality=95)


# -------------------------------------------------------------
# 1. SLEEPING ANIMATION: Authentic Pixel Art Cat Breathing Loop
# -------------------------------------------------------------
def generate_sleeping_animation():
    """
    Generates a natural, seamless sleeping animation (168 frames @ 24 fps = 7.0s loop, 2 breath cycles).
    Proportions are 1:1 square (216x216 runtime), perfectly matched to awake Evie.
    Breathing smoothly transitions: rest -> intermediate rise -> full inhale -> intermediate lower -> rest.
    Zero visual seams: no rectangular tail cuts!
    """
    print("Generating sleeping animation (168 frames at 24 fps = 7.0s loop)...")
    total_frames = 168
    frames_512 = []
    frames_runtime = []

    # Two natural breathing cycles (84 frames each = 3.5s per breath)
    for i in range(total_frames):
        cycle_frame = i % 84
        cycle_idx = i // 84

        if cycle_frame < 12:
            # Deep rest before inhale
            frame_img = SLEEP_REST
        elif cycle_frame < 18:
            # Inhale begins: ribcage rises halfway (intermediate frame)
            frame_img = SLEEP_EXHALE
        elif cycle_frame < 38:
            # Full inhale: chest and back elevated peacefully
            frame_img = SLEEP_INHALE
        elif cycle_frame < 46:
            # Exhale: chest and back gently settling down
            frame_img = SLEEP_EXHALE
        else:
            # Resting hold
            if cycle_idx == 1 and 60 <= cycle_frame <= 65:
                # Gentle ear twitch during rest on cycle 2
                frame_img = SLEEP_EAR
            else:
                frame_img = SLEEP_REST

        # Master 512x512
        frames_512.append(fit_to_512(frame_img, scale_factor=1.5))

        # Runtime 216x216 (1:1 square pixel aspect ratio, identical to awake cat)
        runtime_frame = frame_img.resize((216, 216), Image.NEAREST)
        frames_runtime.append(runtime_frame)

    # Save master 512x512
    master_webp = os.path.join(ASSETS_DIR, 'evie-sleep.webp')
    frames_512[0].save(
        master_webp,
        'WEBP',
        save_all=True,
        append_images=frames_512[1:],
        duration=1000 // 24,
        loop=0,
        quality=95,
        method=6
    )
    frames_512[0].save(os.path.join(ASSETS_DIR, 'evie-sleep.png'), 'PNG')

    # Save runtime 216x216 in public/images/
    runtime_webp = os.path.join(PUBLIC_IMG_DIR, 'evie-sleeping.webp')
    frames_runtime[0].save(
        runtime_webp,
        'WEBP',
        save_all=True,
        append_images=frames_runtime[1:],
        duration=1000 // 24,
        loop=0,
        quality=92,
        method=6
    )
    print(f"Sleeping animation saved: master={os.path.getsize(master_webp)} bytes, runtime={os.path.getsize(runtime_webp)} bytes")


# -------------------------------------------------------------
# 2. YAWNING ANIMATION: 2.8 seconds (68 frames at 24 fps)
# -------------------------------------------------------------
def make_yawn_frame(open_ratio=0.0):
    """
    Creates a frame with Evie's mouth open at open_ratio (0.0 = closed, 1.0 = full wide yawn).
    Eyes are closed in sweet curved slits, jaw drops, pink tongue and little canines appear.
    """
    base = IDLE_BLINK.copy()
    if open_ratio <= 0.05:
        return base

    draw = ImageDraw.Draw(base)
    mouth_w = int(6 + open_ratio * 16)
    mouth_h = int(open_ratio * 16)
    cx = 158
    cy = 168

    top_y = cy - int(mouth_h * 0.2)
    bottom_y = cy + int(mouth_h * 0.8)
    left_x = cx - mouth_w // 2
    right_x = cx + mouth_w // 2

    # Draw chin fur lowered below mouth
    chin_box = (cx - 15, bottom_y, cx + 15, bottom_y + 8)
    draw.ellipse(chin_box, fill=(235, 214, 205, 255), outline=(45, 32, 33, 255))

    # Mouth cavity
    mouth_pts = [
        (left_x, top_y),
        (right_x, top_y),
        (right_x + 2, top_y + mouth_h // 2),
        (cx + 4, bottom_y),
        (cx - 4, bottom_y),
        (left_x - 2, top_y + mouth_h // 2)
    ]
    draw.polygon(mouth_pts, fill=(58, 18, 26, 255), outline=(42, 22, 25, 255))

    # Tongue on lower jaw
    if mouth_h >= 6:
        tongue_w = mouth_w - 4
        tongue_h = max(3, mouth_h // 2)
        tx = cx - tongue_w // 2
        ty = bottom_y - tongue_h
        draw.ellipse([tx, ty, tx + tongue_w, bottom_y - 1], fill=(244, 132, 148, 255), outline=(218, 102, 120, 255))

    # Tiny white fangs on upper jaw corners
    if open_ratio >= 0.3:
        draw.point([(left_x + 2, top_y + 1), (right_x - 2, top_y + 1)], fill=(255, 255, 255, 255))
        if open_ratio >= 0.7:
            draw.point([(left_x + 2, top_y + 2), (right_x - 2, top_y + 2)], fill=(255, 255, 255, 255))

    return base

def generate_yawn_animation():
    print("Generating yawning animation (68 frames at 24 fps = 2.83s)...")
    total_frames = 68
    frames_512 = []
    frames_runtime = []

    for i in range(total_frames):
        sec = i / 24.0

        if sec < 0.35:
            # Anticipation squint
            frame = IDLE_BLINK.copy()
        elif sec < 0.95:
            # Mouth opening
            prog = (sec - 0.35) / 0.60
            frame = make_yawn_frame(open_ratio=prog)
        elif sec < 1.85:
            # Peak yawn with subtle ear quiver
            quiver = int(math.sin(sec * 32) * 1) if (1.2 <= sec <= 1.6) else 0
            frame = make_yawn_frame(open_ratio=1.0)
            if quiver != 0:
                frame = frame.transform(frame.size, Image.AFFINE, (1, 0, quiver, 0, 1, 0), resample=Image.NEAREST)
        elif sec < 2.40:
            # Mouth closing
            prog = 1.0 - (sec - 1.85) / 0.55
            frame = make_yawn_frame(open_ratio=prog)
        elif sec < 2.65:
            # Satisfied blink
            frame = IDLE_BLINK.copy()
        else:
            # Settled back to open eyes
            frame = IDLE_OPEN.copy()

        # Master 512x512
        frames_512.append(fit_to_512(frame))

        # Runtime 216x216 (uniform scaling, 100% aligned with awake base sprite)
        runtime_frame = frame.resize((216, 216), Image.NEAREST)
        frames_runtime.append(runtime_frame)

    master_webp = os.path.join(ASSETS_DIR, 'evie-yawn.webp')
    frames_512[0].save(
        master_webp,
        'WEBP',
        save_all=True,
        append_images=frames_512[1:],
        duration=1000 // 24,
        loop=1,
        quality=95,
        method=6
    )
    frames_512[30].save(os.path.join(ASSETS_DIR, 'evie-yawn.png'), 'PNG')

    runtime_webp = os.path.join(PUBLIC_IMG_DIR, 'evie-yawn.webp')
    frames_runtime[0].save(
        runtime_webp,
        'WEBP',
        save_all=True,
        append_images=frames_runtime[1:],
        duration=1000 // 24,
        loop=1,
        quality=92,
        method=6
    )
    print(f"Yawn animation saved: master={os.path.getsize(master_webp)} bytes, runtime={os.path.getsize(runtime_webp)} bytes")


# -------------------------------------------------------------
# 3. TAIL TWITCH ANIMATION: 0.83 seconds (20 frames at 24 fps)
# -------------------------------------------------------------
def make_tail_flick_frame(dx, dy):
    """Creates a seamless pixel-art tail flick frame with zero holes or seams."""
    if dx == 0 and dy == 0:
        return IDLE_OPEN.copy()

    res = IDLE_OPEN.copy()
    # The tail tip that curls is from y: 252..268, x: 239..262
    tip = IDLE_OPEN.crop((239, 252, 263, 269))

    # Clear old tip area (leaving flank x <= 238 untouched)
    for y in range(252, 269):
        for x in range(239, 263):
            res.putpixel((x, y), (0, 0, 0, 0))

    # Paste shifted tip
    res.paste(tip, (239 + dx, 252 + dy), tip)

    # Bridge connection to body seamlessly
    for y in range(268 + dy, 272):
        for x in range(238, 246 + dx):
            if res.getpixel((x, y))[3] < 20:
                res.putpixel((x, y), (216, 140, 81, 255))
        r_edge = 246 + dx
        if res.getpixel((r_edge, y))[3] < 20:
            res.putpixel((r_edge, y), (48, 35, 36, 255))

    return res

def generate_tail_twitch_animation():
    print("Generating tail twitch animation (20 frames at 24 fps = 0.83s)...")
    total_frames = 20
    frames_512 = []
    frames_runtime = []

    f_rest = IDLE_OPEN
    f_lift = make_tail_flick_frame(2, -2)
    f_peak = make_tail_flick_frame(4, -4)
    f_settle = make_tail_flick_frame(1, -1)

    # 20 frames sequence: rest (2) -> lift (3) -> peak (6) -> settle (5) -> rest (4)
    sequence = [f_rest]*2 + [f_lift]*3 + [f_peak]*6 + [f_settle]*5 + [f_rest]*4

    for frame in sequence:
        frames_512.append(fit_to_512(frame))
        runtime_frame = frame.resize((216, 216), Image.NEAREST)
        frames_runtime.append(runtime_frame)

    master_webp = os.path.join(ASSETS_DIR, 'evie-tail-twitch.webp')
    frames_512[0].save(
        master_webp,
        'WEBP',
        save_all=True,
        append_images=frames_512[1:],
        duration=1000 // 24,
        loop=1,
        quality=95,
        method=6
    )
    frames_512[8].save(os.path.join(ASSETS_DIR, 'evie-tail-twitch.png'), 'PNG')

    runtime_webp = os.path.join(PUBLIC_IMG_DIR, 'evie-tail-twitch.webp')
    frames_runtime[0].save(
        runtime_webp,
        'WEBP',
        save_all=True,
        append_images=frames_runtime[1:],
        duration=1000 // 24,
        loop=1,
        quality=92,
        method=6
    )
    print(f"Tail twitch animation saved: master={os.path.getsize(master_webp)} bytes, runtime={os.path.getsize(runtime_webp)} bytes")


# -------------------------------------------------------------
# 4. INTRO ANIMATION: 3.5 seconds (84 frames at 24 fps)
# -------------------------------------------------------------
def draw_pixel_journal(width=90, height=115, scratches=0):
    """Draws a pixel-art leather journal with elastic band and scratches."""
    img = Image.new('RGBA', (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    draw.rounded_rectangle([0, 0, width-1, height-1], radius=6, fill=(255, 253, 250, 255), outline=(139, 120, 103, 255), width=2)
    draw.rounded_rectangle([0, 0, 12, height-1], radius=4, fill=(168, 76, 41, 255))
    draw.rectangle([width - 18, 0, width - 12, height-1], fill=(36, 108, 103, 230))

    if scratches >= 1:
        draw.line([(24, 30), (36, 65)], fill=(168, 76, 41, 255), width=2)
    if scratches >= 2:
        draw.line([(38, 26), (50, 62)], fill=(168, 76, 41, 255), width=2)
    if scratches >= 3:
        draw.line([(52, 24), (64, 58)], fill=(168, 76, 41, 255), width=2)
        draw.point([(34, 25), (48, 20), (62, 18), (66, 65)], fill=(242, 188, 74, 255))

    return img

def draw_pixel_shelf(width=140, height=130):
    """Draws a pixel-art wooden shelf slot where the journal rests."""
    img = Image.new('RGBA', (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    draw.rounded_rectangle([0, 0, width-1, height-1], radius=8, fill=(240, 232, 220, 255), outline=(130, 106, 82, 255), width=3)
    draw.rounded_rectangle([6, 6, width-7, height-7], radius=6, fill=(222, 212, 196, 255))
    draw.rectangle([10, height - 16, width - 10, height - 8], fill=(168, 76, 41, 200))
    return img

def generate_intro_animation():
    """
    3.5s intro animation (84 frames @ 24 fps):
    1. Journal fades in directly at paws (untucked, does not come from bottom).
    2. Evie scratches faster (starts by 0.35s), looking down at the journal while scratching.
    3. Shelf appears on her side with a fade-in (does not move).
    4. Journal glides to shelf while Evie watches it.
    5. Only once journal is in shelf does Evie look up at the viewer.
    """
    print("Generating intro animation (84 frames at 24 fps = 3.5s)...")
    total_frames = 84
    frames_512 = []

    journal_base = draw_pixel_journal(width=90, height=115, scratches=0)
    journal_scratched1 = draw_pixel_journal(width=90, height=115, scratches=1)
    journal_scratched2 = draw_pixel_journal(width=90, height=115, scratches=2)
    journal_scratched3 = draw_pixel_journal(width=90, height=115, scratches=3)
    shelf_img = draw_pixel_shelf(width=140, height=130)

    # Fixed positions
    evie_x = 120
    evie_y = 120
    j_rest_x = 195
    j_rest_y = 260
    shelf_fixed_x = 320
    shelf_fixed_y = 250

    for i in range(total_frames):
        sec = i / 24.0

        # Background: 512x512 sage green
        canvas = Image.new('RGBA', (512, 512), (36, 108, 103, 255))

        # Evie Pose selection:
        # 0.00s - 0.35s: Evie sits looking down at her paws
        # 0.35s - 0.50s: Evie lifts paw (looking down at journal)
        # 0.50s - 0.70s: Evie raises paw (poised, looking down)
        # 0.70s - 0.90s: Paw swipes down (scratch 1, looking down)
        # 0.90s - 1.10s: Paw raised again and swipes down (scratch 2, looking down)
        # 1.10s - 1.30s: Paw flourishes (scratch 3, looking down)
        # 1.30s - 1.55s: Paw lowers to rest (looking down admiring scratches)
        # 1.55s - 1.95s: Evie still looks down at journal as shelf fades in
        # 1.95s - 2.65s: Journal glides into shelf, Evie watches journal
        # 2.65s - 3.50s: Journal safely in shelf -> NOW Evie looks at viewer!
        if sec < 0.35:
            pose = LOOK_DOWN
        elif sec < 0.50:
            pose = LOOK_DOWN_LIFT
        elif sec < 0.70:
            pose = LOOK_DOWN_RAISED
        elif sec < 0.90:
            pose = LOOK_DOWN_LOWER
        elif sec < 1.05:
            pose = LOOK_DOWN_RAISED
        elif sec < 1.30:
            pose = LOOK_DOWN_LOWER
        elif sec < 1.55:
            pose = LOOK_DOWN_LIFT
        elif sec < 2.65:
            pose = LOOK_DOWN
        elif sec < 3.05:
            pose = IDLE_OPEN
        elif sec < 3.25:
            # Sweet friendly blink at viewer
            pose = IDLE_BLINK
        else:
            pose = IDLE_OPEN

        # Draw Evie
        evie_scaled = pose.resize((270, 270), Image.NEAREST)
        canvas.paste(evie_scaled, (evie_x, evie_y), evie_scaled)

        # Scratches on journal
        scratches_count = 0
        if sec >= 0.75:
            scratches_count = 1
        if sec >= 1.00:
            scratches_count = 2
        if sec >= 1.25:
            scratches_count = 3

        cur_journal = (
            journal_base if scratches_count == 0 else
            journal_scratched1 if scratches_count == 1 else
            journal_scratched2 if scratches_count == 2 else
            journal_scratched3
        )

        # Journal position & alpha
        j_x = j_rest_x
        j_y = j_rest_y
        journal_alpha = 1.0

        if sec < 0.35:
            # Fade in smoothly right at her paws (untucked, does not move up from bottom)
            journal_alpha = min(1.0, sec / 0.30)
        elif sec < 1.30:
            # Subtle vibration during scratch strokes (0.7-1.3s)
            if 0.70 <= sec <= 1.30:
                shake = int(math.sin(sec * 45) * 1.5)
                j_x += shake
        elif sec >= 1.95 and sec < 2.65:
            # Glide into shelf slot along smooth arc
            glide_t = (sec - 1.95) / 0.70
            j_x = int(j_rest_x + (345 - j_rest_x) * math.sin(glide_t * math.pi / 2))
            j_y = int(j_rest_y - math.sin(glide_t * math.pi) * 22)
        elif sec >= 2.65:
            # Rested inside shelf slot
            j_x = 345
            j_y = j_rest_y

        # Shelf: Fixed position, fades in without moving
        if sec >= 1.55:
            shelf_alpha = min(1.0, (sec - 1.55) / 0.40)
            if shelf_alpha < 1.0:
                # Apply alpha
                shelf_rendered = shelf_img.copy()
                r, g, b, a = shelf_rendered.split()
                a = a.point(lambda p: int(p * shelf_alpha))
                shelf_rendered.putalpha(a)
                canvas.paste(shelf_rendered, (shelf_fixed_x, shelf_fixed_y), shelf_rendered)
            else:
                canvas.paste(shelf_img, (shelf_fixed_x, shelf_fixed_y), shelf_img)

        # Render journal onto canvas
        if journal_alpha > 0:
            if journal_alpha < 1.0:
                j_rendered = cur_journal.copy()
                r, g, b, a = j_rendered.split()
                a = a.point(lambda p: int(p * journal_alpha))
                j_rendered.putalpha(a)
                canvas.paste(j_rendered, (j_x, j_y), j_rendered)
            else:
                canvas.paste(cur_journal, (j_x, j_y), cur_journal)

        # Sparkle at 2.65s+ when neatly tucked into shelf
        if sec >= 2.65:
            draw = ImageDraw.Draw(canvas)
            sparkle_x = 390
            sparkle_y = 250
            sparkle_prog = math.sin((sec - 2.65) * 6)
            sp_len = int(5 + max(0, sparkle_prog) * 3)
            draw.line([(sparkle_x - sp_len, sparkle_y), (sparkle_x + sp_len, sparkle_y)], fill=(255, 240, 150, 255), width=2)
            draw.line([(sparkle_x, sparkle_y - sp_len), (sparkle_x, sparkle_y + sp_len)], fill=(255, 240, 150, 255), width=2)
            draw.point([(sparkle_x - 3, sparkle_y - 3), (sparkle_x + 3, sparkle_y - 3),
                        (sparkle_x - 3, sparkle_y + 3), (sparkle_x + 3, sparkle_y + 3)], fill=(255, 255, 220, 255))

        frames_512.append(canvas)

    master_webp = os.path.join(ASSETS_DIR, 'evie-intro.webp')
    frames_512[0].save(
        master_webp,
        'WEBP',
        save_all=True,
        append_images=frames_512[1:],
        duration=1000 // 24,
        loop=1,
        quality=92,
        method=6
    )
    frames_512[20].save(os.path.join(ASSETS_DIR, 'evie-intro.png'), 'PNG')

    # Also save to public/images/evie-intro.webp
    runtime_webp = os.path.join(PUBLIC_IMG_DIR, 'evie-intro.webp')
    frames_512[0].save(
        runtime_webp,
        'WEBP',
        save_all=True,
        append_images=frames_512[1:],
        duration=1000 // 24,
        loop=1,
        quality=92,
        method=6
    )
    print(f"Intro animation saved: master={os.path.getsize(master_webp)} bytes, runtime={os.path.getsize(runtime_webp)} bytes")

def generate_awake_animation():
    """
    Continuous 14-second ambient loop (280 frames @ 20 fps):
    - 0.0s – 2.4s: alert sitting
    - 2.4s – 2.65s: quick natural single blink (240ms)
    - 2.65s – 5.0s: alert sitting
    - 5.0s – 6.0s: playful tail flick (between blinks and yawns)
    - 6.0s – 8.0s: alert sitting
    - 8.0s – 8.5s: sweet double-blink
    - 8.5s – 10.0s: alert sitting with subtle ear twitch
    - 10.0s – 10.8s: secondary tail swish
    - 10.8s – 11.2s: alert sitting
    - 11.2s – 13.8s: 2.6s deep yawn with open mouth, fangs, tongue, and ear quiver
    - 13.8s – 14.0s: settle back to alert sitting
    """
    print("Generating pure blinking awake animation (150 frames at 20 fps = 7.5s loop)...")
    fps = 20
    total_frames = int(7.5 * fps)
    frames_512 = []
    frames_runtime = []

    for i in range(total_frames):
        t = i / float(fps)
        if t < 2.8:
            f = IDLE_OPEN
        elif t < 2.9:
            f = IDLE_HALF
        elif t < 3.05:
            f = IDLE_BLINK
        elif t < 3.15:
            f = IDLE_HALF
        elif t < 5.8:
            f = IDLE_OPEN
        elif t < 5.9:
            f = IDLE_HALF
        elif t < 6.05:
            f = IDLE_BLINK
        elif t < 6.15:
            f = IDLE_HALF
        elif t < 6.35:
            f = IDLE_OPEN
        elif t < 6.45:
            f = IDLE_HALF
        elif t < 6.7:
            f = IDLE_BLINK
        elif t < 6.8:
            f = IDLE_HALF
        else:
            f = IDLE_OPEN

        frames_512.append(fit_to_512(f))
        frames_runtime.append(f.resize((216, 216), Image.NEAREST))

    master_webp = os.path.join(ASSETS_DIR, 'evie-awake.webp')
    frames_512[0].save(
        master_webp,
        'WEBP',
        save_all=True,
        append_images=frames_512[1:],
        duration=1000 // fps,
        loop=0,
        quality=92,
        method=4
    )
    frames_512[0].save(os.path.join(ASSETS_DIR, 'evie-awake.png'), 'PNG')

    runtime_webp = os.path.join(PUBLIC_IMG_DIR, 'evie-awake.webp')
    frames_runtime[0].save(
        runtime_webp,
        'WEBP',
        save_all=True,
        append_images=frames_runtime[1:],
        duration=1000 // fps,
        loop=0,
        quality=92,
        method=4
    )
    print(f"Awake animation saved: master={os.path.getsize(master_webp)} bytes, runtime={os.path.getsize(runtime_webp)} bytes")

if __name__ == '__main__':
    generate_sleeping_animation()
    generate_awake_animation()
    generate_intro_animation()
    print("All animations generated successfully!")
