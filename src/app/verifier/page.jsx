"use client";
import { MaskContainer } from "@/components/ui/svg-mask-effect";
import { useState } from "react";

const OcrComparer = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [ocrResult, setOcrResult] = useState("");
  const [formattedFields, setFormattedFields] = useState(null);
  const [status, setStatus] = useState("");
  const [comparisonResult, setComparisonResult] = useState(null);
  const [tamperingSummary, setTamperingSummary] = useState([]);
  const [error, setError] = useState(null);

  const [year, setYear] = useState("");
  const [organization, setOrganization] = useState("");
  const [legacyType, setLegacyType] = useState("");

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setSelectedImage(file);
    setOcrResult("");
    setFormattedFields(null);
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

  const fetchFileFromUrl = async (url) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch DB certificate");
    const blob = await res.blob();
    const fileName = url.split("/").pop();
    return new File([blob], fileName, { type: blob.type });
  };

  const readImageText = async () => {
    if (!selectedImage) {
      alert("Please select a certificate image");
      return;
    }

    if (!year || !organization) {
      alert("Please enter both year and organization");
      return;
    }

    setStatus("Processing OCR...");
    setError(null);
    setComparisonResult(null);
    setTamperingSummary([]);

    try {
      // ----------------- Step 1: Extract Text from Uploaded -----------------
      setStatus("Extracting text from uploaded certificate...");
      const text = await extractTextFromApi(selectedImage, legacyType || "scanned");
      setOcrResult(text);

      // ----------------- Step 2: Field Extraction via Gemini -----------------
      setStatus("Extracting fields from certificate text...");
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText: text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Field extraction failed");

      const uploadedFields = data.fields;
      setFormattedFields(uploadedFields);

      // ----------------- Step 3: Fetch all certificates from DB -----------------
      setStatus("Fetching certificates from database...");
      const dbRes = await fetch("/api/get-certf");
      const dbCertificates = await dbRes.json();
      if (!dbRes.ok) throw new Error(dbCertificates.error || "Failed to fetch DB certificates");

      // ----------------- Step 4: Find potential match -----------------
      const potentialMatch = dbCertificates.find((cert) => {
        const fields = cert; // db certificate fields
        return (
          fields.name === uploadedFields.name &&
          fields.degree === uploadedFields.degree &&
          fields.honors === uploadedFields.honors &&
          fields.grade === uploadedFields.grade &&
          fields.organisation.name === organization &&
          fields.year === year
        );
      });

      if (!potentialMatch) {
        setStatus("No matching certificate found. Not verified ❌");
        return;
      }

      setStatus("Potential match found. Downloading DB certificate...");

      // ----------------- Step 5: Download DB certificate -----------------
      const dbFile = await fetchFileFromUrl(potentialMatch.url);

      // ----------------- Step 6: Compare certificates -----------------
      setStatus("Comparing certificates...");
      const compareForm = new FormData();
      compareForm.append("uploaded", selectedImage);
      compareForm.append("dbCertificate", dbFile);

      const compareRes = await fetch("/api/compare_certificates", {
        method: "POST",
        body: compareForm,
      });
      const compareData = await compareRes.json();
      if (!compareRes.ok) throw new Error(compareData.error || "Comparison failed");

      setComparisonResult(compareData.result || "Comparison done");
      setTamperingSummary(compareData.tamperingSummary || []);
      setStatus("Completed ✅");

    } catch (err) {
      console.error(err);
      setError(err.message || "Error during verification");
      setStatus("Failed ❌");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8f6f1] p-6">
      <div className="w-full mb-10">
        <MaskContainer
          revealText={
            <p className="mx-auto max-w-4xl text-center text-4xl font-bold text-slate-800 dark:text-white">
              Certificate Verification
            </p>
          }
          className="h-[20rem] rounded-md border text-white dark:text-black"
        >
          Verify authenticity of certificates with OCR + AI.
        </MaskContainer>
      </div>

      <div className="bg-[#e1eae5] rounded-2xl shadow-lg p-8 w-full max-w-3xl">
        {/* Year Input */}
        <div className="mb-4">
          <label className="block font-semibold text-[#4e796b] mb-2">Year</label>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(e.target.value.slice(0, 4))}
            className="w-full px-3 py-2 rounded-lg border border-[#a7d7b8] bg-[#f8f6f1] outline-none"
            placeholder="Enter year"
          />
        </div>

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

        {/* File Input */}
        <div className="mb-6">
          <label className="block font-semibold text-[#4e796b] mb-2">Upload Certificate</label>
          <input
            type="file"
            accept="image/*,.pdf"
            onChange={handleFileChange}
            className="block w-full px-3 py-2 rounded-lg border border-[#a7d7b8] bg-[#f8f6f1] outline-none"
          />
          {selectedImage && (
            <img
              src={URL.createObjectURL(selectedImage)}
              alt="Certificate"
              className="mt-3 rounded-lg border-2 border-[#a7d7b8] shadow-md max-w-xs"
            />
          )}
        </div>

        {/* Compare Button */}
        <button
          onClick={readImageText}
          className="w-full py-3 rounded-xl bg-[#a7d7b8] text-white font-semibold text-lg transition-colors hover:bg-[#66b2a0]"
        >
          Verify Certificate
        </button>

        {/* Status & Errors */}
        <p className="mt-4 font-bold text-[#4e796b]">Status: {status}</p>
        {error && <p className="text-red-600 mt-2">Error: {error}</p>}

        {/* Parsed Fields */}
        {formattedFields && (
          <div className="mt-6">
            <h3 className="font-semibold text-[#4e796b]">Extracted Fields:</h3>
            <pre className="bg-[#f8f6f1] p-3 rounded-lg overflow-x-auto">{JSON.stringify(formattedFields, null, 2)}</pre>
          </div>
        )}

        {/* Text Comparison */}
        {comparisonResult && (
          <h2 className="mt-6 text-lg font-bold">
            Comparison Result:{" "}
            <span className={comparisonResult.includes("match") ? "text-green-600" : "text-red-600"}>
              {comparisonResult}
            </span>
          </h2>
        )}

        {/* Tampering Summary */}
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
