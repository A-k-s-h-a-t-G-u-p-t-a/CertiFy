from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from PIL import Image
import io
import fitz  # PyMuPDF
import cv2
import numpy as np
import base64
import os
import traceback
import json
import difflib
import re
from skimage.metrics import structural_similarity as ssim
from pdf2image import convert_from_path

# Enhanced OCR and NLP libraries
try:
    import pytesseract
    OCR_AVAILABLE = True
except Exception:
    OCR_AVAILABLE = False

try:
    import spacy
    from sentence_transformers import SentenceTransformer
    NLP_AVAILABLE = True
    # Load models (you'll need to install these)
    # python -m spacy download en_core_web_sm
    # pip install sentence-transformers
    try:
        nlp = spacy.load("en_core_web_sm")
        sentence_model = SentenceTransformer('all-MiniLM-L6-v2')
    except:
        NLP_AVAILABLE = False
        nlp = None
        sentence_model = None
except Exception:
    NLP_AVAILABLE = False
    nlp = None
    sentence_model = None

app = Flask(__name__)
CORS(app, origins=["http://localhost:3000"], supports_credentials=True)

# Create static directory for output images
STATIC_DIR = os.path.join(os.path.dirname(__file__), 'static')
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), 'uploads')
os.makedirs(STATIC_DIR, exist_ok=True)
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Point this to your Poppler bin folder (contains pdfinfo.exe)
POPPLER_PATH = r"C:\Program Files\poppler-25.07.0\Library\bin"

# Optional: If using pytesseract and tesseract is not in PATH, set it here:
# pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

# ---------------- Helper Functions ----------------

def convert_to_image(path):
    ext = path.split('.')[-1].lower()
    if ext == "pdf":
        pages = convert_from_path(path, dpi=300, poppler_path=POPPLER_PATH)
        img_path = path.rsplit('.', 1)[0] + ".png"
        pages[0].save(img_path, 'PNG')
        return img_path
    return path

def image_to_base64(image_path):
    """Convert image to base64 URL encoded string"""
    try:
        # Load image
        img = cv2.imread(image_path)
        if img is None:
            img = cv2.imdecode(np.fromfile(image_path, dtype=np.uint8), cv2.IMREAD_COLOR)
        
        # Convert to PIL Image for encoding
        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        pil_img = Image.fromarray(img_rgb)
        
        # Convert to base64
        buffer = io.BytesIO()
        pil_img.save(buffer, format='PNG')
        img_bytes = buffer.getvalue()
        img_base64 = base64.b64encode(img_bytes).decode('utf-8')
        
        return f"data:image/png;base64,{img_base64}"
    except Exception as e:
        raise ValueError(f"Unable to convert image to base64: {e}")

def base64_to_cv2_image(base64_string):
    """Convert base64 URL encoded string back to cv2 image (handles both images and PDFs)"""
    try:
        # Remove the data URL prefix if present
        if base64_string.startswith('data:'):
            base64_string = base64_string.split(',', 1)[1]
        
        # Decode base64 to bytes
        img_bytes = base64.b64decode(base64_string)
        
        # First try as regular image
        try:
            nparr = np.frombuffer(img_bytes, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            if img is not None:
                return img
        except:
            pass
        
        # If image decode failed, try as PDF
        try:
            doc = fitz.open(stream=img_bytes, filetype="pdf")
            if not doc:
                raise RuntimeError("PDF file is empty or corrupted.")
            page = doc.load_page(0)
            pix = page.get_pixmap(dpi=300)
            doc.close()
            
            # Convert pixmap to numpy array for cv2
            img_data = pix.tobytes("png")
            nparr = np.frombuffer(img_data, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            if img is not None:
                return img
                
        except Exception as pdf_error:
            print(f"PDF processing failed: {pdf_error}")
        
        raise ValueError("Unable to decode as image or PDF")
        
    except Exception as e:
        raise ValueError(f"Unable to convert base64 to image: {e}")

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

def load_color_image(path):
    img = cv2.imdecode(np.fromfile(path, dtype=np.uint8), cv2.IMREAD_UNCHANGED)
    if img is None:
        # fallback to cv2.imread
        img = cv2.imread(path, cv2.IMREAD_UNCHANGED)
    if img is None:
        raise ValueError(f"Unable to load image: {path}")
    # If image has alpha channel, drop it
    if img.shape[-1] == 4:
        img = cv2.cvtColor(img, cv2.COLOR_BGRA2BGR)
    return img
    """Convert base64 URL encoded string back to cv2 image"""
    try:
        # Remove the data URL prefix if present
        if base64_string.startswith('data:image'):
            base64_string = base64_string.split(',', 1)[1]
        
        # Decode base64 to bytes
        img_bytes = base64.b64decode(base64_string)
        
        # Convert bytes to numpy array
        nparr = np.frombuffer(img_bytes, np.uint8)
        
        # Decode to cv2 image
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            raise ValueError("Unable to decode base64 image")
        
        return img
    except Exception as e:
        raise ValueError(f"Unable to convert base64 to image: {e}")

def to_gray(img):
    return cv2.cvtColor(img, cv2.COLOR_BGR2GRAY) if len(img.shape) == 3 else img

def normalize_histogram(img_gray):
    # CLAHE works better than plain equalizeHist
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8,8))
    return clahe.apply(img_gray)

def align_images_orb(img_orig_gray, img_test_gray, max_features=5000, good_match_percent=0.15):
    # ORB detect & compute
    orb = cv2.ORB_create(nfeatures=max_features)
    kps1, des1 = orb.detectAndCompute(img_orig_gray, None)
    kps2, des2 = orb.detectAndCompute(img_test_gray, None)

    if des1 is None or des2 is None or len(kps1) < 4 or len(kps2) < 4:
        return None, 0, False  # can't align

    # BF matcher with Hamming for ORB
    matcher = cv2.BFMatcher(cv2.NORM_HAMMING)
    matches = matcher.knnMatch(des1, des2, k=2)

    # Ratio test
    good = []
    for m_n in matches:
        if len(m_n) != 2:
            continue
        m, n = m_n
        if m.distance < 0.75 * n.distance:
            good.append(m)

    num_good = len(good)
    if num_good < 8:
        return None, num_good, False

    # Extract matched keypoints
    pts1 = np.float32([kps1[m.queryIdx].pt for m in good]).reshape(-1,1,2)
    pts2 = np.float32([kps2[m.trainIdx].pt for m in good]).reshape(-1,1,2)

    # Find homography
    H, mask = cv2.findHomography(pts2, pts1, cv2.RANSAC, 5.0)
    if H is None:
        return None, num_good, False

    h, w = img_orig_gray.shape
    aligned = cv2.warpPerspective(img_test_gray, H, (w, h), flags=cv2.INTER_LINEAR)

    return aligned, num_good, True

def highlight_differences(img_orig_gray, img_test_gray, base_color_img):
    """
    Simple and effective certificate tampering detection using SSIM and Otsu thresholding
    Returns images as base64 strings instead of saving to files
    """
    # Step 1: Ensure same dimensions
    if img_orig_gray.shape != img_test_gray.shape:
        img_test_gray = cv2.resize(img_test_gray, (img_orig_gray.shape[1], img_orig_gray.shape[0]))

    # Step 2: Normalize both images for better comparison
    orig_eq = normalize_histogram(img_orig_gray)
    test_eq = normalize_histogram(img_test_gray)

    # Step 3: Compute SSIM and difference image
    (ssim_score, diff) = ssim(orig_eq, test_eq, full=True)
    # Convert diff to 8-bit image (darker regions = more different)
    diff = (diff * 255).astype("uint8")

    # Step 4: Threshold using Otsu's method to find significant changes
    thresh = cv2.threshold(diff, 0, 255, cv2.THRESH_BINARY_INV | cv2.THRESH_OTSU)[1]

    # Step 5: Apply morphological operations to clean up noise
    kernel = np.ones((3, 3), np.uint8)
    thresh = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, kernel, iterations=1)
    thresh = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel, iterations=2)

    # Step 6: Find contours of differing regions
    contours = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    contours = contours[0] if len(contours) == 2 else contours[1]  # Handle different OpenCV versions

    # Step 7: Draw bounding boxes and filter noise
    tampered_boxes = []
    boxes_img = base_color_img.copy()
    
    h, w = diff.shape
    img_area = h * w

    for c in contours:
        # Filter small contours that might be noise
        contour_area = cv2.contourArea(c)
        if contour_area > 100:  # Minimum area threshold
            x, y, width, height = cv2.boundingRect(c)
            box_area = width * height
            
            # Additional filtering based on size and aspect ratio
            if box_area < 0.001 * img_area:  # Too small
                continue
            if box_area > 0.2 * img_area:  # Too large (likely lighting)
                continue
            
            aspect_ratio = max(width, height) / min(width, height)
            if aspect_ratio > 15:  # Too thin (likely scanning artifact)
                continue
            
            # Add to results
            tampered_boxes.append((x, y, width, height))
            
            # Draw red rectangle on the image
            cv2.rectangle(boxes_img, (x, y), (x + width, y + height), (0, 0, 255), 2)
            
            # Add confidence label based on area
            confidence = min(box_area / 1000.0, 1.0)
            label = f"{confidence:.2f}"
            cv2.putText(boxes_img, label, (x, y-5), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (0, 0, 255), 1)

    # Step 8: Create visualizations
    # Invert diff for better heatmap (white = different)
    diff_inv = 255 - diff
    heatmap = cv2.applyColorMap(diff_inv, cv2.COLORMAP_JET)
    
    # Create overlay
    overlay = cv2.addWeighted(base_color_img, 0.7, heatmap, 0.3, 0)

    # Step 9: Convert images to base64 strings instead of saving files
    def cv2_image_to_base64(img):
        try:
            _, buffer = cv2.imencode('.png', img)
            img_base64 = base64.b64encode(buffer).decode('utf-8')
            return f"data:image/png;base64,{img_base64}"
        except:
            return None

    # Step 10: Calculate tampering score
    tampering_score = 1.0 - ssim_score
    if len(tampered_boxes) > 0:
        # Boost score based on number and size of tampered regions
        region_boost = min(len(tampered_boxes) * 0.1, 0.3)
        tampering_score = min(tampering_score + region_boost, 1.0)

    return {
        'tampering_score': tampering_score,
        'ssim_score': ssim_score,
        'difference_mask': diff,
        'binary_mask': thresh,
        'tampered_boxes': tampered_boxes,
        'num_boxes': len(tampered_boxes),
        'heatmap_image': cv2_image_to_base64(heatmap),
        'boxes_image': cv2_image_to_base64(boxes_img),
        'overlay_image': cv2_image_to_base64(overlay),
        'threshold_image': cv2_image_to_base64(thresh)
    }

def advanced_ocr_extraction(image):
    """
    Enhanced OCR extraction with preprocessing for better accuracy
    """
    if not OCR_AVAILABLE:
        return {"text": "", "confidence": 0, "words": [], "error": "OCR not available"}
    
    try:
        # Handle both image paths and PIL images
        if isinstance(image, str):
            # Load and preprocess image for better OCR
            img = cv2.imread(image)
            if img is None:
                img = cv2.imdecode(np.fromfile(image, dtype=np.uint8), cv2.IMREAD_COLOR)
        else:
            # Convert PIL image to cv2 format for preprocessing
            img = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
        
        # Convert to grayscale
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Enhance text clarity
        # 1. Increase contrast
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
        enhanced = clahe.apply(gray)
        
        # 2. Denoise
        denoised = cv2.fastNlMeansDenoising(enhanced)
        
        # 3. Sharpen text
        kernel = np.array([[-1,-1,-1], [-1,9,-1], [-1,-1,-1]])
        sharpened = cv2.filter2D(denoised, -1, kernel)
        
        # Extract text with detailed info
        custom_config = r'--oem 3 --psm 6 -c tessedit_char_whitelist=0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz.,:-/ '
        
        # Get detailed OCR data
        data = pytesseract.image_to_data(sharpened, config=custom_config, output_type=pytesseract.Output.DICT)
        
        # Extract text and word-level info
        text = pytesseract.image_to_string(sharpened, config=custom_config).strip()
        
        words = []
        for i in range(len(data['text'])):
            if int(data['conf'][i]) > 30:  # confidence threshold
                word_info = {
                    'text': data['text'][i].strip(),
                    'confidence': int(data['conf'][i]),
                    'bbox': (data['left'][i], data['top'][i], data['width'][i], data['height'][i])
                }
                if word_info['text']:  # only add non-empty words
                    words.append(word_info)
        
        avg_confidence = np.mean([w['confidence'] for w in words]) if words else 0
        
        return {
            "text": text,
            "confidence": avg_confidence,
            "words": words,
            "total_words": len(words),
            "error": None
        }
        
    except Exception as e:
        return {"text": "", "confidence": 0, "words": [], "error": str(e)}

def nlp_text_analysis(text_original, text_test):
    """
    Advanced NLP analysis for detecting semantic changes in certificates
    """
    if not NLP_AVAILABLE or not nlp or not sentence_model:
        return {"nlp_available": False, "error": "NLP models not available"}
    
    try:
        # Clean and normalize text
        def clean_text(text):
            # Remove extra whitespace, normalize case
            cleaned = re.sub(r'\s+', ' ', text.strip())
            return cleaned
        
        orig_clean = clean_text(text_original)
        test_clean = clean_text(text_test)
        
        # 1. Character-level differences
        char_similarity = difflib.SequenceMatcher(None, orig_clean, test_clean).ratio()
        
        # 2. Word-level differences
        orig_words = orig_clean.lower().split()
        test_words = test_clean.lower().split()
        word_similarity = difflib.SequenceMatcher(None, orig_words, test_words).ratio()
        
        # 3. Semantic similarity using sentence transformers
        if orig_clean and test_clean:
            orig_embedding = sentence_model.encode([orig_clean])
            test_embedding = sentence_model.encode([test_clean])
            semantic_similarity = float(np.dot(orig_embedding[0], test_embedding[0]) / 
                                      (np.linalg.norm(orig_embedding[0]) * np.linalg.norm(test_embedding[0])))
        else:
            semantic_similarity = 0.0
        
        # 4. Named Entity Recognition for critical fields
        orig_doc = nlp(orig_clean)
        test_doc = nlp(test_clean)
        
        orig_entities = {(ent.text.lower(), ent.label_) for ent in orig_doc.ents}
        test_entities = {(ent.text.lower(), ent.label_) for ent in test_doc.ents}
        
        # Check for critical entity changes (names, dates, organizations)
        critical_labels = {'PERSON', 'ORG', 'DATE', 'CARDINAL', 'GPE'}
        orig_critical = {ent for ent in orig_entities if ent[1] in critical_labels}
        test_critical = {ent for ent in test_entities if ent[1] in critical_labels}
        
        entity_changes = {
            'added': list(test_critical - orig_critical),
            'removed': list(orig_critical - test_critical),
            'unchanged': list(orig_critical & test_critical)
        }
        
        # 5. Certificate-specific pattern analysis
        def extract_cert_patterns(text):
            patterns = {
                'dates': re.findall(r'\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b|\b\d{4}[/-]\d{1,2}[/-]\d{1,2}\b', text),
                'grades': re.findall(r'\b[A-F][+-]?\b|\b\d{1,3}%\b|\b\d{1,3}\.\d+\b', text),
                'ids': re.findall(r'\b[A-Z0-9]{6,}\b', text),
                'names': re.findall(r'\b[A-Z][a-z]+ [A-Z][a-z]+\b', text)
            }
            return patterns
        
        orig_patterns = extract_cert_patterns(orig_clean)
        test_patterns = extract_cert_patterns(test_clean)
        
        pattern_changes = {}
        for pattern_type in orig_patterns:
            orig_set = set(orig_patterns[pattern_type])
            test_set = set(test_patterns[pattern_type])
            pattern_changes[pattern_type] = {
                'added': list(test_set - orig_set),
                'removed': list(orig_set - test_set),
                'unchanged': list(orig_set & test_set)
            }
        
        # 6. Calculate tampering probability
        # Lower similarity = higher tampering probability
        char_tampering = 1 - char_similarity
        word_tampering = 1 - word_similarity  
        semantic_tampering = 1 - semantic_similarity
        
        # Weight critical changes more heavily
        critical_change_score = 0
        if entity_changes['added'] or entity_changes['removed']:
            critical_change_score = 0.5
        
        pattern_change_score = 0
        for pattern_type in pattern_changes:
            if pattern_changes[pattern_type]['added'] or pattern_changes[pattern_type]['removed']:
                pattern_change_score += 0.1
        pattern_change_score = min(pattern_change_score, 0.5)
        
        # Combined NLP tampering score
        nlp_tampering_score = (
            char_tampering * 0.2 + 
            word_tampering * 0.3 + 
            semantic_tampering * 0.3 + 
            critical_change_score + 
            pattern_change_score
        )
        
        return {
            "nlp_available": True,
            "char_similarity": char_similarity,
            "word_similarity": word_similarity,
            "semantic_similarity": semantic_similarity,
            "entity_changes": entity_changes,
            "pattern_changes": pattern_changes,
            "nlp_tampering_score": min(nlp_tampering_score, 1.0),
            "critical_fields_changed": len(entity_changes['added']) + len(entity_changes['removed']) > 0,
            "text_original": orig_clean[:500],  # truncate for response size
            "text_test": test_clean[:500]
        }
        
    except Exception as e:
        return {"nlp_available": True, "error": str(e)}

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

# ---------------- API Endpoint ----------------
@app.route("/compare-images", methods=["POST"])
def compare_images():
    try:
        data = request.get_json()
        if not data or "file1" not in data or "file2" not in data:
            return jsonify({"error": "Both file1 and file2 base64 strings are required"}), 400

        # Convert base64 to cv2 images for comprehensive analysis
        orig_color = base64_to_cv2_image(data["file1"])
        test_color = base64_to_cv2_image(data["file2"])
        
        # Also convert to PIL for OCR analysis
        file1_bytes = base64.b64decode(data["file1"].split(",")[1] if "," in data["file1"] else data["file1"])
        file2_bytes = base64.b64decode(data["file2"].split(",")[1] if "," in data["file2"] else data["file2"])
        img1_pil = load_image_universal(file1_bytes)
        img2_pil = load_image_universal(file2_bytes)
        
        # Resize test image to match original dimensions for SSIM analysis
        test_color = cv2.resize(test_color, (orig_color.shape[1], orig_color.shape[0]))
        
        # Convert to grayscale
        orig_gray = to_gray(orig_color)
        test_gray = to_gray(test_color)

        # Try alignment (optional - can improve accuracy)
        aligned_gray, match_count, aligned_flag = align_images_orb(orig_gray, test_gray)
        if aligned_flag and aligned_gray is not None:
            proc_test_gray = aligned_gray
            proc_test_color = test_color
        else:
            proc_test_gray = test_gray
            proc_test_color = test_color

        # Detect tampering using SSIM + Otsu approach
        tampering_result = highlight_differences(orig_gray, proc_test_gray, proc_test_color)

        # Enhanced OCR and NLP analysis
        print("Performing advanced OCR extraction...")
        orig_ocr_result = advanced_ocr_extraction(img1_pil)
        test_ocr_result = advanced_ocr_extraction(img2_pil)
        
        print("Performing NLP analysis...")
        nlp_analysis = nlp_text_analysis(orig_ocr_result.get('text', ''), test_ocr_result.get('text', ''))
        
        # Combine computer vision and NLP scores
        cv_tampering_score = tampering_result['tampering_score']
        nlp_tampering_score = nlp_analysis.get('nlp_tampering_score', 0)
        
        # Intelligent fusion of CV and NLP scores
        if nlp_analysis.get('nlp_available', False) and not nlp_analysis.get('error'):
            # If NLP is available, use weighted combination
            # NLP is often more reliable for text-based tampering in certificates
            if nlp_analysis.get('critical_fields_changed', False):
                # Critical fields changed - trust NLP more
                final_tampering_score = min(nlp_tampering_score * 0.7 + cv_tampering_score * 0.3, 1.0)
            else:
                # No critical field changes - balance both
                final_tampering_score = min(nlp_tampering_score * 0.6 + cv_tampering_score * 0.4, 1.0)
        else:
            # Fallback to CV only
            final_tampering_score = cv_tampering_score

        # Helper function to ensure JSON serializability
        def make_json_serializable(obj):
            if isinstance(obj, np.integer):
                return int(obj)
            elif isinstance(obj, np.floating):
                return float(obj)
            elif isinstance(obj, np.ndarray):
                return obj.tolist()
            elif isinstance(obj, dict):
                return {k: make_json_serializable(v) for k, v in obj.items()}
            elif isinstance(obj, list):
                return [make_json_serializable(item) for item in obj]
            elif hasattr(obj, 'item'):  # numpy scalar
                return obj.item()
            return obj

        # Comprehensive response in the format of the provided code
        response = {
            "tampering_score": float(round(final_tampering_score, 4)),
            "cv_tampering_score": float(round(tampering_result['tampering_score'], 4)),
            "nlp_tampering_score": float(round(nlp_tampering_score, 4)),
            "similarity_score": float(round(tampering_result['ssim_score'], 4)),
            "match_count": int(match_count),
            "aligned": bool(aligned_flag),
            "num_boxes": int(tampering_result['num_boxes']),
            "boxes": [list(box) for box in tampering_result['tampered_boxes']],  # Convert to Python lists
            "ocr_original": make_json_serializable(orig_ocr_result),
            "ocr_test": make_json_serializable(test_ocr_result),
            "nlp_analysis": make_json_serializable(nlp_analysis),
            "detection_method": "simplified_ssim_otsu" if not nlp_analysis.get('nlp_available', False) else "hybrid_ssim_nlp",
            "algorithm": "SSIM + Otsu Thresholding + Morphological Operations",
            
            # Analysis images as base64 (directly from memory)
            "analysis_images": {
                "tampered_image": tampering_result['boxes_image'],
                "heatmap_image": tampering_result['heatmap_image'],
                "overlay_image": tampering_result['overlay_image'],
                "threshold_image": tampering_result['threshold_image']
            },
            
            # Legacy format for backward compatibility
            "results": {"message": "YOLO analysis deprecated - using enhanced SSIM+NLP analysis"},
            "tampering_suspected": bool(final_tampering_score > 0.3),  # Ensure Python bool
            "tampering_details": {
                "overall": "High Risk" if final_tampering_score > 0.7 else "Medium Risk" if final_tampering_score > 0.3 else "Low Risk"
            },
            "boxed_images": {
                "file1": None,  # YOLO analysis removed
                "file2": None   # YOLO analysis removed
            }
        }
        
        return jsonify(response)

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": "internal_server_error", "detail": str(e)}), 500

@app.route("/compare", methods=["POST"])
def compare():
    try:
        if 'original' not in request.files or 'test' not in request.files:
            return jsonify({"error": "Upload both original and test files"}), 400

        original_file = request.files['original']
        test_file = request.files['test']

        original_path = os.path.join(UPLOAD_DIR, original_file.filename)
        test_path = os.path.join(UPLOAD_DIR, test_file.filename)
        original_file.save(original_path)
        test_file.save(test_path)

        # Step 1: Convert PDFs to images if needed
        original_img_path = convert_to_image(original_path)
        test_img_path = convert_to_image(test_path)

        # Step 2: Convert images to base64 internally
        print("Converting images to base64...")
        original_base64 = image_to_base64(original_img_path)
        test_base64 = image_to_base64(test_img_path)

        # Step 3: Convert base64 back to cv2 images for processing
        orig_color = base64_to_cv2_image(original_base64)
        test_color = base64_to_cv2_image(test_base64)
        
        # Resize test image to match original dimensions
        test_color = cv2.resize(test_color, (orig_color.shape[1], orig_color.shape[0]))
        
        # Step 4: Convert to grayscale
        orig_gray = to_gray(orig_color)
        test_gray = to_gray(test_color)

        # Step 4: Try alignment (optional - can improve accuracy)
        aligned_gray, match_count, aligned_flag = align_images_orb(orig_gray, test_gray)
        if aligned_flag and aligned_gray is not None:
            proc_test_gray = aligned_gray
            # For visualization, we'll use the resized test image
            proc_test_color = test_color
        else:
            proc_test_gray = test_gray
            proc_test_color = test_color

        # Step 5: Detect tampering using simplified SSIM + Otsu approach
        tampering_result = highlight_differences(orig_gray, proc_test_gray, proc_test_color, STATIC_DIR)

        # Enhanced OCR and NLP analysis (using original file paths for OCR)
        print("Performing advanced OCR extraction...")
        orig_ocr_result = advanced_ocr_extraction(original_img_path)
        test_ocr_result = advanced_ocr_extraction(test_img_path)
        
        print("Performing NLP analysis...")
        nlp_analysis = nlp_text_analysis(orig_ocr_result.get('text', ''), test_ocr_result.get('text', ''))
        
        # Combine computer vision and NLP scores
        cv_tampering_score = tampering_result['tampering_score']
        nlp_tampering_score = nlp_analysis.get('nlp_tampering_score', 0)
        
        # Intelligent fusion of CV and NLP scores
        if nlp_analysis.get('nlp_available', False) and not nlp_analysis.get('error'):
            # If NLP is available, use weighted combination
            # NLP is often more reliable for text-based tampering in certificates
            if nlp_analysis.get('critical_fields_changed', False):
                # Critical fields changed - trust NLP more
                final_tampering_score = min(nlp_tampering_score * 0.7 + cv_tampering_score * 0.3, 1.0)
            else:
                # No critical field changes - balance both
                final_tampering_score = min(nlp_tampering_score * 0.6 + cv_tampering_score * 0.4, 1.0)
        else:
            # Fallback to CV only
            final_tampering_score = cv_tampering_score

        response = {
            "tampering_score": float(round(final_tampering_score, 4)),
            "cv_tampering_score": float(round(tampering_result['tampering_score'], 4)),
            "nlp_tampering_score": float(round(nlp_tampering_score, 4)),
            "similarity_score": float(round(tampering_result['ssim_score'], 4)),
            "match_count": int(match_count),
            "aligned": bool(aligned_flag),
            "tampered_image": "/static/tampered.png",
            "heatmap_image": "/static/heatmap.png",
            "overlay_image": "/static/overlay.png",
            "threshold_image": "/static/threshold.png",
            "num_boxes": tampering_result['num_boxes'],
            "boxes": tampering_result['tampered_boxes'],
            "ocr_original": orig_ocr_result,
            "ocr_test": test_ocr_result,
            "nlp_analysis": nlp_analysis,
            "detection_method": "simplified_ssim_otsu" if not nlp_analysis.get('nlp_available', False) else "hybrid_ssim_nlp",
            "algorithm": "SSIM + Otsu Thresholding + Morphological Operations"
        }
        return jsonify(response)

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": "internal_server_error", "detail": str(e)}), 500

@app.route("/static/<path:fname>")
def static_files(fname):
    return send_file(os.path.join(STATIC_DIR, fname))

if __name__ == "__main__":
    # Use 0.0.0.0 if you want external devices to access
    app.run(debug=True)
