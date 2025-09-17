# file: compare_certificates.py
from flask import Flask, request, jsonify
import torch
from flask_cors import CORS
import torch.nn as nn
from torchvision import models, transforms
from PIL import Image
import io

app = Flask(__name__)
CORS(app)
# ------------------- Model Setup -------------------
# Load pretrained ResNet50 and remove the last classification layer
resnet_model = models.resnet50(pretrained=True)
resnet_model = nn.Sequential(*list(resnet_model.children())[:-1])
resnet_model.eval()  # Set to evaluation mode

# Cosine similarity
cos = nn.CosineSimilarity(dim=1, eps=1e-6)

# Image preprocessing
preprocess = transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406],
                         std=[0.229, 0.224, 0.225])
])

def extract_features(image_bytes):
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    img_t = preprocess(img).unsqueeze(0)  # Add batch dimension
    with torch.no_grad():
        features = resnet_model(img_t)
    return features

# ------------------- API Route -------------------
@app.route("/compare-images", methods=["POST"])
def compare_images():
    """
    Expects a multipart/form-data POST request with:
    - file1: first certificate image
    - file2: second certificate image
    """
    if 'file1' not in request.files or 'file2' not in request.files:
        return jsonify({"error": "Both files are required"}), 400

    file1 = request.files['file1']
    file2 = request.files['file2']

    try:
        # Extract features
        feat1 = extract_features(file1.read())
        feat2 = extract_features(file2.read())

        # Compute cosine similarity
        similarity = cos(feat1, feat2).item()
        threshold = 0.95  # You can adjust this based on experiments
        is_same = similarity >= threshold

        return jsonify({
            "similarity": similarity,
            "is_same": is_same
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ------------------- Run Flask -------------------
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
