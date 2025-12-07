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

  const getTamperingLevel = (score) => {
    if (score < 0.2) return { level: "Low Risk", color: "#4CAF50", description: "Minimal differences detected" };
    if (score < 0.4) return { level: "Medium Risk", color: "#FF9800", description: "Moderate tampering suspected" };
    if (score < 0.7) return { level: "High Risk", color: "#FF5722", description: "Significant tampering detected" };
    return { level: "Critical", color: "#F44336", description: "Severe tampering detected" };
  };

  const formatConfidence = (confidence) => {
    if (confidence >= 80) return { text: "High", color: "#4CAF50" };
    if (confidence >= 60) return { text: "Medium", color: "#FF9800" };
    return { text: "Low", color: "#FF5722" };
  };

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

      // Override organization and add the manually entered year
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
        setResult({
          tampering: true,
          mismatches: ["No certificate found for this organization."],
        });
        setError("No certificates found for the specified organization.");
        setStatus("Verification Failed ❌");
        return;
      }

      // Fields to compare
      const keys = [
        "name",
        "courseName",
        "courseId",
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
        setResult({
          tampering: true,
          mismatches: ["No closely matching certificate found."],
        });
        setStatus("Verification Failed ❌");
        return;
      }

      const tampering = bestMatch.mismatches.length > 0;

      // Set the initial result based on OCR field comparison
      setResult({
        tampering,
        mismatches: bestMatch.mismatches,
        winner: bestMatch.cert,
      });

      setStatus("Verification complete ✅");

      
      if (bestMatch.cert?.url) {
        await compareCertificates(uploadedBase64, bestMatch.cert.url);
      } else {
        setError("Best matched certificate does not have a URL for comparison.");
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
      const dbCertBase64 = await convertUrlToBase64(dbCertUrl);

      if (!dbCertBase64) {
        throw new Error("Could not convert the database certificate URL to Base64.");
      }

      const compareRes = await fetch("http://localhost:5000/compare-images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          file1: `data:image/jpeg;base64,${uploadedBase64}`, // Ensure correct data URI format
          file2: dbCertBase64, // Already a data URI from the conversion function
        }),
      });

      const compareData = await compareRes.json();
      if (!compareRes.ok)
        throw new Error(compareData.error || "Image comparison failed");

      console.log("🔍 Compare result:", compareData);

      setStatus("Image comparison complete ✅");

      // Extend `result` state with the new comparison info
      setResult((prev) => ({
        ...prev,
        compareResult: compareData,
      }));
    } catch (err) {
      console.error("Image comparison error:", err);
      setError(`Image comparison failed: ${err.message}`);
      setStatus("Failed during comparison ❌");
    }
  };

  const convertUrlToBase64 = async (url) => {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to fetch the certificate image from URL: ${response.statusText}`);

      const blob = await response.blob();
      const reader = new FileReader();

      return new Promise((resolve, reject) => {
        reader.onloadend = () => {
          resolve(reader.result); // Returns a data URI e.g., "data:image/png;base64,XXXX..."
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

      <div className="bg-gradient-to-br from-[#e1eae5] to-[#d4ecd9] rounded-3xl shadow-2xl border border-[#a7d7b8]/30 p-8 w-full max-w-3xl backdrop-blur-lg">
        {/* Form Header */}
        <div className="mb-8 text-center">
          <div className="w-12 h-12 mx-auto mb-4 bg-gradient-to-r from-[#4e796b] to-[#66b2a0] rounded-xl flex items-center justify-center shadow-lg">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-[#4e796b] to-[#2d5a47] bg-clip-text text-transparent">
            Certificate Information
          </h2>
          <p className="text-[#4e796b]/70 text-sm mt-2">
            Please provide the following details to verify your certificate
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Year Input */}
          <div className="space-y-2">
            <label className="block font-semibold text-[#4e796b] text-sm">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-4 h-4 text-[#66b2a0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Certificate Year
              </div>
            </label>
            <div className="relative">
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value.slice(0, 4))}
                className="w-full px-4 py-3 rounded-xl border-2 border-[#a7d7b8]/50 bg-[#f8f6f1]/80 backdrop-blur-sm outline-none transition-all duration-300 focus:border-[#66b2a0] focus:ring-4 focus:ring-[#a7d7b8]/20 focus:bg-[#f8f6f1] placeholder:text-[#4e796b]/50 text-[#4e796b] font-medium"
                placeholder="e.g., 2023"
                min="1900"
                max="2030"
              />
            </div>
          </div>

          {/* Organization */}
          <div className="space-y-2">
            <label className="block font-semibold text-[#4e796b] text-sm">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-4 h-4 text-[#66b2a0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Organization Name
              </div>
            </label>
            <div className="relative">
              <input
                type="text"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-[#a7d7b8]/50 bg-[#f8f6f1]/80 backdrop-blur-sm outline-none transition-all duration-300 focus:border-[#66b2a0] focus:ring-4 focus:ring-[#a7d7b8]/20 focus:bg-[#f8f6f1] placeholder:text-[#4e796b]/50 text-[#4e796b] font-medium"
                placeholder="Enter organization name"
              />
            </div>
          </div>
        </div>

        {/* File Input */}
        <div className="mb-8 space-y-2">
          <label className="block font-semibold text-[#4e796b] text-sm">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-4 h-4 text-[#66b2a0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Upload Certificate
            </div>
          </label>
          <div className="relative">
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div className="border-2 border-dashed border-[#a7d7b8]/60 rounded-xl bg-[#f8f6f1]/50 p-6 text-center hover:border-[#66b2a0] hover:bg-[#f8f6f1]/80 transition-all duration-300">
              <div className="flex flex-col items-center space-y-3">
                <div className="w-12 h-12 bg-[#a7d7b8]/20 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-[#66b2a0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <div>
                  <p className="text-[#4e796b] font-medium">
                    {selectedImage ? selectedImage.name : "Choose certificate file"}
                  </p>
                  <p className="text-[#4e796b]/60 text-sm mt-1">
                    PNG, JPG, or PDF up to 10MB
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {selectedImage && (
            <div className="mt-4 p-4 bg-[#f8f6f1]/80 rounded-xl border border-[#a7d7b8]/30">
              <div className="flex items-center space-x-4">
                <img
                  src={URL.createObjectURL(selectedImage)}
                  alt="Certificate Preview"
                  className="w-24 h-24 object-cover rounded-lg border-2 border-[#a7d7b8]/50 shadow-md"
                />
                <div className="flex-1">
                  <p className="font-medium text-[#4e796b]">Selected File:</p>
                  <p className="text-[#4e796b]/70 text-sm">{selectedImage.name}</p>
                  <p className="text-[#4e796b]/60 text-xs">
                    {(selectedImage.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Extract Button */}
        <button
          onClick={readImageText}
          disabled={!selectedImage || !year || !organization}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-[#a7d7b8] to-[#66b2a0] text-white font-semibold text-lg transition-all duration-300 hover:from-[#66b2a0] hover:to-[#4e796b] hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg flex items-center justify-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Extract & Verify Certificate</span>
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
              <p className="text-green-600 font-bold mt-2">✅ No Text Tampering Detected</p>
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

            {/* Enhanced Image Comparison Result */}
            {result.compareResult && (
              <div className="mt-6 space-y-6">
                {/* Main Detection Results */}
                <div className="bg-white p-6 rounded-xl shadow-lg border">
                  <h4 className="text-xl font-bold text-[#4e796b] mb-4">🎯 Enhanced Detection Results</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {/* Overall Tampering Score */}
                    <div className="text-center p-4 rounded-lg border-2 border-gray-200">
                      <h5 className="font-semibold text-gray-700 mb-2">Overall Tampering Risk</h5>
                      <div 
                        className="w-20 h-20 mx-auto rounded-full flex flex-col items-center justify-center text-white font-bold"
                        style={{ backgroundColor: getTamperingLevel(result.compareResult.tampering_score || 0).color }}
                      >
                        <span className="text-lg">{Math.round((result.compareResult.tampering_score || 0) * 100)}%</span>
                        <span className="text-xs">{getTamperingLevel(result.compareResult.tampering_score || 0).level}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-2">{getTamperingLevel(result.compareResult.tampering_score || 0).description}</p>
                    </div>

                    {/* Computer Vision Score */}
                    <div className="p-4 rounded-lg border">
                      <h5 className="font-semibold text-gray-700 mb-2">🔍 SSIM Algorithm</h5>
                      <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
                        <div 
                          className="h-4 rounded-full" 
                          style={{ 
                            width: `${(result.compareResult.cv_tampering_score || 0) * 100}%`, 
                            backgroundColor: getTamperingLevel(result.compareResult.cv_tampering_score || 0).color 
                          }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{Math.round((result.compareResult.cv_tampering_score || 0) * 100)}%</span>
                    </div>

                    {/* NLP Analysis Score */}
                    <div className="p-4 rounded-lg border">
                      <h5 className="font-semibold text-gray-700 mb-2">🧠 NLP Analysis</h5>
                      <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
                        <div 
                          className="h-4 rounded-full" 
                          style={{ 
                            width: `${(result.compareResult.nlp_tampering_score || 0) * 100}%`, 
                            backgroundColor: getTamperingLevel(result.compareResult.nlp_tampering_score || 0).color 
                          }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{Math.round((result.compareResult.nlp_tampering_score || 0) * 100)}%</span>
                    </div>

                    {/* Similarity Score */}
                    <div className="p-4 rounded-lg border">
                      <h5 className="font-semibold text-gray-700 mb-2">🔗 Similarity Score</h5>
                      <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
                        <div 
                          className="h-4 rounded-full bg-blue-500" 
                          style={{ width: `${(result.compareResult.similarity_score || 0) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{Math.round((result.compareResult.similarity_score || 0) * 100)}%</span>
                    </div>
                  </div>

                  {/* Detection Info */}
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                    <span className="bg-blue-100 px-3 py-1 rounded-full">
                      Detection: {result.compareResult.detection_method || "hybrid_analysis"}
                    </span>
                    <span className={`px-3 py-1 rounded-full ${result.compareResult.aligned ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {result.compareResult.aligned ? "✅ Images Aligned" : "⚠️ Manual Alignment"}
                    </span>
                    <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full">
                      📍 {result.compareResult.num_boxes || 0} Suspicious Region(s)
                    </span>
                  </div>
                </div>

                {/* Visual Analysis Results */}
                {result.compareResult.analysis_images && (
                  <div className="bg-white p-6 rounded-xl shadow-lg border">
                    <h4 className="text-xl font-bold text-[#4e796b] mb-4">📊 Visual Analysis Results</h4>
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">
                        Algorithm: {result.compareResult.algorithm || "SSIM + Otsu + Morphological Operations"}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {result.compareResult.analysis_images.tampered_image && (
                        <div className="text-center">
                          <h5 className="font-semibold text-gray-700 mb-2">🎯 Detected Tampering</h5>
                          <img
                            src={result.compareResult.analysis_images.tampered_image}
                            alt="Tampered regions highlighted"
                            className="w-full rounded-lg border shadow-md"
                          />
                          <p className="text-sm text-gray-600 mt-2">Red boxes show detected tampering regions</p>
                        </div>
                      )}

                      {result.compareResult.analysis_images.heatmap_image && (
                        <div className="text-center">
                          <h5 className="font-semibold text-gray-700 mb-2">🌡️ Difference Heatmap</h5>
                          <img
                            src={result.compareResult.analysis_images.heatmap_image}
                            alt="Difference heatmap"
                            className="w-full rounded-lg border shadow-md"
                          />
                          <p className="text-sm text-gray-600 mt-2">Heat colors show difference intensity</p>
                        </div>
                      )}

                      {result.compareResult.analysis_images.overlay_image && (
                        <div className="text-center">
                          <h5 className="font-semibold text-gray-700 mb-2">🔄 Overlay Analysis</h5>
                          <img
                            src={result.compareResult.analysis_images.overlay_image}
                            alt="Overlay analysis"
                            className="w-full rounded-lg border shadow-md"
                          />
                          <p className="text-sm text-gray-600 mt-2">Combined view of original + differences</p>
                        </div>
                      )}

                      {result.compareResult.analysis_images.threshold_image && (
                        <div className="text-center">
                          <h5 className="font-semibold text-gray-700 mb-2">⚫ Binary Threshold</h5>
                          <img
                            src={result.compareResult.analysis_images.threshold_image}
                            alt="Binary threshold mask"
                            className="w-full rounded-lg border shadow-md"
                          />
                          <p className="text-sm text-gray-600 mt-2">Otsu threshold result (white = different)</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Text & Content Analysis */}
                {result.compareResult.nlp_analysis && result.compareResult.nlp_analysis.nlp_available && (
                  <div className="bg-white p-6 rounded-xl shadow-lg border">
                    <h4 className="text-xl font-bold text-[#4e796b] mb-4">📝 Text & Content Analysis</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <span className="block text-sm text-gray-600">Character Similarity</span>
                        <span className="text-lg font-bold text-blue-600">
                          {Math.round((result.compareResult.nlp_analysis.char_similarity || 0) * 100)}%
                        </span>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <span className="block text-sm text-gray-600">Word Similarity</span>
                        <span className="text-lg font-bold text-green-600">
                          {Math.round((result.compareResult.nlp_analysis.word_similarity || 0) * 100)}%
                        </span>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <span className="block text-sm text-gray-600">Semantic Similarity</span>
                        <span className="text-lg font-bold text-purple-600">
                          {Math.round((result.compareResult.nlp_analysis.semantic_similarity || 0) * 100)}%
                        </span>
                      </div>
                    </div>

                    {result.compareResult.nlp_analysis.critical_fields_changed && (
                      <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
                        <h5 className="font-bold text-red-800">⚠️ Critical Fields Changed</h5>
                        <p className="text-red-700">Important certificate information has been modified!</p>
                      </div>
                    )}

                    {/* Entity Changes */}
                    {result.compareResult.nlp_analysis.entity_changes && (
                      <div className="mb-4">
                        <h5 className="font-semibold text-gray-700 mb-2">🏷️ Named Entity Changes</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {result.compareResult.nlp_analysis.entity_changes.added?.length > 0 && (
                            <div className="bg-red-50 p-3 rounded-lg">
                              <h6 className="font-medium text-red-800 mb-2">➕ Added Entities:</h6>
                              <ul className="text-sm text-red-700">
                                {result.compareResult.nlp_analysis.entity_changes.added.map((entity, idx) => (
                                  <li key={idx} className="flex justify-between">
                                    <span>{entity[0]}</span>
                                    <span className="text-xs bg-red-200 px-2 py-1 rounded">({entity[1]})</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {result.compareResult.nlp_analysis.entity_changes.removed?.length > 0 && (
                            <div className="bg-yellow-50 p-3 rounded-lg">
                              <h6 className="font-medium text-yellow-800 mb-2">➖ Removed Entities:</h6>
                              <ul className="text-sm text-yellow-700">
                                {result.compareResult.nlp_analysis.entity_changes.removed.map((entity, idx) => (
                                  <li key={idx} className="flex justify-between">
                                    <span>{entity[0]}</span>
                                    <span className="text-xs bg-yellow-200 px-2 py-1 rounded">({entity[1]})</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Pattern Changes */}
                    {result.compareResult.nlp_analysis.pattern_changes && (
                      <div className="mb-4">
                        <h5 className="font-semibold text-gray-700 mb-2">🔢 Pattern Analysis</h5>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {Object.entries(result.compareResult.nlp_analysis.pattern_changes).map(([pattern, changes]) => (
                            <div key={pattern} className="bg-gray-50 p-3 rounded-lg">
                              <h6 className="font-medium text-gray-700 capitalize mb-2">{pattern}</h6>
                              {changes.added?.length > 0 && (
                                <div className="mb-2">
                                  <span className="text-xs text-green-600 font-medium">Added:</span>
                                  {changes.added.map((item, idx) => (
                                    <span key={idx} className="block text-xs bg-green-100 text-green-800 px-2 py-1 rounded mt-1">
                                      {item}
                                    </span>
                                  ))}
                                </div>
                              )}
                              {changes.removed?.length > 0 && (
                                <div>
                                  <span className="text-xs text-red-600 font-medium">Removed:</span>
                                  {changes.removed.map((item, idx) => (
                                    <span key={idx} className="block text-xs bg-red-100 text-red-800 px-2 py-1 rounded mt-1">
                                      {item}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* OCR Results */}
                {result.compareResult.ocr_original && result.compareResult.ocr_test && (
                  <div className="bg-white p-6 rounded-xl shadow-lg border">
                    <h4 className="text-xl font-bold text-[#4e796b] mb-4">👁️ OCR Extraction Results</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h5 className="font-semibold text-gray-700 mb-2">Original Certificate</h5>
                        <div className="flex gap-4 mb-3 text-sm">
                          <span className={`px-2 py-1 rounded ${formatConfidence(result.compareResult.ocr_original.confidence).color === '#4CAF50' ? 'bg-green-100 text-green-800' : formatConfidence(result.compareResult.ocr_original.confidence).color === '#FF9800' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                            Confidence: {formatConfidence(result.compareResult.ocr_original.confidence).text}
                          </span>
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                            Words: {result.compareResult.ocr_original.total_words || 0}
                          </span>
                        </div>
                        <div className="text-sm bg-white p-3 rounded border max-h-32 overflow-y-auto">
                          {result.compareResult.ocr_original.text?.substring(0, 200)}
                          {result.compareResult.ocr_original.text?.length > 200 && "..."}
                        </div>
                      </div>

                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h5 className="font-semibold text-gray-700 mb-2">Test Certificate</h5>
                        <div className="flex gap-4 mb-3 text-sm">
                          <span className={`px-2 py-1 rounded ${formatConfidence(result.compareResult.ocr_test.confidence).color === '#4CAF50' ? 'bg-green-100 text-green-800' : formatConfidence(result.compareResult.ocr_test.confidence).color === '#FF9800' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                            Confidence: {formatConfidence(result.compareResult.ocr_test.confidence).text}
                          </span>
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                            Words: {result.compareResult.ocr_test.total_words || 0}
                          </span>
                        </div>
                        <div className="text-sm bg-white p-3 rounded border max-h-32 overflow-y-auto">
                          {result.compareResult.ocr_test.text?.substring(0, 200)}
                          {result.compareResult.ocr_test.text?.length > 200 && "..."}
                        </div>
                      </div>
                    </div>
                  </div>
                )}



                {/* Technical Details */}
                <details className="bg-white p-6 rounded-xl shadow-lg border">
                  <summary className="font-bold text-[#4e796b] cursor-pointer text-lg mb-4">🔧 Technical Details</summary>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
                    <div className="bg-gray-50 p-3 rounded">
                      <span className="block text-gray-600">Match Points:</span>
                      <span className="font-medium">{result.compareResult.match_count || 0}</span>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <span className="block text-gray-600">Image Alignment:</span>
                      <span className="font-medium">{result.compareResult.aligned ? "Successful" : "Failed"}</span>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <span className="block text-gray-600">Bounding Boxes:</span>
                      <span className="font-medium">{result.compareResult.num_boxes || 0}</span>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <span className="block text-gray-600">NLP Available:</span>
                      <span className="font-medium">{result.compareResult.nlp_analysis?.nlp_available ? "Yes" : "No"}</span>
                    </div>
                  </div>
                  {result.compareResult.boxes && result.compareResult.boxes.length > 0 && (
                    <div className="mt-4">
                      <span className="block text-gray-600 mb-2">Box Coordinates:</span>
                      <div className="bg-gray-100 p-3 rounded text-xs font-mono overflow-x-auto">
                        {result.compareResult.boxes.map((box, idx) => (
                          <span key={idx} className="inline-block mr-2 mb-1 bg-white px-2 py-1 rounded">
                            [{box.join(", ")}]
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </details>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default OcrComparer;