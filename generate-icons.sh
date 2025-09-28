#!/bin/bash

# This script helps generate PWA icons from your existing logo
# You can run this script to create all required icon sizes

LOGO_FILE="certify-logo.png"

# Check if ImageMagick is installed
if ! command -v magick &> /dev/null; then
    echo "ImageMagick is not installed. Please install it first:"
    echo "Windows: Download from https://imagemagick.org/script/download.php#windows"
    echo "Mac: brew install imagemagick"
    echo "Ubuntu: sudo apt-get install imagemagick"
    exit 1
fi

# Create icons of different sizes
echo "Generating PWA icons from $LOGO_FILE..."

magick $LOGO_FILE -resize 72x72 icon-72x72.png
magick $LOGO_FILE -resize 96x96 icon-96x96.png
magick $LOGO_FILE -resize 128x128 icon-128x128.png
magick $LOGO_FILE -resize 144x144 icon-144x144.png
magick $LOGO_FILE -resize 152x152 icon-152x152.png
magick $LOGO_FILE -resize 192x192 icon-192x192.png
magick $LOGO_FILE -resize 384x384 icon-384x384.png
magick $LOGO_FILE -resize 512x512 icon-512x512.png

# Create Apple Touch Icon
magick $LOGO_FILE -resize 180x180 apple-touch-icon.png

echo "PWA icons generated successfully!"
echo "Icons created:"
echo "- icon-72x72.png"
echo "- icon-96x96.png" 
echo "- icon-128x128.png"
echo "- icon-144x144.png"
echo "- icon-152x152.png"
echo "- icon-192x192.png"
echo "- icon-384x384.png"
echo "- icon-512x512.png"
echo "- apple-touch-icon.png"