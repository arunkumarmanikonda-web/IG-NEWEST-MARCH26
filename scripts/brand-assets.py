"""Contour SVG derivatives and app icons from the owner's original PNG artwork.
No fonts, invented initials, recolouring, stretching or replacement marks.
"""
from pathlib import Path
from collections import defaultdict
from hashlib import sha256
from PIL import Image
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public' / 'brand'
OUT.mkdir(exist_ok=True)

def trace(mask):
    edges = defaultdict(list)
    inside = {(int(x), int(y)) for y, x in zip(*np.nonzero(mask))}
    for x, y in sorted(inside, key=lambda p: (p[1], p[0])):
        if (x,y-1) not in inside: edges[(x,y)].append((x+1,y))
        if (x+1,y) not in inside: edges[(x+1,y)].append((x+1,y+1))
        if (x,y+1) not in inside: edges[(x+1,y+1)].append((x,y+1))
        if (x-1,y) not in inside: edges[(x,y+1)].append((x,y))
    paths=[]
    while edges:
        start=next(iter(edges)); point=start; points=[]
        while True:
            points.append(point); nxt=edges[point].pop()
            if not edges[point]: del edges[point]
            point=nxt
            if point==start: break
        if len(points)<4: continue
        corners=[]
        for i,p in enumerate(points):
            a,b=points[i-1],points[(i+1)%len(points)]
            if (p[0]-a[0])*(b[1]-p[1])!=(p[1]-a[1])*(b[0]-p[0]): corners.append(p)
        paths.append('M'+' L'.join(f'{x} {y}' for x,y in corners)+' Z')
    return ' '.join(paths)

for source, name, ink in [('logo-dark.png','logo-dark.svg','#2b2a29'),('logo-white.png','logo-white.svg','#fefefe'),('mark.png','mark.svg',None)]:
    file=ROOT/'public'/source
    im=Image.open(file).convert('RGBA'); a=np.asarray(im)
    visible=a[:,:,3]>=128
    gold=visible & (a[:,:,0]>120) & (a[:,:,1]>85) & (a[:,:,2]<90)
    body=f'<path fill="#d4b012" fill-rule="evenodd" d="{trace(gold)}"/>'
    if ink: body+=f'<path fill="{ink}" fill-rule="evenodd" d="{trace(visible & ~gold)}"/>'
    (OUT/name).write_text(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {im.width} {im.height}" role="img"><title>India Gully</title><!-- Original {source} SHA256 {sha256(file.read_bytes()).hexdigest()} -->{body}</svg>\n')

mark=Image.open(ROOT/'public'/'mark.png').convert('RGBA')
app=Image.new('RGBA',(512,512),'#2b2a29')
fitted=mark.resize((round(mark.width*384/mark.height),384),Image.Resampling.LANCZOS)
app.alpha_composite(fitted,((512-fitted.width)//2,64))
for size,name in [(180,'apple-touch-icon.png'),(192,'icon-192.png'),(512,'icon-512.png')]:
    app.resize((size,size),Image.Resampling.LANCZOS).save(ROOT/'public'/name)
app.save(ROOT/'public'/'favicon.ico',sizes=[(16,16),(32,32),(48,48),(64,64)])
print('Original logos retained; full SVG wordmarks, symbol and app icons generated.')
