# file: compare_certificates_enhanced.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import torch
import torch.nn as nn
from torchvision import models, transforms
from PIL import Image
import io
import cv2
import numpy as np
import fitz  # PyMuPDF

app = Flask(__name__)
CORS(app)

# ------------------- Deep Learning Model Setup -------------------
resnet_model = models.resnet50(pretrained=True)
resnet_model = nn.Sequential(*list(resnet_model.children())[:-1])
resnet_model.eval()
cos = nn.CosineSimilarity(dim=1, eps=1e-6)

preprocess = transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406],
                         std=[0.229, 0.224, 0.225])
])

# ------------------- File Loader -------------------
def load_image(file_bytes, file_type):
    """Load file as PIL Image (handles both PDFs and images)."""
    if file_type == "normal":  # PDF
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        page = doc[0]  # first page only
        pix = page.get_pixmap(dpi=300)
        img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
        doc.close()
    else:  # scanned -> jpg/png
        img = Image.open(io.BytesIO(file_bytes)).convert("RGB")
    return img

# ------------------- Deep Features -------------------
def extract_features(image):
    img_t = preprocess(image).unsqueeze(0)
    with torch.no_grad():
        features = resnet_model(img_t)
    return features

# ------------------- SIFT Matching -------------------
def sift_similarity(img1_pil, img2_pil):
    img1 = cv2.cvtColor(np.array(img1_pil), cv2.COLOR_RGB2GRAY)
    img2 = cv2.cvtColor(np.array(img2_pil), cv2.COLOR_RGB2GRAY)

    sift = cv2.SIFT_create()
    kp1, des1 = sift.detectAndCompute(img1, None)
    kp2, des2 = sift.detectAndCompute(img2, None)

    if des1 is None or des2 is None:
        return 0.0

    bf = cv2.BFMatcher()
    matches = bf.knnMatch(des1, des2, k=2)

    good_matches = []
    for m, n in matches:
        if m.distance < 0.75 * n.distance:
            good_matches.append(m)

    if len(kp1) == 0 or len(kp2) == 0:
        return 0.0

    similarity_score = len(good_matches) / min(len(kp1), len(kp2))
    return similarity_score

# ------------------- Flask Route -------------------
@app.route("/compare-images", methods=["POST"])
def compare_images():
    if 'file1' not in request.files or 'file2' not in request.files:
        return jsonify({"error": "Both files are required"}), 400

    file1 = request.files['file1']
    file2 = request.files['file2']
    file_type1 = request.form.get("file_type1", "scanned")
    file_type2 = request.form.get("file_type2", "scanned")

    try:
        img1 = load_image(file1.read(), file_type1)
        file1.seek(0)
        img2 = load_image(file2.read(), file_type2)
        file2.seek(0)

        # Deep Learning Similarity
        feat1 = extract_features(img1)
        feat2 = extract_features(img2)
        similarity_dl = cos(feat1, feat2).item()
        is_same_dl = similarity_dl >= 0.95

        # SIFT Similarity
        sift_score = sift_similarity(img1, img2)
        is_same_sift = sift_score >= 0.75

        return jsonify({
            "results": {
                "deep_learning_similarity": similarity_dl,
                "deep_learning_match": is_same_dl,
                "sift_similarity": sift_score,
                "sift_match": is_same_sift
            }
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ------------------- Run Flask -------------------
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
