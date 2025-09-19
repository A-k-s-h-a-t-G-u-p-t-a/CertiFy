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

app = Flask(__name__)
CORS(app)

# ---------------- YOLO Model ----------------
# Ensure the model path is correct for your environment
yolo_model = YOLO(r"../models/my_model.pt")

# ---------------- Deep Learning Model for Crop Comparison ----------------
resnet_model = models.resnet50(pretrained=True)
resnet_model = torch.nn.Sequential(*list(resnet_model.children())[:-1])
resnet_model.eval()
cos = torch.nn.CosineSimilarity(dim=1, eps=1e-6)

preprocess = transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406],
                         std=[0.229, 0.224, 0.225])
])

# ---------------- File Loader (REVISED) ----------------
def load_image(file_bytes, file_type):
    """
    Load a scanned image or a PDF page as a PIL Image.
    This function has been revised for more robust PDF handling.
    """
    if file_type == "normal":  # PDF
        try:
            doc = fitz.open(stream=file_bytes, filetype="pdf")
            # Using load_page is slightly more robust
            page = doc.load_page(0)  # Process only the first page
            pix = page.get_pixmap(dpi=300)  # Render at high resolution
            doc.close()

            # The original numpy conversion can be fragile. A better method is to
            # convert the pixmap to a standard format (like PNG) in memory and
            # then load it with PIL. This handles different color spaces reliably.
            img_data = pix.tobytes("png")
            img = Image.open(io.BytesIO(img_data))

            # Ensure the image is in RGB format, as required by the models.
            if img.mode != 'RGB':
                img = img.convert('RGB')
            
            return img
        except Exception as e:
            # Propagate error with more context
            raise RuntimeError(f"Failed to process PDF file: {e}") from e

    else:  # Scanned images (e.g., JPEG, PNG)
        img = Image.open(io.BytesIO(file_bytes)).convert("RGB")
        return img

# ---------------- YOLO Crop Extractor ----------------
def crop_from_yolo(image):
    """Returns the first most confident profile and signature crops."""
    results = yolo_model(image)
    profile_crop = None
    sign_crop = None

    if results and len(results) > 0:
        boxes = results[0].boxes
        if boxes is not None and len(boxes) > 0:
            for box, cls, conf in zip(boxes.xyxy, boxes.cls, boxes.conf):
                x1, y1, x2, y2 = map(int, box.tolist())
                crop = image.crop((x1, y1, x2, y2))
                label = results[0].names[int(cls)]
                if label.lower() == "profile" and profile_crop is None:
                    profile_crop = crop
                elif label.lower() == "sign" and sign_crop is None:
                    sign_crop = crop
    return profile_crop, sign_crop

# ---------------- Feature Extractor ----------------
def extract_features(image):
    """Extracts deep learning features from an image crop."""
    img_t = preprocess(image).unsqueeze(0)
    with torch.no_grad():
        features = resnet_model(img_t)
    return features

# ---------------- Compare Crops (REVISED) ----------------
def compare_crops(crop1, crop2):
    """
    Compares two image crops using both a deep learning model and SIFT.
    This function has been revised for more robust SIFT comparison.
    """
    # --- Deep Learning Comparison ---
    feat1 = extract_features(crop1)
    feat2 = extract_features(crop2)
    sim_dl = cos(feat1, feat2).item()
    is_same_dl = sim_dl >= 0.95

    # --- SIFT Comparison ---
    sim_sift = 0.0
    try:
        img1 = cv2.cvtColor(np.array(crop1), cv2.COLOR_RGB2GRAY)
        img2 = cv2.cvtColor(np.array(crop2), cv2.COLOR_RGB2GRAY)
        sift = cv2.SIFT_create()
        kp1, des1 = sift.detectAndCompute(img1, None)
        kp2, des2 = sift.detectAndCompute(img2, None)

        # Ensure we have enough descriptors to compare for knnMatch (k=2)
        if des1 is not None and des2 is not None and len(des1) >= 2 and len(des2) >= 2:
            bf = cv2.BFMatcher()
            matches = bf.knnMatch(des1, des2, k=2)

            # Apply Lowe's ratio test to find good matches.
            # Added a check to ensure each keypoint has two matches before unpacking.
            good_matches = []
            for match_pair in matches:
                if len(match_pair) == 2:
                    m, n = match_pair
                    if m.distance < 0.75 * n.distance:
                        good_matches.append(m)
            
            # Calculate similarity score, avoiding division by zero.
            min_keypoints = min(len(kp1), len(kp2))
            if min_keypoints > 0:
                sim_sift = len(good_matches) / min_keypoints

    except cv2.error as e:
        # SIFT can sometimes throw errors. This catch prevents the entire request from failing.
        print(f"A non-critical SIFT error occurred: {e}")
        sim_sift = 0.0

    is_same_sift = sim_sift >= 0.75
    return {
        "deep_learning_similarity": sim_dl, "deep_learning_match": is_same_dl,
        "sift_similarity": sim_sift, "sift_match": is_same_sift
    }

# ---------------- Flask API ----------------
@app.route("/compare-images", methods=["POST"])
def compare_images():
    if 'file1' not in request.files or 'file2' not in request.files:
        return jsonify({"error": "Both files are required"}), 400

    file1 = request.files['file1']
    file2 = request.files['file2']
    file_type1 = request.form.get("file_type1", "scanned")
    file_type2 = request.form.get("file_type2", "scanned")

    try:
        # Load images
        img1 = load_image(file1.read(), file_type1)
        img2 = load_image(file2.read(), file_type2)

        # Crop regions of interest
        profile1, sign1 = crop_from_yolo(img1)
        profile2, sign2 = crop_from_yolo(img2)

        results = {}
        tampering_suspected = False

        # Compare profile images
        if profile1 and profile2:
            results["profile"] = compare_crops(profile1, profile2)
            # Suspect tampering if either method doesn't find a match
            if not (results["profile"]["deep_learning_match"] and results["profile"]["sift_match"]):
                tampering_suspected = True
        else:
            results["profile"] = {"error": "Profile not detected in one or both images"}

        # Compare signatures
        if sign1 and sign2:
            results["sign"] = compare_crops(sign1, sign2)
            # Suspect tampering if either method doesn't find a match
            if not (results["sign"]["deep_learning_match"] and results["sign"]["sift_match"]):
                tampering_suspected = True
        else:
            results["sign"] = {"error": "Signature not detected in one or both images"}

        results["tampering_suspected"] = tampering_suspected
        return jsonify({"results": results})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ---------------- Run Flask ----------------
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
