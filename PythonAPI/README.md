# Certificate Comparison API - Technology Stack

A comprehensive Python-based API for certificate tampering detection using computer vision, OCR, and natural language processing techniques.

## 🚀 Overview

This API provides advanced certificate comparison capabilities by combining multiple cutting-edge technologies to detect document tampering, forgeries, and unauthorized modifications. It uses both visual analysis and textual content analysis to provide highly accurate verification results.

## 🛠️ Core Technologies

### **Web Framework**
- **Flask** - Lightweight Python web framework for REST API
- **Flask-CORS** - Cross-Origin Resource Sharing support for web applications

### **Image Processing & Computer Vision**
- **OpenCV (cv2)** - Advanced computer vision library for image processing
- **PIL/Pillow** - Python Imaging Library for image manipulation
- **NumPy** - Numerical computing for array operations and mathematical functions
- **scikit-image (skimage)** - Image processing algorithms including SSIM (Structural Similarity Index)

### **PDF Processing**
- **PyMuPDF (fitz)** - High-performance PDF processing and conversion
- **pdf2image** - Convert PDF pages to PIL Image objects
- **Poppler** - PDF rendering library (external dependency)

### **Optical Character Recognition (OCR)**
- **Tesseract OCR** - Industry-standard OCR engine
- **pytesseract** - Python wrapper for Tesseract OCR
- Text extraction with confidence scoring and word-level bounding boxes

### **Natural Language Processing (NLP)**
- **spaCy** - Industrial-strength NLP library
  - Named Entity Recognition (NER)
  - Text preprocessing and analysis
  - Model: `en_core_web_sm`
- **SentenceTransformers** - Semantic text similarity analysis
  - Model: `all-MiniLM-L6-v2`
  - Vector embeddings for semantic comparison

### **Data Processing Libraries**
- **base64** - Base64 encoding/decoding for image data transfer
- **io** - Stream handling for in-memory file operations
- **json** - JSON data serialization
- **difflib** - Text difference calculation
- **re** (Regular Expressions) - Pattern matching for certificate fields

## 🔍 Detection Algorithms

### **1. Structural Similarity Index Measure (SSIM)**
- Measures perceived visual similarity between images
- Range: 0.0 (completely different) to 1.0 (identical)
- Accounts for luminance, contrast, and structural information

### **2. Otsu's Thresholding**
- Automatic threshold selection for binary image segmentation
- Separates foreground (text/content) from background
- Optimal threshold calculation based on image histogram

### **3. ORB Feature Detection & Matching**
- **ORB (Oriented FAST and Rotated BRIEF)** feature detector
- Keypoint detection and descriptor computation
- Homography estimation for image alignment
- Handles rotated, scaled, or slightly transformed documents

### **4. Morphological Operations**
- **Opening**: Noise removal using erosion followed by dilation
- **Closing**: Gap filling using dilation followed by erosion
- **Kernel-based filtering**: 3x3 structuring elements for noise reduction

### **5. Contour Analysis**
- Connected component analysis for detecting altered regions
- Area-based filtering to eliminate noise
- Aspect ratio validation to ignore scanning artifacts
- Bounding box generation for tampered regions

## 🧠 Advanced Analysis Features

### **Computer Vision Pipeline**
1. **Image Preprocessing**
   - CLAHE (Contrast Limited Adaptive Histogram Equalization)
   - Noise reduction using fastNlMeansDenoising
   - Sharpening filters for text enhancement

2. **Alignment & Registration**
   - ORB feature matching between original and test images
   - RANSAC-based homography estimation
   - Perspective transformation for alignment

3. **Difference Detection**
   - SSIM-based similarity analysis
   - Binary difference mask generation
   - Morphological noise filtering
   - Multi-scale analysis for various tampering types

### **OCR & Text Analysis Pipeline**
1. **Text Extraction**
   - Enhanced preprocessing for better OCR accuracy
   - Word-level confidence scoring
   - Bounding box extraction for spatial analysis

2. **NLP Analysis**
   - Character-level and word-level text similarity
   - Semantic similarity using transformer models
   - Named Entity Recognition for critical fields
   - Certificate-specific pattern extraction (dates, grades, IDs, names)

3. **Critical Field Detection**
   - Person names (PERSON entities)
   - Organizations (ORG entities)
   - Dates and temporal information
   - Grade and score patterns
   - Certificate IDs and reference numbers

## 📊 Scoring & Classification

### **Multi-Modal Scoring System**
- **CV Tampering Score**: Computer vision based analysis (0.0 - 1.0)
- **NLP Tampering Score**: Natural language processing based analysis (0.0 - 1.0)
- **Final Tampering Score**: Intelligent fusion of CV and NLP scores

### **Adaptive Weight Assignment**
- Critical field changes: NLP weight = 0.7, CV weight = 0.3
- No critical changes: NLP weight = 0.6, CV weight = 0.4
- NLP unavailable: CV weight = 1.0

### **Risk Classification**
- **Low Risk**: Score < 0.3
- **Medium Risk**: Score 0.3 - 0.7
- **High Risk**: Score > 0.7

## 🌐 API Endpoints

### **POST /compare-images**
- Input: Base64 encoded images
- Comprehensive tampering analysis
- Real-time processing without file storage

### **POST /compare**
- Input: Multipart file upload
- File-based analysis with intermediate storage
- Supports PDF and image formats

### **GET /static/<filename>**
- Serves analysis result images
- Generated visualizations and overlays

## 📁 Output Visualizations

1. **Heatmap Image**: Color-coded difference intensity
2. **Boxes Image**: Bounding boxes around tampered regions
3. **Overlay Image**: Original image with heatmap overlay
4. **Threshold Image**: Binary mask of detected differences

## 🔧 Configuration Requirements

### **External Dependencies**
- **Tesseract OCR**: System-level OCR engine installation
- **Poppler**: PDF processing utilities
- **spaCy Language Model**: `python -m spacy download en_core_web_sm`

### **Python Package Requirements**
```bash
pip install flask flask-cors pillow opencv-python numpy scikit-image
pip install pymupdf pdf2image pytesseract spacy sentence-transformers
```

## 🚀 Performance Features

- **Memory-Efficient Processing**: Direct base64 to CV2 conversion
- **Parallel Analysis**: Simultaneous CV and NLP processing
- **Scalable Architecture**: Stateless API design
- **Error Handling**: Comprehensive exception management
- **JSON Serialization**: Automatic NumPy to JSON conversion

## 🔒 Security Considerations

- **CORS Configuration**: Restricted to localhost:3000 for development
- **File Validation**: Format verification for uploaded files
- **Memory Management**: Automatic cleanup of processed images
- **Input Sanitization**: Base64 validation and error handling

This API represents a state-of-the-art solution for document verification, combining traditional computer vision techniques with modern NLP capabilities to provide highly accurate tampering detection for certificate validation systems.