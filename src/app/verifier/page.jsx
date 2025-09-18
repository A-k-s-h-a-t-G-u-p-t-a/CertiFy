"use client";
import { MaskContainer } from "@/components/ui/svg-mask-effect";

import { useState } from "react";

const OcrComparer = () => {
  const [selectedImages, setSelectedImages] = useState([null, null]);
  const [ocrResults, setOcrResults] = useState(["", ""]);
  const [formattedFields, setFormattedFields] = useState([null, null]);
  const [status, setStatus] = useState("");
  const [comparisonResult, setComparisonResult] = useState(null);
  const [visualResult, setVisualResult] = useState(null);
  const [error, setError] = useState(null);

  const [year, setYear] = useState("");
  const [isLegacy, setIsLegacy] = useState(false);
  const [legacyType, setLegacyType] = useState(""); // "scanned" | "normal"
  const [organization, setOrganization] = useState("");

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

  const extractTextFromApi = async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("http://localhost:5001/robust-ocr", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "OCR extraction failed");

    // Join text from all pages
    const fullText = data.results.map((r) => r.text).join("\n");
    return fullText;
  };

  const readImageText = async () => {
    if (!selectedImages[0] || !selectedImages[1]) {
      alert("Please select both certificate images");
      return;
    }

    if (!year) {
      alert("Please enter the certificate year");
      return;
    }

    if (!organization) {
      alert("Please enter the organization");
      return;
    }

    if (isLegacy && !legacyType) {
      alert("Please select whether the legacy certificate is scanned or normal");
      return;
    }

    setStatus("Processing OCR...");
    setError(null);
    setComparisonResult(null);
    setVisualResult(null);

    try {
      // ----------------- Step 1: Extract Text -----------------
      setStatus("Extracting text from first certificate...");
      const text1 = await extractTextFromApi(selectedImages[0]);
      setStatus("Extracting text from second certificate...");
      const text2 = await extractTextFromApi(selectedImages[1]);

      setOcrResults([text1, text2]);

      // ----------------- Step 2: Send text to Gemini for field extraction -----------------
      setStatus("Sending first certificate text to Gemini...");
      const res1 = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText: text1 }),
      });
      const data1 = await res1.json();
      if (!res1.ok) throw new Error(data1.error || "Gemini extraction failed for Cert 1");

      setStatus("Sending second certificate text to Gemini...");
      const res2 = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText: text2 }),
      });
      const data2 = await res2.json();
      if (!res2.ok) throw new Error(data2.error || "Gemini extraction failed for Cert 2");

      setFormattedFields([data1.fields, data2.fields]);

      // ----------------- Step 3: Compare key-value pairs -----------------
      const first = data1.fields;
      const second = data2.fields;
      const keys = Object.keys(first);
      const allMatch = keys.every((key) => first[key] === second[key]);

      setComparisonResult(
        allMatch
          ? "YES ✅ Certificates match (Text)"
          : "NO ❌ Certificates differ (Text)"
      );

      setStatus("Text comparison done. Performing visual comparison...");

      // ----------------- Step 4: Call Python Flask API for visual similarity -----------------
      // ----------------- Step 4: Call Python Flask API for visual similarity -----------------
      const formData = new FormData();
      formData.append("file1", selectedImages[0]);
      formData.append("file2", selectedImages[1]);

      const visualRes = await fetch("http://localhost:5000/compare-images", {
        method: "POST",
        body: formData,
      });

      const visualData = await visualRes.json();
      if (!visualRes.ok) throw new Error(visualData.error || "Visual comparison failed");

      // Update display for both DL and SIFT similarity
      setVisualResult(
        `Deep Learning Match: ${visualData.deep_learning_match ? "✅" : "❌"} (Similarity: ${visualData.deep_learning_similarity.toFixed(2)})
          SIFT Match: ${visualData.sift_match ? "✅" : "❌"} (Similarity: ${visualData.sift_similarity.toFixed(2)})`
      );


      setStatus("Completed");
    } catch (err) {
      console.error(err);
      setError(err.message || "Error during OCR, Gemini, or visual comparison");
      setStatus("Failed");
    }
  };

  return (
   <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8f6f1] p-6">
  
  {/* Masked Effect Section */}
  <div className="w-full mb-10">
    <MaskContainer
      revealText={
        <p className="mx-auto max-w-4xl text-center text-4xl font-bold text-slate-800 dark:text-white">
          Legacy Certificate Comparison
        </p>
      }
      className="h-[20rem] rounded-md border text-white dark:text-black"
    >
      Verify authenticity of{" "}
      <span className="text-blue-500">certificates</span> with{" "}
      <span className="text-blue-500">OCR + AI</span>.
    </MaskContainer>
  </div>
      <div className="bg-[#e1eae5] rounded-2xl shadow-lg p-8 w-full max-w-3xl">
        <h1 className="text-2xl font-bold text-center text-[#4e796b] mb-6">
          
        </h1>

        {/* Year */}
        <div className="mb-4">
          <label className="block font-semibold text-[#4e796b] mb-2">
            Year
          </label>
          <input
            type="number"
            value={year}
            onChange={(e) => {
              // const val = e.target.value;
              // setYear(val);
              // if (val && parseInt(val) < 2020) {
              //   setIsLegacy(true);
              // } else {
              //   setIsLegacy(false);
              //   setLegacyType("");
              // }
              const val = e.target.value.slice(0, 4); // keep max 4 digits
              setYear(val);

              if (val.length === 4) {
                const currentYear = new Date().getFullYear();

                if (parseInt(val) < currentYear) {
                  setIsLegacy(true);
                } else {
                  setIsLegacy(true);
                  setLegacyType("");
                }
              }
            }}
            className="w-full px-3 py-2 rounded-lg border border-[#a7d7b8] bg-[#f8f6f1] outline-none"
            placeholder="Enter year"
          />
        </div>

        {/* Legacy type */}
        {isLegacy && (
          <div className="mb-4">
            <label className="block font-semibold text-[#4e796b] mb-2">
              Legacy Certificate Type
            </label>
            <select value={legacyType} onChange={(e) => setLegacyType(e.target.value)}>
              <option value="">Select type</option>
              <option value="scanned">Scanned Document</option>
              <option value="normal">Normal</option>
            </select>
          </div>
        )}

        {/* Organization */}
        <div className="mb-4">
          <label className="block font-semibold text-[#4e796b] mb-2">
            Organization
          </label>
          <input
            type="text"
            value={organization}
            onChange={(e) => setOrganization(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-[#a7d7b8] bg-[#f8f6f1] outline-none"
            placeholder="Enter organization name"
          />
        </div>

        {/* file inputs */}
        {[0, 1].map((index) => (
          <div key={index} className="mb-6">
            <label className="block font-semibold text-[#4e796b] mb-2">
              Upload Certificate {index + 1}
            </label>
            <input type="file" accept="image/*,.pdf" onChange={handleFileChange(index)}
              className="block w-full px-3 py-2 rounded-lg border border-[#a7d7b8] bg-[#f8f6f1] outline-none" />
            {selectedImages[index] && (
              <img
                src={URL.createObjectURL(selectedImages[index])}
                alt={`Certificate ${index + 1}`}
                className="mt-3 rounded-lg border-2 border-[#a7d7b8] shadow-md max-w-xs"

              />
            )}
          </div>
        ))}


        {/* Compare Button */}
        <button
          onClick={readImageText}
          className="w-full py-3 rounded-xl bg-[#a7d7b8] text-white font-semibold text-lg transition-colors hover:bg-[#66b2a0]"
        >
          Compare Certificates
        </button>

        {/* Status + Results */}
        <p className="mt-4 font-bold text-[#4e796b]">Status: {status}</p>
        {error && <p className="text-red-600 mt-2">Error: {error}</p>}

        {formattedFields[0] && formattedFields[1] && (
          <div className="mt-6">
            <h3 className="font-semibold text-[#4e796b]">Certificate 1 Fields:</h3>
            <pre className="bg-[#f8f6f1] p-3 rounded-lg overflow-x-auto">
              {JSON.stringify(formattedFields[0], null, 2)}
            </pre>

            <h3 className="font-semibold text-[#4e796b] mt-4">Certificate 2 Fields:</h3>
            <pre className="bg-[#f8f6f1] p-3 rounded-lg overflow-x-auto">
              {JSON.stringify(formattedFields[1], null, 2)}
            </pre>
          </div>
        )}

        {comparisonResult && (
          <h2 className="mt-6 text-lg font-bold">
            Text Comparison Result:{" "}
            <span
              className={
                comparisonResult.includes("YES") ? "text-green-600" : "text-red-600"
              }
            >
              {comparisonResult}
            </span>
          </h2>
        )}

        {visualResult && (
          <h2 className="mt-4 text-lg font-bold">
            Visual Comparison Result: <span>{visualResult}</span>
          </h2>
        )}
      </div>
    </div>
  );
};

export default OcrComparer;

{/* 

          {[0, 1].map((index) => (
            <div key={index} style={{ marginTop: 15 }}>
              <input type="file" accept="image/*,.pdf" onChange={handleFileChange(index)} />
              {selectedImages[index] && (
                <img
                  src={URL.createObjectURL(selectedImages[index])}
                  alt={`Certificate ${index + 1}`}
                  width={300}
                  style={{ marginTop: 10 }}
                />
              )}
            </div>
          ))} */}

{/* <div style={{ marginTop: 20 }}>
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

  export default OcrComparer; */}
