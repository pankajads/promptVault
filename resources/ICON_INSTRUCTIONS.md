# Icon Creation Instructions

To create a professional 128x128 PNG icon for your extension:

## Option 1: Use Online Tool
1. Visit: https://www.canva.com or https://www.figma.com
2. Create a 128x128 pixel design
3. Use these design elements:
   - Blue background (#007ACC - VS Code blue)
   - Vault/safe icon with document/text elements
   - Clean, modern design
   - High contrast for visibility

## Option 2: Use AI Image Generator
1. Use DALL-E, Midjourney, or similar
2. Prompt: "128x128 pixel icon for VS Code extension, blue vault with documents, modern flat design, professional software icon"

## Option 3: Convert the SVG
1. Install ImageMagick: `brew install imagemagick`
2. Convert: `convert resources/icon.svg -resize 128x128 resources/icon.png`

## Current Status
- SVG icon created ✓
- Need PNG conversion for VS Code compatibility
- Design represents: Vault (security) + AI elements (colored dots) + Documents (prompt storage)

Once you have the PNG, update package.json:
```json
"icon": "resources/icon.png"
```
