#!/usr/bin/env python3
"""Reproducible store artwork from approved vector branding and repository fonts.

No fabricated app interface or generated imagery is used. Typography is outlined
so the editable SVG renders consistently without requiring installed fonts.
"""
from pathlib import Path
import hashlib
import json
import shutil
import xml.etree.ElementTree as ET

import subprocess
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "mobile/store/assets"
OUT.mkdir(parents=True, exist_ok=True)
NS = "http://www.w3.org/2000/svg"
ET.register_namespace("", NS)


def element(tag, **attributes):
    return ET.Element(f"{{{NS}}}{tag}", {key.replace("_", "-"): str(value) for key, value in attributes.items()})


def text_paths(parent, text, x, baseline, size, font_path, fill, tracking=0):
    font = TTFont(font_path)
    glyphs = font.getGlyphSet()
    cmap = font.getBestCmap()
    scale = size / font["head"].unitsPerEm
    group = element("g", aria_label=text, fill=fill)
    pen_x = x
    for character in text:
        glyph_name = cmap[ord(character)]
        glyph = glyphs[glyph_name]
        pen = SVGPathPen(glyphs)
        glyph.draw(pen)
        data = pen.getCommands()
        if data:
            group.append(element("path", d=data, transform=f"translate({pen_x:.4f} {baseline}) scale({scale:.8f} {-scale:.8f})"))
        pen_x += font["hmtx"].metrics[glyph_name][0] * scale + tracking
    parent.append(group)
    font.close()
    return pen_x


svg = element("svg", width=1024, height=500, viewBox="0 0 1024 500", role="img")
title = element("title")
title.text = "India Gully: Opportunities. Connections. Possibilities."
svg.append(title)
svg.append(element("rect", x=0, y=0, width=1024, height=500, fill="#292824"))
# Existing approved artwork, preserved as paths with one uniform scale.
logo = ET.parse(ROOT / "public/brand/logo-white.svg").getroot()
logo_group = element("g", transform="translate(64 45) scale(0.17822265625)")
for child in list(logo):
    if child.tag.endswith("path"):
        logo_group.append(child)
svg.append(logo_group)
svg.append(element("path", d="M64 160H960", stroke="#6d6650", stroke_width=1))
svg.append(element("path", d="M64 160H176", stroke="#d1ae0f", stroke_width=3))
serif = ROOT / "assets/fonts/briefs/LiberationSerif-Regular.ttf"
sans = ROOT / "assets/fonts/briefs/LiberationSans-Regular.ttf"
for line, baseline in (("Opportunities.", 239), ("Connections.", 303), ("Possibilities.", 367)):
    text_paths(svg, line, 64, baseline, 60, serif, "#f8f6f1", tracking=-0.7)
svg.append(element("path", d="M622 207V364", stroke="#6d6650", stroke_width=1))
for label, baseline in (("Properties", 230), ("Retail leasing", 270), ("HORECA", 310), ("Perspectives", 350)):
    text_paths(svg, label, 659, baseline, 23, sans, "#e6dfcf", tracking=0.15)
svg.append(element("path", d="M64 410H960", stroke="#4d493f", stroke_width=1))
text_paths(svg, "EXPLORE INDIA GULLY", 64, 449, 12, sans, "#d1ae0f", tracking=2.0)
text_paths(svg, "OPPORTUNITY. AT YOUR FINGERTIPS.", 659, 449, 10, sans, "#c5bfaf", tracking=1.3)
source = OUT / "feature-graphic.svg"
ET.ElementTree(svg).write(source, encoding="utf-8", xml_declaration=True)
feature = OUT / "feature-graphic-1024x500.png"
subprocess.run(["inkscape", str(source), "--export-type=png", f"--export-filename={feature}", "--export-width=1024", "--export-height=500"], check=True, stdout=subprocess.DEVNULL)
# Play feature artwork is exported as true 24-bit RGB with no alpha channel.
with Image.open(feature) as rendered:
    rendered.convert("RGB").save(feature, format="PNG")
icon = OUT / "app-icon-512.png"
shutil.copyfile(ROOT / "public/icon-512.png", icon)
for path, dimensions in ((feature, (1024, 500)), (icon, (512, 512))):
    with Image.open(path) as image:
        assert image.size == dimensions
        assert image.convert("RGBA").getextrema()[3] == (255, 255), f"Unexpected transparency: {path.name}"
manifest = {
    "feature_graphic": {"file": feature.name, "width": 1024, "height": 500, "opaque": True, "mode": "RGB", "bit_depth": 24,
                        "source": source.name, "sha256": hashlib.sha256(feature.read_bytes()).hexdigest()},
    "app_icon": {"file": icon.name, "width": 512, "height": 512, "opaque": True,
                 "source": "public/icon-512.png", "sha256": hashlib.sha256(icon.read_bytes()).hexdigest()},
    "branding_source": "public/brand/logo-white.svg",
    "content": "Existing approved branding; vector typography; no fabricated UI or generated imagery.",
}
(OUT / "brand-assets.json").write_text(json.dumps(manifest, indent=2) + "\n")
print(json.dumps(manifest, indent=2))
