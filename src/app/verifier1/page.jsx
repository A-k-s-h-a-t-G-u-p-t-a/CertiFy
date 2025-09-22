"use client";
import { MaskContainer } from "@/components/ui/svg-mask-effect";
import { useState } from "react";

const OcrComparer = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [formattedFields, setFormattedFields] = useState(null);
  const [status, setStatus] = useState("");
  const [error, setError] = useState(null);

  const [year, setYear] = useState("");
  const [organization, setOrganization] = useState("");

  const [result, setResult] = useState(null); // store comparison result

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setSelectedImage(file);
    setFormattedFields(null);
    setError(null);
    setStatus("");
    setResult(null);
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

    try {
      // ---------------- Convert file to Base64 ----------------
      const fileBuffer = await selectedImage.arrayBuffer();
      const base64Data = btoa(
        new Uint8Array(fileBuffer).reduce(
          (data, byte) => data + String.fromCharCode(byte),
          ""
        )
      );

      // ---------------- Send file directly to OCR backend ----------------
      const res = await fetch("http://localhost:5001/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: selectedImage.name,
          b64: base64Data,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "OCR extraction failed");

      // The OCR backend returns fields in results[0].fields
      const fields = data?.results?.[0]?.fields || {};

      // Override organization and year with manually entered values
      const finalFields = {
        ...fields,
        organisation: organization,
        
      };

      setFormattedFields(finalFields);
      setStatus("Fields extracted successfully ✅");

      // Now verify against DB
      await verifyAgainstDatabase(finalFields, base64Data);
    } catch (err) {
      console.error(err);
      setError(err.message || "Error during OCR");
      setStatus("Failed ❌");
    }
  };

  const verifyAgainstDatabase = async (extractedFields, uploadedBase64) => {
    try {
      setStatus("Fetching certificates from DB...");

      const res = await fetch("/api/get-certf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organisation: extractedFields.organisation }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch certificates");

      const certs = data.certificates || [];

      if (certs.length === 0) {
        setResult({ tampering: true, mismatches: ["No certificate found"] });
        return;
      }

      // Fields to compare (year comes from OCR now)
      const keys = [
        "name",
        "degree",
        "honors",
        "rollNo",
        "grade",
        "year",
        "certificateId",
      ];

      let bestMatch = null;
      let maxMatches = -1;

      certs.forEach((cert) => {
        let matches = 0;
        let mismatches = [];

        keys.forEach((key) => {
          const ocrVal =
            extractedFields[key]?.toString().trim().toLowerCase() || null;
          const dbVal = cert[key]?.toString().trim().toLowerCase() || null;

          if (ocrVal === dbVal) {
            matches++;
          } else {
            mismatches.push(key);
          }
        });

        if (matches > maxMatches) {
          maxMatches = matches;
          bestMatch = { cert, mismatches };
        }
      });

      if (!bestMatch) {
        setResult({ tampering: true, mismatches: ["No matching certificate"] });
        return;
      }

      const tampering = bestMatch.mismatches.length > 0;

      setResult({
        tampering,
        mismatches: bestMatch.mismatches,
        winner: bestMatch.cert,
      });

      setStatus("Verification complete ✅");

      // ---- NEW: If no tampering, run image comparison ----
      if (!tampering && bestMatch.cert?.url) {
        await compareCertificates(uploadedBase64, bestMatch.cert.url);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Verification failed");
      setStatus("Failed ❌");
    }
  };

  const compareCertificates = async (uploadedBase64, dbCertUrl) => {
    try {
      setStatus("Performing additional image comparison...");

      // Convert DB certificate URL (Cloudinary) → Base64
      const dbCertBase64 = await convertPdfUrlToBase64(dbCertUrl);

      const compareRes = await fetch("http://localhost:5000/compare-images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          file1: uploadedBase64, // uploaded file
          file2: dbCertBase64, // db file
        }),
      });

      const compareData = await compareRes.json();
      if (!compareRes.ok)
        throw new Error(compareData.error || "Image comparison failed");

      console.log("🔍 Compare result:", compareData);

      setStatus("Image comparison complete ✅");

      // extend `result` with compare info
      setResult((prev) => ({
        ...prev,
        compareResult: compareData,
      }));
    } catch (err) {
      console.error("Image comparison error:", err);
      setError("Image comparison failed");
      setStatus("Failed during comparison ❌");
    }
  };

  const convertPdfUrlToBase64 = async (pdfUrl) => {
    try {
      const response = await fetch(pdfUrl);
      if (!response.ok) throw new Error("Failed to fetch PDF");

      const blob = await response.blob();
      const reader = new FileReader();

      return new Promise((resolve, reject) => {
        reader.onloadend = () => {
          resolve(reader.result); // "data:application/pdf;base64,XXXX..."
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (err) {
      console.error(err);
      return null;
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

        {/* File Input */}
        <div className="mb-6">
          <label className="block font-semibold text-[#4e796b] mb-2">
            Upload Certificate
          </label>
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

        {/* Extract Button */}
        <button
          onClick={readImageText}
          className="w-full py-3 rounded-xl bg-[#a7d7b8] text-white font-semibold text-lg transition-colors hover:bg-[#66b2a0]"
        >
          Extract & Verify
        </button>

        {/* Status & Errors */}
        <p className="mt-4 font-bold text-[#4e796b]">Status: {status}</p>
        {error && <p className="text-red-600 mt-2">Error: {error}</p>}

        {/* Parsed Fields */}
        {formattedFields && (
          <div className="mt-6">
            <h3 className="font-semibold text-[#4e796b]">Extracted Fields:</h3>
            <pre className="bg-[#f8f6f1] p-3 rounded-lg overflow-x-auto">
              {JSON.stringify(formattedFields, null, 2)}
            </pre>
          </div>
        )}

        {/* Verification Result */}
        {result && (
          <div className="mt-6">
            <h3 className="font-semibold text-[#4e796b]">
              Verification Result:
            </h3>
            {result.tampering ? (
              <p className="text-red-600 font-bold mt-2">
                ⚠️ Tampering Detected! Mismatched fields:{" "}
                {result.mismatches.join(", ")}
              </p>
            ) : (
              <p className="text-green-600 font-bold mt-2">✅ No Tampering</p>
            )}
            {result.winner && (
              <div className="mt-3">
                <p>
                  <span className="font-semibold">Matched Certificate URL:</span>{" "}
                  <a
                    href={result.winner.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline"
                  >
                    {result.winner.url}
                  </a>
                </p>
              </div>
            )}

            {/* Image Comparison Result */}
            {result.compareResult && (
  <div className="mt-4 p-4 rounded-lg bg-white border shadow-sm">
    <h4 className="font-semibold text-[#4e796b] mb-3">
      🔍 Additional Image Comparison
    </h4>

    {/* Tampering Details */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {Object.entries(result.compareResult.tampering_details).map(
        ([key, value]) => (
          <div
            key={key}
            className={`p-3 rounded-lg text-white font-semibold ${
              value === "Match"
                ? "bg-green-500"
                : value === "Mismatch"
                ? "bg-red-500"
                : "bg-gray-400"
            }`}
          >
            {key.charAt(0).toUpperCase() + key.slice(1)}: {value}
          </div>
        )
      )}
    </div>

    {/* Detailed similarity scores */}
    {result.compareResult.results && (
      <div className="mt-4">
        {["profile", "sign"].map((item) => {
          const res = result.compareResult.results[item];
          if (!res) return null;

          return (
            <div key={item} className="mb-3 p-3 rounded-lg border bg-[#f8f6f1]">
              <h5 className="font-semibold text-[#4e796b]">
                {item.charAt(0).toUpperCase() + item.slice(1)} Similarity:
              </h5>
              {res.error ? (
                <p className="text-red-600">{res.error}</p>
              ) : (
                <ul className="list-disc ml-5">
                  <li>Deep Learning Similarity: {res.deep_learning_similarity.toFixed(3)}</li>
                  <li>SIFT Similarity: {res.sift_similarity.toFixed(3)}</li>
                  <li>
                    Match Status:{" "}
                    <span
                      className={`font-bold ${
                        res.match ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {res.match ? "✅ Match" : "⚠️ Mismatch"}
                    </span>
                  </li>
                </ul>
              )}
            </div>
          );
        })}
      </div>
    )}
  </div>
)}

      {/* Cropped / Boxed Images Section */}
{result?.compareResult?.boxed_images && (
  <div className="mt-6 p-4 rounded-lg bg-white border shadow-sm">
    <h3 className="font-semibold text-[#4e796b] mb-4">🖼️ Cropped / Highlighted Images</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Uploaded File */}
      <div className="flex flex-col items-center">
        <h4 className="font-semibold text-[#4e796b] mb-2">Uploaded File</h4>
        {result.compareResult.boxed_images.file1 ? (
          <img
            src={result.compareResult.boxed_images.file1}
            alt="Uploaded with boxes"
            className="rounded-lg border border-[#a7d7b8] shadow-md max-w-xs"
          />
        ) : (
          <p className="text-gray-500">No profile/sign detected</p>
        )}
      </div>

      {/* Best Matched File */}
      <div className="flex flex-col items-center">
        <h4 className="font-semibold text-[#4e796b] mb-2">Best Matched File</h4>
        {result.compareResult.boxed_images.file2 ? (
          <img
            src={result.compareResult.boxed_images.file2}
            alt="Best matched with boxes"
            className="rounded-lg border border-[#a7d7b8] shadow-md max-w-xs"
          />
        ) : (
          <p className="text-gray-500">No profile/sign detected</p>
        )}
      </div>
    </div>
  </div>
)}


          </div>
        )}
      </div>
    </div>
  );
};

export default OcrComparer;
