"""
Generate CLEAN collision mask with no noise holes.
Uses vectorized numpy, heavy morphological ops to fill tiny gaps.
"""
from PIL import Image, ImageFilter, ImageDraw
import numpy as np

img = Image.open(r'C:\Users\danil\Desktop\infiernos\mapalimbo\extracted\Scene Overview.png')
pixels = np.array(img)
h, w = pixels.shape[:2]

r = pixels[:,:,0].astype(int)
g = pixels[:,:,1].astype(int)
b = pixels[:,:,2].astype(int)
a = pixels[:,:,3].astype(int)

brightness = (r + g + b) / 3.0
cdiff = np.maximum(np.abs(r - g), np.maximum(np.abs(g - b), np.abs(r - b)))

# WALKABLE SURFACES
is_grass = (g > r) & (g > b) & (g > 95) & (b < 155) & ((g - b) > 20)
is_stone = (brightness > 110) & (brightness < 220) & (cdiff < 40)
is_flower = (brightness > 170) & (cdiff < 50) & (a > 200)
is_shadow = (g > b) & (g > 70) & ((g - b) > 15) & (brightness > 60) & (brightness < 150)

walkable = (is_grass | is_stone | is_flower | is_shadow) & (a > 100) & (brightness > 45)

mask = np.zeros((h, w), dtype=np.uint8)
mask[walkable] = 255

# Convert to PIL for morphological ops
mask_img = Image.fromarray(mask, mode='L')

# HEAVY CLOSE: Fill all small holes (3 rounds of expand, then 3 rounds of shrink)
for _ in range(4):
    mask_img = mask_img.filter(ImageFilter.MaxFilter(3))
for _ in range(3):
    mask_img = mask_img.filter(ImageFilter.MinFilter(3))

# LIGHT ERODE: Keep player 2px away from wall edges (prevents clipping)
mask_img = mask_img.filter(ImageFilter.MinFilter(3))

# MANUAL corridor fixes - ensure all passages are definitely open
draw = ImageDraw.Draw(mask_img)

# Stair areas (MUST be walkable for layer transitions)
draw.rectangle([165, 445, 215, 520], fill=255)  # Left stairs
draw.rectangle([905, 420, 960, 510], fill=255)  # Right stairs
draw.rectangle([165, 725, 215, 815], fill=255)  # Bottom-left stairs
draw.rectangle([905, 720, 960, 815], fill=255)  # Bottom-right stairs

# Vertical central corridor (ensure connected top-to-bottom)
draw.rectangle([530, 290, 580, 860], fill=255)

# Horizontal central corridor (ensure connected left-to-right)
draw.rectangle([195, 430, 910, 475], fill=255)

# BLOCK outer wall tops (stone-colored surfaces that look walkable but aren't)
draw.rectangle([125, 85, 965, 150], fill=0)    # Top outer wall
draw.rectangle([125, 980, 965, 1085], fill=0)  # Bottom outer wall
draw.rectangle([85, 85, 160, 1085], fill=0)    # Left outer wall
draw.rectangle([920, 85, 980, 1085], fill=0)   # Right outer wall

mask_img.save(r'C:\Users\danil\Desktop\infiernos\mapalimbo\web\assets\collision_mask.png')

arr = np.array(mask_img)
walkable_count = np.sum(arr > 128)
print(f"Clean mask generated: {walkable_count}/{h*w} pixels walkable ({walkable_count/(h*w)*100:.1f}%)")
