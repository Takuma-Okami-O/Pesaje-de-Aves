# Genera el icono de la app (galpón sobre fondo verde).
import os
from PIL import Image, ImageDraw
os.makedirs("assets", exist_ok=True)
S = 1024
img = Image.new("RGB", (S, S), (47, 107, 58))
d = ImageDraw.Draw(img)
d.polygon([(512, 190), (820, 400), (820, 800), (204, 800), (204, 400)], fill=(255, 253, 246))
d.line([(190, 410), (512, 180), (834, 410)], fill=(232, 223, 198), width=40, joint="curve")
d.rectangle([(400, 520), (624, 800)], fill=(47, 107, 58))
for y in (600, 680, 760):
    d.line([(400, y), (624, y)], fill=(255, 253, 246), width=10)
img.save("assets/icon.png")
img.save("assets/icon-only.png")
print("Icono creado")
