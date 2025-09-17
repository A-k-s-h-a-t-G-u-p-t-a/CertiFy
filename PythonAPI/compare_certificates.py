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

def extract_features(image_bytes):
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    img_t = preprocess(img).unsqueeze(0)
    with torch.no_grad():
        features = resnet_model(img_t)
    return features

# ------------------- SIFT Matching -------------------
def sift_similarity(file_bytes1, file_bytes2):
    # Read images as grayscale
    img1 = cv2.imdecode(np.frombuffer(file_bytes1, np.uint8), cv2.IMREAD_GRAYSCALE)
    img2 = cv2.imdecode(np.frombuffer(file_bytes2, np.uint8), cv2.IMREAD_GRAYSCALE)

    # Initialize SIFT detector
    sift = cv2.SIFT_create()
    kp1, des1 = sift.detectAndCompute(img1, None)
    kp2, des2 = sift.detectAndCompute(img2, None)

    # BFMatcher with default params
    bf = cv2.BFMatcher()
    matches = bf.knnMatch(des1, des2, k=2)

    # Apply ratio test as per Lowe's paper
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

    try:
        # ------------------- Deep Learning Similarity -------------------
        feat1 = extract_features(file1.read())
        file1.seek(0)  # reset buffer
        feat2 = extract_features(file2.read())
        file2.seek(0)

        similarity_dl = cos(feat1, feat2).item()
        is_same_dl = similarity_dl >= 0.95

        # ------------------- SIFT Similarity -------------------
        sift_score = sift_similarity(file1.read(), file2.read())
        is_same_sift = sift_score >= 0.75  # adjust threshold experimentally

        return jsonify({
            "deep_learning_similarity": similarity_dl,
            "deep_learning_match": is_same_dl,
            "sift_similarity": sift_score,
            "sift_match": is_same_sift
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ------------------- Run Flask -------------------
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
