from PIL import Image, ImageDraw, ImageFont

# List of emojis for each phase
emojis = [
    "🌑", "🌒", "🌒", "🌓", "🌓", "🌔", "🌔", "🌕", "🌕", "🌖", "🌖", "🌗", "🌗", "🌘", "🌘",
    "🌑", "🌒", "🌒", "🌓", "🌓", "🌔", "🌔", "🌕", "🌕", "🌖", "🌖", "🌗", "🌗"
]
filenames = [f"{i+1}.png" for i in range(28)] + ["new.png"]

# Try different font sizes and paths
font_paths = [
    "/usr/share/fonts/truetype/noto/NotoColorEmoji.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    "/usr/share/fonts/truetype/freefont/FreeSerif.ttf"
]
font = None
for path in font_paths:
    try:
        font = ImageFont.truetype(path, 384)  # Try a large font size
        print(f"Using font: {path}")
        break
    except Exception as e:
        print(f"Failed to load {path}: {e}")

if font is None:
    raise RuntimeError("No suitable font found!")

for emoji, filename in zip(emojis + ["🌑"], filenames):
    img = Image.new("RGBA", (512, 512), (255, 255, 255, 0))
    draw = ImageDraw.Draw(img)
    bbox = draw.textbbox((0, 0), emoji, font=font)
    w, h = bbox[2] - bbox[0], bbox[3] - bbox[1]
    draw.text(((512-w)/2, (512-h)/2), emoji, font=font, embedded_color=True)
    # Crop to non-transparent content
    cropped = img.crop(img.getbbox())
    cropped.save(filename)
