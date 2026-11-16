"""Build the approved THE CASTLE FC social link preview from the original club logo."""
from PIL import Image, ImageDraw, ImageFont
import os

W, H = 1200, 630
im = Image.new("RGB", (W, H))
pix = im.load()
for y in range(H):
    for x in range(W):
        t = x / W
        r, g, b = 10 + int(7 * (1 - t)), 23 + int(17 * (1 - t)), 40 + int(30 * (1 - t))
        d = ((x - 200) / 480) ** 2 + ((y - 400) / 450) ** 2
        glow = max(0, 1 - d) ** 1.5
        pix[x, y] = (min(255, r + int(13 * glow)), min(255, g + int(58 * glow)), min(255, b + int(93 * glow)))

d = ImageDraw.Draw(im, "RGBA")
for x in range(-H, W + H, 82):
    d.line((x, 0, x - 380, H), fill=(180, 224, 255, 10), width=2)
d.rounded_rectangle((27, 27, W - 27, H - 27), radius=38, outline=(88, 166, 225, 120), width=2)

cx, cy = 275, 310
for radius, alpha in [(200, 18), (170, 25), (144, 45)]:
    d.ellipse((cx - radius, cy - radius, cx + radius, cy + radius), outline=(110, 190, 251, alpha), width=3)

# Never redraw or modify the official club crest: only scale the original JPEG.
logo = Image.open("official_castle_logo.jpg").convert("RGB")
logo.thumbnail((294, 294), Image.Resampling.LANCZOS)
im.paste(logo, (cx - logo.width // 2, cy - logo.height // 2))

d = ImageDraw.Draw(im, "RGBA")
d.line((525, 150, 525, 485), fill=(100, 183, 244, 85), width=2)
font_ar = "/usr/share/fonts/truetype/noto/NotoSansArabic-Bold.ttf"
font_en = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
if not os.path.exists(font_ar):
    font_ar = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
ar = ImageFont.truetype(font_ar, 67)
ar2 = ImageFont.truetype(font_ar, 38)
ar3 = ImageFont.truetype(font_ar, 21)
en = ImageFont.truetype(font_en, 30)
en2 = ImageFont.truetype(font_en, 19)

right = 1120
d.text((right, 166), "THE CASTLE FC", font=en, fill=(121, 198, 255, 255), anchor="ra")
d.text((right, 239), "نادي القلعة الرياضي", font=ar, fill=(255, 255, 255, 255), anchor="ra", direction="rtl")
d.text((right, 352), "هنا القلعة، وهنا يبدأ المجد", font=ar2, fill=(202, 229, 249, 255), anchor="ra", direction="rtl")
d.rounded_rectangle((760, 475, 1122, 532), radius=23, fill=(33, 97, 155, 150), outline=(113, 192, 251, 120), width=2)
d.text((right - 18, 503), "الموقع الرسمي لفريق القلعة", font=ar3, fill=(232, 246, 255, 255), anchor="rm", direction="rtl")
d.text((78, H - 65), "THE CASTLE FC · OFFICIAL WEBSITE", font=en2, fill=(130, 187, 237, 220))
im.save("castle-share.jpg", quality=81, optimize=True, subsampling=0)
print("Created castle-share.jpg (" + str(os.path.getsize("castle-share.jpg")) + " bytes)")
