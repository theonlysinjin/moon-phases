from PIL import Image
import glob

for jpg_file in glob.glob("*.jpg"):
    img = Image.open(jpg_file)
    png_file = jpg_file.replace(".jpg", ".png")
    img.save(png_file)
