from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image
import io
import fitz  # PyMuPDF
import torch
from torchvision import models, transforms
import cv2
import numpy as np
from ultralytics import YOLO
import base64

app = Flask(__name__)
CORS(app, origins=["http://localhost:3000"], supports_credentials=True)

# ---------------- Models and Helpers ----------------
yolo_model = YOLO(r"../models/my_model.pt")
resnet_model = models.resnet50(pretrained=True)
resnet_model = torch.nn.Sequential(*list(resnet_model.children())[:-1])
resnet_model.eval()
cos = torch.nn.CosineSimilarity(dim=1, eps=1e-6)

preprocess = transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

def decode_base64_to_bytes(b64_string):
    if "," in b64_string:
        b64_string = b64_string.split(",")[1]
    return base64.b64decode(b64_string)

def load_image_universal(file_bytes):
    try:
        img = Image.open(io.BytesIO(file_bytes)).convert("RGB")
        return img
    except Exception:
        try:
            doc = fitz.open(stream=file_bytes, filetype="pdf")
            if not doc:
                raise RuntimeError("PDF file is empty or corrupted.")
            page = doc.load_page(0)
            pix = page.get_pixmap(dpi=300)
            doc.close()
            img_data = pix.tobytes("png")
            img = Image.open(io.BytesIO(img_data)).convert("RGB")
            return img
        except Exception as e:
            raise RuntimeError(f"Failed to process file. Unsupported format or corrupted file. Error: {e}")

def crop_from_yolo(image):
    results = yolo_model(image)
    profile_crop, sign_crop = None, None
    if results and results[0].boxes:
        for box, cls in zip(results[0].boxes.xyxy, results[0].boxes.cls):
            x1, y1, x2, y2 = map(int, box.tolist())
            crop = image.crop((x1, y1, x2, y2))
            label = results[0].names[int(cls)]
            if label.lower() == "profile":
                profile_crop = crop
            elif label.lower() == "sign":
                sign_crop = crop
    return profile_crop, sign_crop

def extract_features(image):
    img_t = preprocess(image).unsqueeze(0)
    with torch.no_grad():
        features = resnet_model(img_t)
    return features

# ---------------- SIFT Similarity ----------------
def compute_sift_similarity(img1, img2):
    img1_cv = cv2.cvtColor(np.array(img1), cv2.COLOR_RGB2GRAY)
    img2_cv = cv2.cvtColor(np.array(img2), cv2.COLOR_RGB2GRAY)

    sift = cv2.SIFT_create()
    kp1, des1 = sift.detectAndCompute(img1_cv, None)
    kp2, des2 = sift.detectAndCompute(img2_cv, None)

    if des1 is None or des2 is None or len(kp1) < 2 or len(kp2) < 2:
        return 0.0

    bf = cv2.BFMatcher()
    matches = bf.knnMatch(des1, des2, k=2)

    good_matches = [m for m, n in matches if m.distance < 0.75 * n.distance]

    sim = len(good_matches) / min(len(kp1), len(kp2))
    return sim

# ---------------- Compare Crops ----------------
def compare_crops(crop1, crop2):
    feat1 = extract_features(crop1)
    feat2 = extract_features(crop2)
    sim_dl = cos(feat1, feat2).item()
    
    sim_sift = compute_sift_similarity(crop1, crop2)
    
    dl_match = sim_dl >= 0.95
    sift_match = sim_sift >= 0.75
    
    return {
        "deep_learning_similarity": sim_dl,
        "sift_similarity": sim_sift,
        "match": dl_match and sift_match
    }

# ---------------- API Endpoint ----------------
@app.route("/compare-images", methods=["POST"])
def compare_images():
    try:
        data = request.get_json()
        if not data or "file1" not in data or "file2" not in data:
            return jsonify({"error": "Both file1 and file2 base64 strings are required"}), 400

        file1_bytes = decode_base64_to_bytes(data["file1"])
        file2_bytes = decode_base64_to_bytes(data["file2"])
        
        img1 = load_image_universal(file1_bytes)
        img2 = load_image_universal(file2_bytes)

        profile1, sign1 = crop_from_yolo(img1)
        profile2, sign2 = crop_from_yolo(img2)

        results = {}
        tampering_details = {
            "profile": "Not Checked",
            "signature": "Not Checked",
           
        }

        # Profile
        if profile1 and profile2:
            results["profile"] = compare_crops(profile1, profile2)
            tampering_details["profile"] = "Match" if results["profile"]["match"] else "Mismatch"
        else:
            results["profile"] = {"error": "Profile not detected in one or both images"}
            tampering_details["profile"] = "Detection Failed"

        # Signature
        if sign1 and sign2:
            results["sign"] = compare_crops(sign1, sign2)
            tampering_details["signature"] = "Match" if results["sign"]["match"] else "Mismatch"
        else:
            results["sign"] = {"error": "Signature not detected in one or both images"}
            tampering_details["signature"] = "Detection Failed"

        tampering_suspected = tampering_details["profile"] == "Mismatch" or tampering_details["signature"] == "Mismatch"

        return jsonify({
            "results": results,
            "tampering_suspected": tampering_suspected,
            "tampering_details": tampering_details
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
