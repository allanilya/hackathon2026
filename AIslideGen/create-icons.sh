#!/bin/bash

# Script to create all required icon sizes for Microsoft AppSource
# Requires: ImageMagick (brew install imagemagick)

SOURCE_ICON="assets/logo.png"
OUTPUT_DIR="assets/icons"

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null; then
    echo "ImageMagick is not installed. Please install it first:"
    echo "  brew install imagemagick"
    exit 1
fi

# Check if source icon exists
if [ ! -f "$SOURCE_ICON" ]; then
    echo "Source icon not found: $SOURCE_ICON"
    exit 1
fi

# Create output directory
mkdir -p "$OUTPUT_DIR"

echo "Creating icon variants from $SOURCE_ICON..."

# Required sizes for Office Add-in manifest
convert "$SOURCE_ICON" -resize 16x16 "$OUTPUT_DIR/icon-16.png"
echo "✓ Created 16x16 icon"

convert "$SOURCE_ICON" -resize 32x32 "$OUTPUT_DIR/icon-32.png"
echo "✓ Created 32x32 icon"

convert "$SOURCE_ICON" -resize 80x80 "$OUTPUT_DIR/icon-80.png"
echo "✓ Created 80x80 icon"

# Additional sizes for AppSource listing
convert "$SOURCE_ICON" -resize 128x128 "$OUTPUT_DIR/icon-128.png"
echo "✓ Created 128x128 icon (for store listing)"

convert "$SOURCE_ICON" -resize 256x256 "$OUTPUT_DIR/icon-256.png"
echo "✓ Created 256x256 icon (high-res store listing)"

# Keep original as high-res
cp "$SOURCE_ICON" "$OUTPUT_DIR/icon-1024.png"
echo "✓ Copied original as icon-1024.png"

echo ""
echo "All icons created successfully in $OUTPUT_DIR/"
echo ""
echo "Next steps:"
echo "1. Review the icons to ensure they look good at small sizes"
echo "2. Update manifest.xml to reference these new icon paths"
echo "3. Upload icons to your production hosting"
