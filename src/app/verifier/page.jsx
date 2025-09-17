"use client";

import { useState } from "react";
import { createWorker } from "tesseract.js";

const OcrComparer = () => {
  const [selectedImages, setSelectedImages] = useState([null, null]);
  const [ocrResults, setOcrResults] = useState(["", ""]);
  const [formattedFields, setFormattedFields] = useState([null, null]);
  const [status, setStatus] = useState("");
  const [comparisonResult, setComparisonResult] = useState(null);
  const [visualResult, setVisualResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (index) => (event) => {
    const file = event.target.files[0];
    setSelectedImages((prev) => {
      const updated = [...prev];
      updated[index] = file;
      return updated;
    });
    setOcrResults(["", ""]);
    setFormattedFields([null, null]);
    setComparisonResult(null);
    setVisualResult(null);
    setError(null);
    setStatus("");
  };

  const readImageText = async () => {
    if (!selectedImages[0] || !selectedImages[1]) {
      alert("Please select both certificate images");
      return;
    }

    setStatus("Processing OCR...");
    setError(null);
    setComparisonResult(null);
    setVisualResult(null);

    const worker = await createWorker("eng", 1, { logger: (m) => console.log(m) });

    try {
      const texts = [];

      // Extract text for both images
      for (let i = 0; i < 2; i++) {
        const { data } = await worker.recognize(selectedImages[i]);
        texts.push(data.text);
      }

      setOcrResults(texts);

      // ---------------- Text Extraction via Gemini ----------------
      setStatus("Sending first certificate to backend...");
      const res1 = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText: texts[0] }),
      });
      const data1 = await res1.json();
      if (!res1.ok) throw new Error(data1.error || "Gemini extraction failed for Cert 1");

      setStatus("Sending second certificate to backend...");
      const res2 = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText: texts[1] }),
      });
      const data2 = await res2.json();
      if (!res2.ok) throw new Error(data2.error || "Gemini extraction failed for Cert 2");

      setFormattedFields([data1.fields, data2.fields]);

      // ---------------- Compare key-value pairs ----------------
      const first = data1.fields;
      const second = data2.fields;
      const keys = Object.keys(first);
      const allMatch = keys.every((key) => first[key] === second[key]);

      setComparisonResult(allMatch ? "YES ✅ Certificates match (Text)" : "NO ❌ Certificates differ (Text)");
      setStatus("Text comparison done. Performing visual comparison...");

      // ---------------- Call Python Flask API for visual similarity ----------------
      const formData = new FormData();
      formData.append("file1", selectedImages[0]);
      formData.append("file2", selectedImages[1]);

      const visualRes = await fetch("http://localhost:5000/compare-images", {
        method: "POST",
        body: formData,
      });

      const visualData = await visualRes.json();
      if (!visualRes.ok) throw new Error(visualData.error || "Visual comparison failed");

      setVisualResult(
        visualData.is_same
          ? `YES ✅ Certificates match visually (Similarity: ${visualData.similarity.toFixed(2)})`
          : `NO ❌ Certificates differ visually (Similarity: ${visualData.similarity.toFixed(2)})`
      );

      setStatus("Completed");

    } catch (err) {
      console.error(err);
      setError(err.message || "Error during OCR, Gemini, or visual comparison");
      setStatus("Failed");
    } finally {
      await worker.terminate();
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div>
        <h1>Legacy Certificate Comparison</h1>

        {[0, 1].map((index) => (
          <div key={index} style={{ marginTop: 15 }}>
            <input type="file" accept="image/*" onChange={handleFileChange(index)} />
            {selectedImages[index] && (
              <img
                src={URL.createObjectURL(selectedImages[index])}
                alt={`Certificate ${index + 1}`}
                width={300}
                style={{ marginTop: 10 }}
              />
            )}
          </div>
        ))}

        <div style={{ marginTop: 20 }}>
          <button
            onClick={readImageText}
            style={{ background: "#FFFFFF", borderRadius: 7, color: "#000", padding: 8 }}
          >
            Compare Certificates
          </button>
        </div>

        <p style={{ marginTop: 20, fontWeight: 700 }}>Status: {status}</p>
        {error && <p style={{ color: "red" }}>Error: {error}</p>}

        {formattedFields[0] && formattedFields[1] && (
          <div style={{ marginTop: 20 }}>
            <h3>Certificate 1 Fields:</h3>
            <pre>{JSON.stringify(formattedFields[0], null, 2)}</pre>

            <h3>Certificate 2 Fields:</h3>
            <pre>{JSON.stringify(formattedFields[1], null, 2)}</pre>
          </div>
        )}

        {comparisonResult && (
          <h2 style={{ marginTop: 20 }}>
            Text Comparison Result: <span>{comparisonResult}</span>
          </h2>
        )}

        {visualResult && (
          <h2 style={{ marginTop: 20 }}>
            Visual Comparison Result: <span>{visualResult}</span>
          </h2>
        )}
      </div>
    </div>
  );
};

export default OcrComparer;
