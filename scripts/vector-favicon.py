"""Trace the supplied monochrome logo silhouette, retaining its original gold.
Only SVG paths are produced. The supplied PNG remains unchanged.
"""
from pathlib import Path
from PIL import Image
from collections import Counter, defaultdict
from hashlib import sha256

root=Path(__file__).resolve().parents[1]
source=root/'public/mark.png'
im=Image.open(source).convert('RGBA')
w,h=im.size
pixels=im.load()
color=Counter((r,g,b) for r,g,b,a in im.getdata() if a>240).most_common(1)[0][0]
inside={(x,y) for y in range(h) for x in range(w) if pixels[x,y][3]>=128}
edges=defaultdict(list)
for x,y in inside:
    if (x,y-1) not in inside: edges[(x,y)].append((x+1,y))
    if (x+1,y) not in inside: edges[(x+1,y)].append((x+1,y+1))
    if (x,y+1) not in inside: edges[(x+1,y+1)].append((x,y+1))
    if (x-1,y) not in inside: edges[(x,y+1)].append((x,y))
paths=[]
while edges:
    start=next(iter(edges));point=start;points=[]
    while True:
        points.append(point)
        nxt=edges[point].pop()
        if not edges[point]: del edges[point]
        point=nxt
        if point==start: break
    if len(points)<4: continue
    simplified=[]
    for i,p in enumerate(points):
        a,b=points[i-1],points[(i+1)%len(points)]
        if (p[0]-a[0])*(b[1]-p[1])!=(p[1]-a[1])*(b[0]-p[0]): simplified.append(p)
    paths.append('M'+' L'.join(f'{x} {y}' for x,y in simplified)+' Z')
body=f'<path fill-rule="evenodd" d="{" ".join(paths)}"/>'
gold='#'+''.join(f'{c:02x}' for c in color)
for filename,fill in [('favicon.svg',gold),('mask-icon.svg','#000000')]:
    svg=f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><title>India Gully</title><!-- Source mark.png SHA256 {sha256(source.read_bytes()).hexdigest()} --><g fill="{fill}" transform="translate(108.1875 28) scale(1.075)">{body}</g></svg>\n'
    (root/'public'/filename).write_text(svg)
print('Created square SVG favicon and monochrome pinned-tab mask from the supplied mark.')
