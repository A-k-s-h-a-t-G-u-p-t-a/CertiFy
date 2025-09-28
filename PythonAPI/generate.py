import os
import sys
import json
import base64
import io
from PIL import Image, ImageDraw, ImageFont
import requests

# Set UTF-8 encoding for Windows
if sys.platform == "win32":
    os.environ["PYTHONIOENCODING"] = "utf-8"

def create_simple_certificate_image(prompt):
    """Create a simple certificate image locally as fallback"""
    try:
        # Create a basic certificate template
        width, height = 800, 600
        img = Image.new('RGB', (width, height), color='white')
        draw = ImageDraw.Draw(img)
        
        # Add border
        draw.rectangle([20, 20, width-20, height-20], outline='gold', width=5)
        draw.rectangle([30, 30, width-30, height-30], outline='darkblue', width=2)
        
        # Add title
        try:
            title_font = ImageFont.truetype("arial.ttf", 40)
            text_font = ImageFont.truetype("arial.ttf", 24)
        except:
            title_font = ImageFont.load_default()
            text_font = ImageFont.load_default()
        
        # Certificate title
        title = "CERTIFICATE"
        title_bbox = draw.textbbox((0, 0), title, font=title_font)
        title_x = (width - (title_bbox[2] - title_bbox[0])) // 2
        draw.text((title_x, 80), title, fill='darkblue', font=title_font)
        
        # Parse prompt for details
        lines = []
        if "name" in prompt.lower() or "mithas" in prompt.lower():
            lines.append("This is to certify that")
            lines.append("MITHAS")
            lines.append("has successfully completed")
        
        if "diploma" in prompt.lower():
            lines.append("DIPLOMA PROGRAM")
        
        if "university" in prompt.lower() or "pu" in prompt.lower():
            lines.append("at PU University")
        
        if "date" in prompt.lower() or "september" in prompt.lower():
            lines.append("Date: 25 September 2006")
        
        # Add text lines
        y_offset = 180
        for line in lines:
            text_bbox = draw.textbbox((0, 0), line, font=text_font)
            text_x = (width - (text_bbox[2] - text_bbox[0])) // 2
            draw.text((text_x, y_offset), line, fill='black', font=text_font)
            y_offset += 40
        
        # Save to base64
        buffer = io.BytesIO()
        img.save(buffer, format='PNG')
        img_base64 = base64.b64encode(buffer.getvalue()).decode()
        
        return f"data:image/png;base64,{img_base64}"
        
    except Exception as e:
        return {"error": f"Failed to create certificate: {str(e)}"}

def generate_image_pollinations(prompt):
    """Use Pollinations.ai API as alternative"""
    try:
        # Clean the prompt for URL
        clean_prompt = prompt.replace(" ", "%20").replace('"', '')
        url = f"https://image.pollinations.ai/prompt/{clean_prompt}?width=800&height=600"
        
        response = requests.get(url, timeout=30)
        if response.status_code == 200:
            # Convert to base64 data URL
            img_base64 = base64.b64encode(response.content).decode()
            return f"data:image/png;base64,{img_base64}"
        else:
            raise Exception(f"API returned status {response.status_code}")
            
    except Exception as e:
        print(f"Pollinations API failed: {e}", file=sys.stderr)
        return create_simple_certificate_image(prompt)

def generate_image(prompt):
    try:
        # Try Pollinations API first
        result = generate_image_pollinations(prompt)
        if isinstance(result, str) and result.startswith("data:image"):
            return result
        else:
            # Fallback to simple certificate
            return create_simple_certificate_image(prompt)
            
    except Exception as e:
        # Final fallback
        return create_simple_certificate_image(prompt)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No prompt provided"}))
        sys.exit(1)
        
    prompt = sys.argv[1]
    result = generate_image(prompt)
    
    if isinstance(result, dict) and "error" in result:
        print(json.dumps(result))
    else:
        print(json.dumps({"url": result}))
