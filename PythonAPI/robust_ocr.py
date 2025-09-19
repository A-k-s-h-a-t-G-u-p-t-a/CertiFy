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

# ----------------- Helper Functions (REVISED) -----------------
def load_document(file_bytes, file_type):
    """
    Load a scanned image or a PDF page as a PIL Image.
    This function has been revised for more robust PDF handling.
    """
    images = []

    if file_type == "normal":  # PDF
        try:
            doc = fitz.open(stream=file_bytes, filetype="pdf")
            # Loop over all pages in the PDF
            for page in doc:
                pix = page.get_pixmap(dpi=300)

                # Convert pixmap to a standard format (like PNG) in memory and
                # then load it with PIL. This handles different color spaces reliably.
                img_data = pix.tobytes("png")
                img = Image.open(io.BytesIO(img_data))

                # Ensure the image is in RGB format, as required by EasyOCR.
                if img.mode != 'RGB':
                    img = img.convert('RGB')

                images.append(img)
            doc.close()
        except Exception as e:
            # Propagate error with more context
            raise RuntimeError(f"Failed to process PDF file: {e}") from e

    elif file_type == "scanned":  # JPG/PNG
        img = Image.open(io.BytesIO(file_bytes)).convert("RGB")
        images.append(img)

    else:
        raise ValueError("Invalid file type. Use 'scanned' or 'normal'.")

    return images

def extract_text(img):
    """Uses EasyOCR to extract text from a PIL Image."""
    # detail=0 returns a list of plain text strings
    results = reader.readtext(np.array(img), detail=0)
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
            # Add a separator for multi-page documents
            if full_text:
                full_text += "\n\n--- Page Break ---\n\n"
            full_text += extract_text(img)

        return jsonify({"results": full_text.strip()})

    except Exception as e:
        return jsonify({"error": f"An unexpected error occurred: {str(e)}"}), 500

# ----------------- Run Flask -----------------
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)
