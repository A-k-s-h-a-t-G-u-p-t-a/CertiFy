# PowerShell script to generate PWA icons from your existing logo
# Run this script in PowerShell to create all required icon sizes

$logoFile = "public\certify-logo.png"
$publicDir = "public"

# Function to check if ImageMagick is installed
function Test-ImageMagick {
    try {
        magick -version | Out-Null
        return $true
    }
    catch {
        return $false
    }
}

# Check if ImageMagick is installed
if (-not (Test-ImageMagick)) {
    Write-Host "ImageMagick is not installed. Please install it first:" -ForegroundColor Red
    Write-Host "Download from: https://imagemagick.org/script/download.php#windows" -ForegroundColor Yellow
    Write-Host "Or use Chocolatey: choco install imagemagick" -ForegroundColor Yellow
    exit 1
}

# Create icons of different sizes
Write-Host "Generating PWA icons from $logoFile..." -ForegroundColor Green

$sizes = @(72, 96, 128, 144, 152, 192, 384, 512)

foreach ($size in $sizes) {
    $outputFile = "$publicDir\icon-${size}x${size}.png"
    magick $logoFile -resize "${size}x${size}" $outputFile
    Write-Host "Created: $outputFile" -ForegroundColor Cyan
}

# Create Apple Touch Icon
$appleIcon = "$publicDir\apple-touch-icon.png"
magick $logoFile -resize "180x180" $appleIcon
Write-Host "Created: $appleIcon" -ForegroundColor Cyan

Write-Host "PWA icons generated successfully!" -ForegroundColor Green