# Google Play brand artwork

- `feature-graphic-1024x500.png`: exact 1024 × 500, 24-bit RGB PNG with no alpha channel. Existing India Gully vector logo and repository fonts; charcoal, ivory and gold composition. No fabricated app UI or generated imagery.
- `feature-graphic.svg`: editable vector source with outlined typography for stable rendering.
- `app-icon-512.png`: byte-for-byte copy of the approved `public/icon-512.png`, 512 × 512 and fully opaque.
- `brand-assets.json`: source attribution, dimensions and output hashes.

Regenerate from the repository root:

```sh
python3 mobile/scripts/generate-play-brand-assets.py
```

The generator uses Python `fontTools` and Pillow for outlining/validation and Inkscape for PNG export. Fonts and logo artwork are read from the repository. It does not require platform-installed fonts or network access.
