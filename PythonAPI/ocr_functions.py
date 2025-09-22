from flask import Flask, request, jsonify
import cv2
import pytesseract
from PIL import Image
import re
import spacy
import numpy as np
import io
import base64
from pdf2image import convert_from_bytes  
import os
import json
import google.generativeai as genai
from dotenv import load_dotenv
from flask_cors import CORS

pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

# ------------------- Flask App -------------------
app = Flask(__name__)
CORS(app, origins=["http://localhost:3000"], supports_credentials=True)
# Load spaCy English model
nlp = spacy.load("en_core_web_sm")

# Initialize Gemini Client
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", ".env"))
api_key = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=api_key)


def load_document_from_bytes(file_bytes, filename="file"):
    """
    Convert Base64 bytes to list of OpenCV images
    Supports PDFs and images
    """
    images = []
    try:
        if filename.lower().endswith(".pdf"):
            # PDF → convert pages to images
            # Specify poppler path if not in PATH
            poppler_path = r'C:\Program Files\poppler-25.07.0\Library\bin'  # Adjust this path
            pages = convert_from_bytes(file_bytes, dpi=300, poppler_path=poppler_path)
            for page in pages:
                img_bytes = io.BytesIO()
                page.save(img_bytes, format="PNG")
                img_bytes.seek(0)
                img = cv2.imdecode(np.frombuffer(img_bytes.read(), np.uint8), cv2.IMREAD_COLOR)
                images.append(img)
        else:
            # Treat as image
            img = cv2.imdecode(np.frombuffer(file_bytes, np.uint8), cv2.IMREAD_COLOR)
            images.append(img)
    except Exception as e:
        raise ValueError(f"Failed to load document: {e}")
    return images

def extract_text(img):
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    _, thresh = cv2.threshold(gray, 150, 255, cv2.THRESH_BINARY)
    text = pytesseract.image_to_string(thresh)
    return text

def clean_json(text):
    text = re.sub(r"^```json\s*", "", text, flags=re.IGNORECASE | re.MULTILINE)
    text = re.sub(r"\s*```$", "", text, flags=re.MULTILINE)
    return text.strip()

def extract_fields_with_gemini(text):
    prompt = f"""
You are an AI trained to extract information from certificates. 
From the certificate text below, extract the following fields:
- Name of the recipient
- Name of the organisation
- Degree name
- Year of completion
- Honors or distinction if mentioned
- Roll number
- Grade
- Organisation

- certificateId

Return the result as a valid JSON object only, JSON object ONLY, without any explanations, comments, or extra text with keys "name", "degree", "year", "honors", "roll_number", "grade", "organisation", "certificateId".
If a field is not found, use null for that field.

Certificate Text:
\"\"\"{text}\"\"\"
"""
    
    model = genai.GenerativeModel("gemini-1.5-flash")
    response = model.generate_content(prompt)

    output_text = response.text.strip()
    cleaned_text = clean_json(output_text)

    try:
        extracted_fields = json.loads(cleaned_text)
    except json.JSONDecodeError:
        extracted_fields = {"error": "Failed to parse JSON", "raw_output": output_text}
    
    return extracted_fields


# ------------------- Flask Route -------------------

@app.route("/extract", methods=["POST"])
def extract_certificate_fields():
    """
    Accepts JSON body:
    {
        "filename": "certificate.pdf",
        "b64": "<Base64 encoded file>"
    }
    """
    print("🔄 OCR extraction endpoint called")
    
    data = request.get_json()
    print(f"📨 Received data keys: {list(data.keys()) if data else 'None'}")
    
    if not data or "b64" not in data:
        print("❌ No Base64 data provided")
        return jsonify({"error": "No Base64 data provided"}), 400

    file_b64 = data["b64"]
    filename = data.get("filename", "file.png")  # default extension if not provided
    print(f"📁 Processing file: {filename}")

    try:
        print("🔓 Decoding Base64 data...")
        file_bytes = base64.b64decode(file_b64)
        print(f"✅ Base64 decoded successfully, size: {len(file_bytes)} bytes")
    except Exception as e:
        print(f"❌ Base64 decode error: {e}")
        return jsonify({"error": f"Invalid Base64: {e}"}), 400

    try:
        print("📖 Loading document from bytes...")
        images = load_document_from_bytes(file_bytes, filename)
        print(f"✅ Document loaded, {len(images)} pages/images found")
    except Exception as e:
        print(f"❌ Document loading error: {e}")
        return jsonify({"error": str(e)}), 500

    all_results = []
    for idx, img in enumerate(images):
        print(f"🔍 Processing page/image {idx + 1}...")
        try:
            ocr_text = extract_text(img)
            print(f"📝 OCR text extracted (length: {len(ocr_text)})")
            print(f"OCR Text preview: {ocr_text[:200]}...")
            
            fields = extract_fields_with_gemini(ocr_text)
            print(f"🤖 Gemini fields extracted: {fields}")
            
            all_results.append({"page": idx + 1, "ocr_text": ocr_text, "fields": fields})
        except Exception as e:
            print(f"❌ Error processing page {idx + 1}: {e}")
            all_results.append({"page": idx + 1, "error": str(e)})

    print(f"🎯 Final results: {all_results}")
    return jsonify({"results": all_results})


# ------------------- Run Server -------------------
if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5001)

    

# def load_document(file_path):
#     images = []
#     if file_path.lower().endswith(".pdf"):
#         pages = convert_from_path(file_path, dpi=300)
#         for i, page in enumerate(pages):
#             img_path = f"temp_page_{i}.png"
#             page.save(img_path, "PNG")
#             img = cv2.imread(img_path)
#             images.append(img)
#     else:
#         images.append(cv2.imread(file_path))
#     return images

# def extract_text(img):
#     gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
#     _, thresh = cv2.threshold(gray, 150, 255, cv2.THRESH_BINARY)
#     text = pytesseract.image_to_string(thresh)
#     return text

# def clean_json(text):
#     text = re.sub(r"^```json\s*", "", text, flags=re.IGNORECASE | re.MULTILINE)
#     text = re.sub(r"\s*```$", "", text, flags=re.MULTILINE)
#     return text.strip()

# def extract_fields_with_gemini(text):
#     prompt = f"""
# You are an AI trained to extract information from certificates. 
# From the certificate text below, extract the following fields:
# - Name of the recipient
# - Degree name
# - Year of completion
# - Honors or distinction if mentioned
# - Roll number
# - Grade
# - Certificate ID

# Return the result as a valid JSON object only, JSON object ONLY, without any explanations, comments, or extra text with keys "name", "degree", "year", "honors", "roll_number", "grade","certificate_id".
# If a field is not found, use null for that field.

# Certificate Text:
# \"\"\"{text}\"\"\""""
    
#     response = client.models.generate_content(
#         model="gemini-2.0-flash-001", 
#         contents=prompt
#     )

#     output_text = response.text.strip()
#     cleaned_text = clean_json(output_text)

#     try:
#         extracted_fields = json.loads(cleaned_text)
#     except json.JSONDecodeError:
#         extracted_fields = {"error": "Failed to parse JSON", "raw_output": output_text}
    
#     return extracted_fields

# # Flask Routes 
# @app.route("/extract", methods=["POST"])
# def extract_certificate_fields():
#     if "file" not in request.files:
#         return jsonify({"error": "No file uploaded"}), 400
    
#     file = request.files["file"]
#     file_path = os.path.join("uploads", file.filename)
#     os.makedirs("uploads", exist_ok=True)
#     file.save(file_path)

#     # Process document
#     images = load_document(file_path)
#     all_results = []

#     for idx, img in enumerate(images):
#         ocr_text = extract_text(img)
#         fields = extract_fields_with_gemini(ocr_text)
#         all_results.append({"page": idx + 1, "ocr_text": ocr_text, "fields": fields})

#     return jsonify({"results": all_results})

# # Run Server
# if __name__ == "__main__":
#     app.run(debug=True, host="0.0.0.0", port=5001)
