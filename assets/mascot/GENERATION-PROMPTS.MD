# Evie asset generation prompts

Generated with the built-in image_gen tool on 21 November 2026; transparent_background=true for both. No CLI/API fallback used. Source photos are identity references, not edit targets. The master mascot is the design reference for the sheet. Output PNGs were copied unchanged into the project.

## Main mascot

Use case: stylized-concept.
Asset type: main transparent mascot image for a simple notes app called EvieScratch.
Input images are SUBJECT REFERENCES of ONE real female calico cat, Evie, Emily's cat: use the supplied front face, relaxed full-body, lying and side-profile photos. Do not turn her into a generic calico.
Primary request: create one irresistible, distinctive, gently funny premium pixel-art mascot of this specific cat. Full body seated facing mostly forward, head slightly tilted with a knowing mildly unimpressed expression, tail curled beside her, all paws readable. Isolated single character, centered with ample transparent margin; no text or props.
IDENTITY LOCK: short-haired black/dark-chocolate tortoiseshell/calico; a largely black forehead, central nose bridge and dark nose; large yellow-green/golden eyes; broad warm orange/cream patch on the cat's anatomical RIGHT cheek (VIEWER LEFT in front view) continuing around that eye; a smaller upright orange blaze above her anatomical LEFT eye (VIEWER RIGHT); white chin and lower muzzle without a broad white nose bridge; large white bib/chest; ginger anatomical right foreleg with a white mitten, darker anatomical left foreleg with a white mitten; dark body with irregular ginger flecks, white socks. Preserve asymmetry across the face. Pink inner ears. One natural tail, four anatomically plausible limbs. No collar, bow, eyelashes, accessories or alternate coat.
Style: lovingly designed 2D pixel art with cohesive square pixel clusters, approximately 128x128 logical-pixel character rendered at crisp integer scale on a 1024x1024 transparent canvas. Restrained warm palette, bold dark contour integrated with her dark fur, subtle cluster shading, no photorealistic fur, no smooth vector curves, no blur, no gradients, no antialiasing, no checkerboard painted behind her. Cozy, endearing, adult-friendly, expressive silhouette readable as a small app mascot. Real alpha transparency outside the silhouette; no floor, background, cast shadow, lettering, logo or watermark.

## Sprite sheet

Use case: stylized-concept.
Asset type: transparent pixel-art sprite atlas for a notes app, EvieScratch.
Input image 1 is the APPROVED CHARACTER DESIGN of Evie; images 2-4 are identity references of the real female calico cat. Preserve the same recognizable cat in EVERY cell, never different breeds, skins or accessory variants.
Primary request: ONE square sprite sheet, precisely FOUR columns by FOUR rows, 16 full-body sprites, on real transparent background. Target canvas 1024x1024, uniform 256x256 cells, no external border, no labels, no text, no grid lines, no floor shadows. Each sprite fully fits inside its own cell with minimum 20px transparent margins and a common ground baseline at 220px within its cell. Keep character size, placement, colors, and pixel grid consistent within each animation row. No sprites or whiskers cross cell boundaries.
Style: simpler, true low-resolution GAME PIXEL ART derived from the approved mascot, approximately 48x48 logical-pixel drawing per cell enlarged with hard square pixel clusters. Restrained shared palette, solid crisp contours, no smooth painted shading, no antialiasing, no gradients. Slightly large head and expressive but natural feline body. Adult-friendly warm humor. No props.
IDENTITY LOCK for ALL poses: dark chocolate/black calico Evie, golden yellow-green eyes, dark nose and black central nose bridge, large orange patch on her ANATOMICAL RIGHT cheek (viewer LEFT in front view), small orange blaze above her ANATOMICAL LEFT eye (viewer RIGHT), white lower muzzle/chin and white bib, ginger anatomical right foreleg ending in white mitten, dark anatomical left foreleg ending in white mitten, mottled dark/ginger body, white feet and dark mottled tail. Do not mirror her coat. Pink inner ears, one tail, natural four limbs. Follow the approved image's face asymmetry.
Exact layout reading LEFT TO RIGHT:
ROW 1: four subtle IDLE/BLINK frames of front-facing seated Evie at same position: (1) eyes open, (2) eyes half closed, (3) eyes fully closed, (4) eyes open with tiny ear twitch. Body and paws remain registered.
ROW 2: four PAW-WAVE frames of front-facing seated Evie at same position: (1) right white paw grounded, (2) her anatomical right orange foreleg/white paw halfway lifted, (3) same paw fully raised showing pink pads, (4) same paw lowered halfway. Other paws anchored.
ROW 3: four WALKING-RIGHT cycle frames, full side profile facing right in all four cells, identical body height and scale: (1) contact, (2) down, (3) passing, (4) up. Legs change in a plausible walk, body remains in place rather than moving across cells. Do not horizontally flip poses to change coat side.
ROW 4: four SLEEPING frames, curled Evie in same position, eyes closed, white paws tucked beside face and tail wrapped around: (1) resting, (2) breathing in slightly, (3) breathing out, (4) tiny ear twitch; no sleep text, Zs or symbols.
Create a practical neatly aligned sprite atlas with real alpha. No background/checkerboard art, captions, logo, watermark, decorative dividers, duplicated extra cats outside the sixteen cells.

## Actual output

Both files are 1254 × 1254 RGBA PNGs, despite requested target dimensions. Use the inspected dimensions and accompanying atlas manifest, not the requested dimensions in these prompts. The sheet contains 16 static poses; suggested animation timings are not validated animation deliverables.
