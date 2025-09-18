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
from google import genai
from dotenv import load_dotenv

# ------------------- Flask App -------------------
app = Flask(__name__)

# Load spaCy English model
nlp = spacy.load("en_core_web_sm")

# Initialize Gemini Client
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", ".env"))
api_key = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=api_key)


def load_document_from_bytes(file_bytes, filename="file"):
    """
    Convert Base64 bytes to list of OpenCV images
    Supports PDFs and images
    """
    images = []
    try:
        if filename.lower().endswith(".pdf"):
            # PDF → convert pages to images
            pages = convert_from_bytes(file_bytes, dpi=300)
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
- Degree name
- Year of completion
- Honors or distinction if mentioned
- Roll number
- Grade
- Certificate ID

Return the result as a valid JSON object only, JSON object ONLY, without any explanations, comments, or extra text with keys "name", "degree", "year", "honors", "roll_number", "grade","certificate_id".
If a field is not found, use null for that field.

Certificate Text:
\"\"\"{text}\"\"\"
"""
    
    response = client.models.generate_content(
        model="gemini-2.0-flash-001", 
        contents=prompt
    )

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
    data = request.get_json()
    if not data or "b64" not in data:
        return jsonify({"error": "No Base64 data provided"}), 400

    file_b64 = data["b64"]
    filename = data.get("filename", "file.png")  # default extension if not provided

    try:
        file_bytes = base64.b64decode(file_b64)
    except Exception as e:
        return jsonify({"error": f"Invalid Base64: {e}"}), 400

    try:
        images = load_document_from_bytes(file_bytes, filename)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    all_results = []
    for idx, img in enumerate(images):
        ocr_text = extract_text(img)
        fields = extract_fields_with_gemini(ocr_text)
        all_results.append({"page": idx + 1, "ocr_text": ocr_text, "fields": fields})

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
