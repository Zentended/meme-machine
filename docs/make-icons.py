from pathlib import Path
from PIL import Image, ImageDraw

root = Path(__file__).resolve().parents[1] / "static/icons"
root.mkdir(parents=True, exist_ok=True)
def art(mask=False):
    im = Image.new("RGB", (1024, 1024), "#101014")
    d = ImageDraw.Draw(im)
    d.rounded_rectangle((88,88,936,936), radius=230, fill="#222126")
    d.ellipse((167,349,857,800), fill="#0a090b")
    d.ellipse((175,296,849,733), fill="#4a464d", outline="#625c64", width=11)
    d.ellipse((233,298,791,686), fill="#800718")
    d.ellipse((233,256,791,638), fill="#e82135", outline="#ff7887", width=10)
    d.ellipse((293,280,731,602), fill="#f03043")
    d.arc((303,304,722,565), 192, 313, fill="#ff9ba3", width=13)
    d.ellipse((399,383,435,407), fill="#ffd0d6")
    return im
for name, n in [("icon-192.png",192),("icon-512.png",512),("mask-512.png",512)]:
    img=art()
    if name.startswith("mask"):
        small=img.resize((820,820),Image.Resampling.LANCZOS)
        img=Image.new("RGB",(1024,1024),"#101014")
        img.paste(small,(102,102))
    img.resize((n,n),Image.Resampling.LANCZOS).save(root / name,optimize=True)
