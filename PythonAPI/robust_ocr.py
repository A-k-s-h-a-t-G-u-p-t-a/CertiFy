# file: robust_ocr.py
from flask import Flask, request, jsonify
import easyocr
import numpy as np
from flask_cors import CORS
from PIL import Image
import io
from pdf2image import convert_from_path

app = Flask(__name__)
CORS(app)
# Initialize EasyOCR reader (English)
reader = easyocr.Reader(['en'], gpu=False)  # Set gpu=True if you have GPU

# ----------------- Helper Functions -----------------
def load_document(file_bytes, filename):
    images = []
    if filename.lower().endswith(".pdf"):
        with open("temp.pdf", "wb") as f:
            f.write(file_bytes)
        pages = convert_from_path("temp.pdf", dpi=300)
        for page in pages:
            img_path = "temp_page.png"
            page.save(img_path, "PNG")
            images.append(Image.open(img_path).convert("RGB"))
    else:
        img = Image.open(io.BytesIO(file_bytes)).convert("RGB")
        images.append(img)
    return images

def extract_text(img):
    """
    Uses EasyOCR to extract text from PIL Image.
    Returns the full concatenated string.
    """
    results = reader.readtext(np.array(img), detail=0)  # detail=0 returns plain text
    return "\n".join(results)

# ----------------- Flask Route -----------------
@app.route("/robust-ocr", methods=["POST"])
def robust_ocr():
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files['file']
    try:
        images = load_document(file.read(), file.filename)
        results = []

        for idx, img in enumerate(images):
            text = extract_text(img)
            results.append({
                "page": idx + 1,
                "text": text
            })

        return jsonify({"results": results})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ----------------- Run Flask -----------------
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)
