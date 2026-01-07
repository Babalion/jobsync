# Icons Placeholder

The JobSync extension needs icon files in PNG format at the following sizes:
- icon16.png (16x16 pixels)
- icon48.png (48x48 pixels)
- icon128.png (128x128 pixels)

## Creating Icons

You can create icons using any image editor. Here's a simple design suggestion:

1. Use the JobSync brand colors (purple gradient: #667eea to #764ba2)
2. Include a simple briefcase or document icon
3. Keep it recognizable at small sizes

## Temporary SVG Template

Here's an SVG template you can use as a starting point:

```svg
<svg width="128" height="128" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Background circle -->
  <circle cx="64" cy="64" r="60" fill="url(#grad)"/>
  
  <!-- Briefcase icon -->
  <rect x="38" y="50" width="52" height="36" rx="4" fill="white" opacity="0.9"/>
  <rect x="56" y="44" width="16" height="6" rx="2" fill="white" opacity="0.9"/>
  <line x1="38" y1="62" x2="90" y2="62" stroke="white" stroke-width="2" opacity="0.6"/>
</svg>
```

Convert this SVG to PNG at the required sizes using any of these tools:
- Online: cloudconvert.com, svgtopng.com
- Command line: ImageMagick, Inkscape
- Design tools: Figma, Adobe Illustrator, Affinity Designer

## Quick Generation with ImageMagick

If you have ImageMagick installed:

```bash
# Create from SVG
convert icon.svg -resize 16x16 icon16.png
convert icon.svg -resize 48x48 icon48.png
convert icon.svg -resize 128x128 icon128.png
```

For now, the extension will work without proper icons (browsers will show a default icon), but you should add proper icons before distribution.
