# file: robust_ocr.py
from flask import Flask, request, jsonify
import easyocr
import numpy as np
from flask_cors import CORS
from PIL import Image
import io
import fitz  # PyMuPDF

app = Flask(__name__)
CORS(app)

# Initialize EasyOCR reader (English)
reader = easyocr.Reader(['en'], gpu=False)  # Set gpu=True if you have GPU

# ----------------- Helper Functions -----------------
def load_document(file_bytes, file_type):
    images = []
    if file_type == "normal":  # PDF
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        page = doc[0]  # first page only
        pix = page.get_pixmap(dpi=300)
        img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
        images.append(img)
        doc.close()
    elif file_type == "scanned":  # JPG/PNG
        img = Image.open(io.BytesIO(file_bytes)).convert("RGB")
        images.append(img)
    else:
        raise ValueError("Invalid file type. Use 'scanned' or 'normal'.")
    return images

def extract_text(img):
    """Uses EasyOCR to extract text from a PIL Image."""
    results = reader.readtext(np.array(img), detail=0)  # detail=0 returns plain text
    return "\n".join(results)

# ----------------- Flask Route -----------------
@app.route("/robust-ocr", methods=["POST"])
def robust_ocr():
    if 'file' not in request.files or 'type' not in request.form:
        return jsonify({"error": "Missing file or type (expected 'scanned' or 'normal')"}), 400

    file = request.files['file']
    file_type = request.form['type']  # "scanned" | "normal"

    try:
        images = load_document(file.read(), file_type)
        if not images:
            return jsonify({"results": ""})

        # Concatenate all page texts into one string
        full_text = ""
        for img in images:
            full_text += extract_text(img) + "\n"

        return jsonify({"results": full_text.strip()})

    except Exception as e:
        return jsonify({"results": f"Error: {str(e)}"})

# ----------------- Run Flask -----------------
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)
