"use client";
import { MaskContainer } from "@/components/ui/svg-mask-effect";
import { useState } from "react";

const OcrComparer = () => {
  const [selectedImages, setSelectedImages] = useState([null, null]);
  const [ocrResults, setOcrResults] = useState(["", ""]);
  const [formattedFields, setFormattedFields] = useState([null, null]);
  const [status, setStatus] = useState("");
  const [comparisonResult, setComparisonResult] = useState(null);
  const [tamperingSummary, setTamperingSummary] = useState([]);
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
    setTamperingSummary([]);
    setError(null);
    setStatus("");
  };

  const extractTextFromApi = async (file, fileType) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", fileType); 

    const res = await fetch("http://localhost:5001/robust-ocr", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "OCR extraction failed");
    return data.results;
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
    setTamperingSummary([]);

    try {
      // ----------------- Step 1: Extract Text -----------------
      setStatus("Extracting text from first certificate...");
      const text1 = await extractTextFromApi(selectedImages[0], legacyType || "scanned");

      setStatus("Extracting text from second certificate...");
      const text2 = await extractTextFromApi(selectedImages[1], legacyType || "scanned");

      setOcrResults([text1, text2]);

      // ----------------- Step 2: Field Extraction via Gemini -----------------
      setStatus("Sending first certificate text to Gemini...");
      console.log(text1);
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

      // ----------------- Step 4: Visual Comparison -----------------
      const formData = new FormData();
      formData.append("file1", selectedImages[0]);
      formData.append("file2", selectedImages[1]);
      formData.append("file_type1", legacyType || "scanned");
      formData.append("file_type2", legacyType || "scanned");

      const visualRes = await fetch("http://localhost:5000/compare-images", {
        method: "POST",
        body: formData,
      });

      const visualData = await visualRes.json();
      if (!visualRes.ok) throw new Error(visualData.error || "Visual comparison failed");

      // ----------------- Step 5: Tampering Summary (Bullet Points) -----------------
      if (visualData.results) {
        const res = visualData.results;
        let summary = [];

        // Profile
        if (res.profile.error) {
          summary.push(`• Profile: ❌ ${res.profile.error}`);
        } else {
          summary.push(
            `• Profile - Deep Learning: ${res.profile.deep_learning_match ? "✅" : "❌"} ` +
            `(Similarity: ${res.profile.deep_learning_similarity.toFixed(2)}), ` +
            `SIFT: ${res.profile.sift_match ? "✅" : "❌"} ` +
            `(Similarity: ${res.profile.sift_similarity.toFixed(2)})`
          );
        }

        // Signature
        if (res.sign.error) {
          summary.push(`• Signature: ❌ ${res.sign.error}`);
        } else {
          summary.push(
            `• Signature - Deep Learning: ${res.sign.deep_learning_match ? "✅" : "❌"} ` +
            `(Similarity: ${res.sign.deep_learning_similarity.toFixed(2)}), ` +
            `SIFT: ${res.sign.sift_match ? "✅" : "❌"} ` +
            `(Similarity: ${res.sign.sift_similarity.toFixed(2)})`
          );
        }

        // Overall
        summary.push(
          `• Overall Tampering Suspected: ${res.tampering_suspected ? "⚠️ Yes" : "No"}`
        );

        setTamperingSummary(summary);
      }

      setStatus("Completed");
    } catch (err) {
      console.error(err);
      setError(err.message || "Error during OCR, Gemini, or visual comparison");
      setStatus("Failed");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8f6f1] p-6">
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

        {/* Year Input */}
        <div className="mb-4">
          <label className="block font-semibold text-[#4e796b] mb-2">Year</label>
          <input
            type="number"
            value={year}
            onChange={(e) => {
              const val = e.target.value.slice(0, 4);
              setYear(val);
              if (val.length === 4) {
                const currentYear = new Date().getFullYear();
                setIsLegacy(parseInt(val) < currentYear);
                setLegacyType("");
              }
            }}
            className="w-full px-3 py-2 rounded-lg border border-[#a7d7b8] bg-[#f8f6f1] outline-none"
            placeholder="Enter year"
          />
        </div>

        {/* Legacy type */}
        {isLegacy && (
          <div className="mb-4">
            <label className="block font-semibold text-[#4e796b] mb-2">Legacy Certificate Type</label>
            <select value={legacyType} onChange={(e) => setLegacyType(e.target.value)}>
              <option value="">Select type</option>
              <option value="scanned">Scanned Document</option>
              <option value="normal">Normal</option>
            </select>
          </div>
        )}

        {/* Organization */}
        <div className="mb-4">
          <label className="block font-semibold text-[#4e796b] mb-2">Organization</label>
          <input
            type="text"
            value={organization}
            onChange={(e) => setOrganization(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-[#a7d7b8] bg-[#f8f6f1] outline-none"
            placeholder="Enter organization name"
          />
        </div>

        {/* File Inputs */}
        {[0, 1].map((index) => (
          <div key={index} className="mb-6">
            <label className="block font-semibold text-[#4e796b] mb-2">Upload Certificate {index + 1}</label>
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileChange(index)}
              className="block w-full px-3 py-2 rounded-lg border border-[#a7d7b8] bg-[#f8f6f1] outline-none"
            />
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

        {/* Status & Errors */}
        <p className="mt-4 font-bold text-[#4e796b]">Status: {status}</p>
        {error && <p className="text-red-600 mt-2">Error: {error}</p>}

        {/* Parsed Fields */}
        {formattedFields[0] && formattedFields[1] && (
          <div className="mt-6">
            <h3 className="font-semibold text-[#4e796b]">Certificate 1 Fields:</h3>
            <pre className="bg-[#f8f6f1] p-3 rounded-lg overflow-x-auto">{JSON.stringify(formattedFields[0], null, 2)}</pre>

            <h3 className="font-semibold text-[#4e796b] mt-4">Certificate 2 Fields:</h3>
            <pre className="bg-[#f8f6f1] p-3 rounded-lg overflow-x-auto">{JSON.stringify(formattedFields[1], null, 2)}</pre>
          </div>
        )}

        {/* Text Comparison */}
        {comparisonResult && (
          <h2 className="mt-6 text-lg font-bold">
            Text Comparison Result:{" "}
            <span className={comparisonResult.includes("YES") ? "text-green-600" : "text-red-600"}>
              {comparisonResult}
            </span>
          </h2>
        )}

        {/* Tampering Summary in Bullet Points */}
        {tamperingSummary.length > 0 && (
          <div className="mt-4">
            <h2 className="text-lg font-bold text-[#4e796b]">Tampering Summary:</h2>
            <ul className="list-disc list-inside mt-2 text-[#4e796b]">
              {tamperingSummary.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default OcrComparer;
