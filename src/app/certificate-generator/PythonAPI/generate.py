"""
Advanced Certificate Image Generator
Uses multiple AI APIs to generate professional certificate elements
"""

import os
import sys
import json
import base64
import io
import time
try:
    import requests
except ImportError:
    print(json.dumps({"error": "requests library not installed. Run: pip install requests"}))
    sys.exit(1)

try:
    from PIL import Image, ImageDraw, ImageFont, ImageFilter
except ImportError:
    # PIL not required for basic SVG generation
    pass

def load_env_file():
    """Load environment variables from .env file"""
    env_path = os.path.join(os.path.dirname(__file__), '..', '..', '..', '..', '.env')
    if os.path.exists(env_path):
        with open(env_path, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    # Remove quotes if present
                    value = value.strip('"').strip("'")
                    os.environ[key] = value

def create_professional_certificate_svg(prompt):
    """Generate a professional SVG certificate template"""
    
    # Analyze prompt for specific elements
    elements = {
        'logo': any(word in prompt.lower() for word in ['logo', 'seal', 'crest', 'emblem', 'badge']),
        'border': any(word in prompt.lower() for word in ['border', 'frame', 'edge', 'outline']),
        'signature': any(word in prompt.lower() for word in ['signature', 'sign', 'authorization', 'validate']),
        'gold': 'gold' in prompt.lower(),
        'blue': any(word in prompt.lower() for word in ['blue', 'navy', 'royal']),
        'elegant': any(word in prompt.lower() for word in ['elegant', 'professional', 'formal', 'sophisticated']),
        'university': any(word in prompt.lower() for word in ['university', 'college', 'academic', 'education']),
    }
    
    width, height = 1024, 768
    
    # Color scheme based on prompt
    if elements['gold']:
        primary_color = "#1e40af"  # Blue
        accent_color = "#ffd700"   # Gold
        border_color = "#b8860b"   # Dark gold
    elif elements['blue']:
        primary_color = "#1e3a8a"  # Navy
        accent_color = "#3b82f6"   # Blue
        border_color = "#1e40af"   # Medium blue
    else:
        primary_color = "#374151"  # Gray
        accent_color = "#6366f1"   # Indigo
        border_color = "#4f46e5"   # Purple
    
    # SVG content
    svg_content = f'''<svg width="{width}" height="{height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
        <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#f8fafc;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#e2e8f0;stop-opacity:1" />
        </linearGradient>
        
        <linearGradient id="borderGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style="stop-color:{accent_color};stop-opacity:1" />
            <stop offset="50%" style="stop-color:#ffffff;stop-opacity:0.8" />
            <stop offset="100%" style="stop-color:{accent_color};stop-opacity:1" />
        </linearGradient>
        
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="2" dy="4" stdDeviation="3" flood-color="rgba(0,0,0,0.1)"/>
        </filter>
        
        <pattern id="watermark" patternUnits="userSpaceOnUse" width="200" height="200" patternTransform="rotate(45)">
            <text x="100" y="100" text-anchor="middle" font-size="24" fill="rgba(0,0,0,0.05)" font-family="serif">AUTHENTIC</text>
        </pattern>
    </defs>
    
    <!-- Background with watermark -->
    <rect width="100%" height="100%" fill="url(#bgGradient)" />
    <rect width="100%" height="100%" fill="url(#watermark)" />'''

    if elements['border']:
        svg_content += f'''
    
    <!-- Decorative Border -->
    <rect x="30" y="30" width="{width-60}" height="{height-60}" 
          fill="none" stroke="url(#borderGradient)" stroke-width="12" rx="15" filter="url(#shadow)" />
    <rect x="45" y="45" width="{width-90}" height="{height-90}" 
          fill="none" stroke="{border_color}" stroke-width="3" rx="8" />
    
    <!-- Corner decorations -->
    <circle cx="80" cy="80" r="25" fill="none" stroke="{accent_color}" stroke-width="3" />
    <circle cx="{width-80}" cy="80" r="25" fill="none" stroke="{accent_color}" stroke-width="3" />
    <circle cx="80" cy="{height-80}" r="25" fill="none" stroke="{accent_color}" stroke-width="3" />
    <circle cx="{width-80}" cy="{height-80}" r="25" fill="none" stroke="{accent_color}" stroke-width="3" />'''

    if elements['logo']:
        svg_content += f'''
    
    <!-- Institution Logo/Seal -->
    <circle cx="{width//2}" cy="140" r="50" fill="{primary_color}" stroke="{accent_color}" stroke-width="4" filter="url(#shadow)" />
    <circle cx="{width//2}" cy="140" r="35" fill="none" stroke="{accent_color}" stroke-width="2" />
    <text x="{width//2}" y="150" text-anchor="middle" fill="white" font-size="20" font-weight="bold" font-family="serif">SEAL</text>
    <text x="{width//2}" y="165" text-anchor="middle" fill="{accent_color}" font-size="10" font-family="serif">OFFICIAL</text>'''

    # Main certificate content
    title_y = 220 if elements['logo'] else 160
    svg_content += f'''
    
    <!-- Certificate Title -->
    <text x="{width//2}" y="{title_y}" text-anchor="middle" 
          font-size="54" font-weight="bold" fill="{primary_color}" font-family="serif" filter="url(#shadow)">
        CERTIFICATE
    </text>
    
    <text x="{width//2}" y="{title_y + 35}" text-anchor="middle" 
          font-size="22" fill="{primary_color}" font-family="serif" font-style="italic">
        of Achievement
    </text>
    
    <!-- Certificate Body Text -->
    <text x="{width//2}" y="{title_y + 80}" text-anchor="middle" 
          font-size="24" fill="#374151" font-family="serif">
        This is to certify that
    </text>
    
    <!-- Student Name Placeholder -->
    <rect x="{width//2 - 200}" y="{title_y + 100}" width="400" height="50" 
          fill="none" stroke="#d1d5db" stroke-width="2" rx="5" stroke-dasharray="5,5" />
    <text x="{width//2}" y="{title_y + 135}" text-anchor="middle" 
          font-size="32" font-weight="bold" fill="{primary_color}" font-family="serif">
        [Student Name]
    </text>
    
    <text x="{width//2}" y="{title_y + 170}" text-anchor="middle" 
          font-size="24" fill="#374151" font-family="serif">
        has successfully completed the requirements for
    </text>
    
    <!-- Course Name Placeholder -->
    <rect x="{width//2 - 250}" y="{title_y + 185}" width="500" height="45" 
          fill="none" stroke="#d1d5db" stroke-width="2" rx="5" stroke-dasharray="5,5" />
    <text x="{width//2}" y="{title_y + 220}" text-anchor="middle" 
          font-size="28" font-weight="bold" fill="{primary_color}" font-family="serif">
        [Course/Program Name]
    </text>'''

    if elements['signature']:
        svg_content += f'''
    
    <!-- Signature Lines -->
    <line x1="150" y1="{height-120}" x2="350" y2="{height-120}" stroke="#374151" stroke-width="2" />
    <text x="250" y="{height-95}" text-anchor="middle" font-size="16" fill="#6b7280" font-family="serif">Director Signature</text>
    
    <line x1="{width-350}" y1="{height-120}" x2="{width-150}" y2="{height-120}" stroke="#374151" stroke-width="2" />
    <text x="{width-250}" y="{height-95}" text-anchor="middle" font-size="16" fill="#6b7280" font-family="serif">Date Awarded</text>
    
    <!-- Official Stamp Area -->
    <circle cx="{width//2}" cy="{height-80}" r="35" fill="none" stroke="{accent_color}" stroke-width="3" stroke-dasharray="3,2" />
    <text x="{width//2}" y="{height-75}" text-anchor="middle" font-size="12" fill="#6b7280" font-family="serif">OFFICIAL</text>
    <text x="{width//2}" y="{height-65}" text-anchor="middle" font-size="12" fill="#6b7280" font-family="serif">STAMP</text>'''

    # Add institution name if university context
    if elements['university']:
        svg_content += f'''
    
    <text x="{width//2}" y="{height-35}" text-anchor="middle" 
          font-size="18" fill="{primary_color}" font-family="serif" font-weight="bold">
        [Institution Name]
    </text>'''
    else:
        svg_content += f'''
    
    <text x="{width//2}" y="{height-35}" text-anchor="middle" 
          font-size="16" fill="#6b7280" font-family="serif">
        Professional Certificate Template
    </text>'''

    svg_content += '\n</svg>'
    
    return svg_content

def generate_with_pollinations(prompt):
    """Generate image using Pollinations AI"""
    try:
        enhanced_prompt = f"professional certificate design {prompt} elegant typography formal document high quality"
        encoded_prompt = requests.utils.quote(enhanced_prompt)
        
        # Try multiple Pollinations endpoints for reliability
        endpoints = [
            f"https://pollinations.ai/p/{encoded_prompt}?width=1024&height=768&seed={int(time.time())}",
            f"https://image.pollinations.ai/prompt/{encoded_prompt}?width=1024&height=768&seed={int(time.time())}&enhance=true"
        ]
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        
        print("Trying Pollinations AI...", file=sys.stderr)
        
        for url in endpoints:
            try:
                response = requests.get(url, headers=headers, timeout=15)
                
                if response.status_code == 200:
                    image_data = response.content
                    
                    if len(image_data) > 1000:
                        base64_data = base64.b64encode(image_data).decode('utf-8')
                        print("Successfully generated image with Pollinations AI", file=sys.stderr)
                        return f"data:image/png;base64,{base64_data}"
                        
            except Exception as e:
                print(f"Endpoint failed: {e}", file=sys.stderr)
                continue
        
        raise Exception("All Pollinations endpoints failed")
        
    except Exception as e:
        if "timeout" in str(e).lower():
            raise Exception("Pollinations API timeout - please try again")
        raise e

def main():
    try:
        # Load environment variables
        load_env_file()
        
        if len(sys.argv) < 2:
            raise Exception("No prompt provided")
        
        prompt = sys.argv[1].strip()
        if not prompt:
            raise Exception("Empty prompt provided")
        
        # Try different generation methods
        result = None
        
        # Method 1: Try Pollinations AI
        try:
            result = generate_with_pollinations(prompt)
            if result:
                print(json.dumps({"url": result}))
                return
        except Exception as e:
            print(f"Pollinations failed: {e}", file=sys.stderr)
        
        # Method 2: Fallback to SVG template
        svg_content = create_professional_certificate_svg(prompt)
        svg_base64 = base64.b64encode(svg_content.encode('utf-8')).decode('utf-8')
        result = f"data:image/svg+xml;base64,{svg_base64}"
        
        print(json.dumps({"url": result}))
        
    except Exception as e:
        print(json.dumps({"error": str(e)}))

if __name__ == "__main__":
    main()
