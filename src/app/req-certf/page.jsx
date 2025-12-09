"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { 
  Upload, 
  FileText, 
  Building2, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Loader2,
  Shield,
  ChevronDown,
  ChevronUp,
  Eye,
  User,
  Hash
} from "lucide-react";

const CertificateVerification = () => {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [formattedFields, setFormattedFields] = useState(null);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const [year, setYear] = useState("");
  const [organization, setOrganization] = useState("");

  const [result, setResult] = useState(null);
  const [alertCreated, setAlertCreated] = useState(false);
  const [verificationComplete, setVerificationComplete] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Protect route - only allow students
  useEffect(() => {
    if (sessionStatus === "loading") return;
    
    if (!session) {
      router.push("/signin");
      return;
    }

    if (session.user.role !== "user") {
      router.push("/");
      alert("Access denied. This page is only accessible to students.");
    }
  }, [session, sessionStatus, router]);

  const getTamperingLevel = (score) => {
    if (score < 0.2) return { level: "Low", color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" };
    if (score < 0.4) return { level: "Medium", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" };
    if (score < 0.7) return { level: "High", color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-200" };
    return { level: "Critical", color: "text-red-600", bg: "bg-red-50", border: "border-red-200" };
  };

  const formatConfidence = (confidence) => {
    if (!confidence) return { text: "N/A", color: "text-slate-500" };
    const value = Math.round(confidence * 100);
    if (value >= 80) return { text: `${value}%`, color: "text-emerald-600" };
    if (value >= 60) return { text: `${value}%`, color: "text-amber-600" };
    return { text: `${value}%`, color: "text-red-600" };
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
      setFormattedFields(null);
      setError(null);
      setStatus("idle");
      setResult(null);
      setAlertCreated(false);
      setVerificationComplete(false);
    }
  };

  const clearFile = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setFormattedFields(null);
    setError(null);
    setStatus("idle");
    setResult(null);
    setAlertCreated(false);
    setVerificationComplete(false);
  };

  const readImageText = async () => {
    if (!selectedImage) {
      setError("Please select a certificate image");
      return;
    }

    if (!year || !organization) {
      setError("Please enter both year and organization");
      return;
    }

    setStatus("processing");
    setError(null);
    setIsProcessing(true);

    try {
      const fileBuffer = await selectedImage.arrayBuffer();
      const base64Data = btoa(
        new Uint8Array(fileBuffer).reduce(
          (data, byte) => data + String.fromCharCode(byte),
          ""
        )
      );

      let res, data;
      try {
        res = await fetch("http://localhost:5001/extract", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename: selectedImage.name,
            b64: base64Data,
          }),
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.error || `OCR service returned ${res.status}`);
        }

        data = await res.json();
      } catch (err) {
        if (err.name === 'TypeError' && err.message.includes('fetch')) {
          throw new Error("Cannot connect to OCR service. Please ensure it's running on port 5001.");
        }
        throw err;
      }

      const ocrText = data?.results?.[0]?.ocr_text || "";
      const fields = data?.results?.[0]?.fields || {};
      
      console.log("📄 RAW OCR TEXT:", ocrText);
      console.log("📋 OCR Extracted Fields:", fields);

      const finalFields = {
        certificateId: fields.certificateId || "",
        name: fields.name || "",
        nqrCode: fields.nqrCode || "",
        courseName: fields.courseName || "",
        apaarId: fields.apaarId || "",
        year: year,
        organisation: organization,
      };
      
      console.log("✅ OCR Extracted Fields:", finalFields);

      setFormattedFields(finalFields);
      setStatus("verifying");

      await verifyAgainstDatabase(finalFields, base64Data);
    } catch (err) {
      console.error(err);
      setError(err.message || "Error during OCR");
      setStatus("error");
      setIsProcessing(false);
    }
  };

  const verifyAgainstDatabase = async (extractedFields, uploadedBase64) => {
    try {
      let res, data;
      try {
        res = await fetch("/api/get-certf", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ organisation: extractedFields.organisation }),
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to fetch certificates (${res.status})`);
        }

        data = await res.json();
      } catch (err) {
        if (err.name === 'TypeError' && err.message.includes('fetch')) {
          throw new Error("Cannot connect to database API. Please check your connection.");
        }
        throw err;
      }

      const certs = data.certificates || [];

      if (certs.length === 0) {
        setResult({
          tampering: true,
          mismatches: ["No certificate found for this organization."],
        });
        setError("No certificates found for the specified organization.");
        setStatus("error");
        setIsProcessing(false);
        return;
      }

      const keys = ["name", "courseName", "nqrCode", "year", "certificateId", "apaarId"];

      let bestMatch = null;
      let maxMatches = -1;

      certs.forEach((cert) => {
        let matches = 0;
        let mismatches = [];

        keys.forEach((key) => {
          const ocrVal = extractedFields[key]?.toString().trim().toLowerCase() || null;
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
        setStatus("error");
        setIsProcessing(false);
        return;
      }

      const tampering = bestMatch.mismatches.length > 0;
      const initialResult = { tampering, mismatches: bestMatch.mismatches, winner: bestMatch.cert };
      
      setResult(initialResult);
      setStatus("comparing");

      if (bestMatch.cert?.url) {
        await compareCertificates(uploadedBase64, bestMatch.cert.url, initialResult);
      } else {
        setError("Best matched certificate does not have a URL for comparison.");
        setVerificationComplete(true);
        setIsProcessing(false);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Verification failed");
      setStatus("error");
      setIsProcessing(false);
    }
  };

  const compareCertificates = async (uploadedBase64, dbCertUrl, currentResult) => {
    try {
      const dbCertBase64 = await convertUrlToBase64(dbCertUrl);

      if (!dbCertBase64) {
        throw new Error("Could not convert the database certificate URL to Base64.");
      }

      let compareRes, compareData;
      try {
        compareRes = await fetch("http://localhost:5000/compare-images", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            file1: `data:image/jpeg;base64,${uploadedBase64}`,
            file2: dbCertBase64,
          }),
        });

        if (!compareRes.ok) {
          const errorData = await compareRes.json().catch(() => ({}));
          throw new Error(errorData.error || errorData.detail || `Image comparison failed (${compareRes.status})`);
        }

        compareData = await compareRes.json();
      } catch (err) {
        if (err.name === 'TypeError' && err.message.includes('fetch')) {
          throw new Error("Cannot connect to Python comparison service on port 5000.");
        }
        throw err;
      }

      const updatedResult = { ...currentResult, compareResult: compareData };
      setResult(updatedResult);

      const noMismatchedFields = currentResult?.mismatches?.length === 0;
      const tamperingScore = compareData?.tampering_score || 0;
      const similarityScore = compareData?.similarity_score || 0;

      // If similarity is 100% (or >= 0.99), ignore field mismatches due to OCR inaccuracies
      const shouldIgnoreMismatches = similarityScore >= 0.99;

      setVerificationComplete(true);
      setIsProcessing(false);

      if ((noMismatchedFields || shouldIgnoreMismatches) && tamperingScore === 0) {
        try {
          await createAlert(currentResult.winner, organization, compareData);
          setStatus("success");
        } catch (alertErr) {
          console.error("❌ Alert creation failed:", alertErr);
          setAlertCreated(false);
          setError(`Alert creation failed: ${alertErr.message}`);
          setStatus("error");
        }
      } else {
        setAlertCreated(false);
        setStatus("rejected");
      }
    } catch (err) {
      console.error("Image comparison error:", err);
      setError(`Image comparison failed: ${err.message}`);
      setStatus("error");
      setVerificationComplete(true);
      setAlertCreated(false);
      setIsProcessing(false);
    }
  };

  const createAlert = async (certificate, organisationName, comparisonData) => {
    try {
      if (!certificate || !certificate.id) {
        throw new Error("Invalid certificate data - missing certificate ID");
      }

      const alertRes = await fetch("/api/alerts/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          certificateId: certificate.id,
          organisationName: organisationName,
          message: `Certificate verification request. Similarity: ${(comparisonData.similarity_score * 100).toFixed(2)}%, Tampering Score: ${(comparisonData.tampering_score * 100).toFixed(2)}%`,
          comparisonData: {
            similarityScore: comparisonData.similarity_score,
            tamperingScore: comparisonData.tampering_score,
            cvTamperingScore: comparisonData.cv_tampering_score,
            nlpTamperingScore: comparisonData.nlp_tampering_score,
            ssimScore: comparisonData.ssim_score,
          },
          fullComparisonResult: comparisonData,
          extractedFields: formattedFields,
        }),
      });

      if (!alertRes.ok) {
        const errorData = await alertRes.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || `Alert API returned ${alertRes.status}`);
      }

      const alertData = await alertRes.json();

      if (alertData.success) {
        setAlertCreated(true);
      } else {
        throw new Error(alertData.error || "Alert creation failed");
      }
    } catch (err) {
      setAlertCreated(false);
      throw err;
    }
  };

  const convertUrlToBase64 = async (url) => {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to fetch the certificate image`);

      const blob = await response.blob();
      const reader = new FileReader();

      return new Promise((resolve, reject) => {
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (err) {
      console.error(err);
      return null;
    }
  };

  // Loading state
  if (sessionStatus === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-emerald-50/30">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600 mx-auto mb-3" />
          <p className="text-teal-700 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session || session.user.role !== "user") {
    return null;
  }

  const getStatusMessage = () => {
    switch (status) {
      case "processing": return "Extracting text from certificate...";
      case "verifying": return "Verifying against database...";
      case "comparing": return "Comparing certificate images...";
      case "success": return "Verification complete";
      case "rejected": return "Verification failed";
      case "error": return "An error occurred";
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/50 to-white">
      {/* Header */}
      <div className="bg-white border-b border-emerald-100">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-teal-600 rounded-lg">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-semibold text-[#0f4030]">Request Certificate</h1>
          </div>
          <p className="text-teal-700/70 text-sm">
            Submit your certificate for review and blockchain registration
          </p>
          {session?.user?.apaarId && (
            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-100 rounded-full text-sm">
              <User className="w-3.5 h-3.5 text-teal-600" />
              <span className="text-teal-700">APAAR ID: <span className="font-medium text-[#0f4030]">{session.user.apaarId}</span></span>
            </div>
          )}
        </div>
      </div>
      
      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Form Card */}
        <div className="bg-white rounded-xl border border-emerald-100 shadow-sm shadow-emerald-100/50">
          {/* Form Inputs */}
          <div className="p-6 space-y-5">
            {/* Year & Organization */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#0f4030] mb-1.5">
                  <Calendar className="w-3.5 h-3.5 inline mr-1.5 text-teal-600" />
                  Year
                </label>
                <input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(e.target.value.slice(0, 4))}
                  className="w-full px-3 py-2 border border-emerald-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                  placeholder="2024"
                  min="1900"
                  max="2030"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0f4030] mb-1.5">
                  <Building2 className="w-3.5 h-3.5 inline mr-1.5 text-teal-600" />
                  Organization
                </label>
                <input
                  type="text"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  className="w-full px-3 py-2 border border-emerald-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                  placeholder="Enter organization name"
                />
              </div>
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-[#0f4030] mb-1.5">
                <FileText className="w-3.5 h-3.5 inline mr-1.5 text-teal-600" />
                Certificate Image
              </label>
              
              {!selectedImage ? (
                <label className="relative block border-2 border-dashed border-emerald-200 rounded-lg p-8 text-center cursor-pointer hover:border-teal-400 hover:bg-emerald-50/50 transition-all">
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Upload className="w-8 h-8 text-emerald-300 mx-auto mb-2" />
                  <p className="text-sm text-[#0f4030] font-medium">Click to upload certificate</p>
                  <p className="text-xs text-teal-600/60 mt-1">PNG, JPG or PDF up to 10MB</p>
                </label>
              ) : (
                <div className="border border-emerald-200 rounded-lg p-4 bg-emerald-50/30">
                  <div className="flex items-start gap-4">
                    <img
                      src={imagePreview}
                      alt="Certificate preview"
                      className="w-20 h-20 object-cover rounded-lg border border-emerald-200"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{selectedImage.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {(selectedImage.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                      <button
                        onClick={clearFile}
                        className="mt-2 text-xs text-red-600 hover:text-red-700 font-medium"
                      >
                        Remove file
                      </button>
                    </div>
                    <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  </div>
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-lg">
                <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={readImageText}
              disabled={!selectedImage || !year || !organization || isProcessing || verificationComplete}
              className="w-full py-3 bg-teal-600 text-white rounded-lg font-medium text-sm hover:bg-teal-700 disabled:bg-emerald-200 disabled:text-emerald-400 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {getStatusMessage()}
                </>
              ) : verificationComplete ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Verification Complete
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  Verify Certificate
                </>
              )}
            </button>
          </div>

          {/* Results Section */}
          {verificationComplete && (
            <div className="border-t border-emerald-100">
              {/* Result Status */}
              <div className={`p-6 ${alertCreated ? 'bg-emerald-50' : 'bg-red-50'}`}>
                <div className="flex items-start gap-3">
                  {alertCreated ? (
                    <CheckCircle className="w-6 h-6 text-emerald-600 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
                  )}
                  <div>
                    <h3 className={`font-semibold ${alertCreated ? 'text-emerald-900' : 'text-red-900'}`}>
                      {alertCreated ? 'Request Submitted Successfully' : 'Verification Failed'}
                    </h3>
                    <p className={`text-sm mt-1 ${alertCreated ? 'text-emerald-700' : 'text-red-700'}`}>
                      {alertCreated 
                        ? 'Your certificate has been submitted for review. The organization will verify and register it on the blockchain.'
                        : 'Certificate verification failed. Please check your certificate details and try again.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Extracted Fields */}
              {formattedFields && (
                <div className="p-6 border-t border-emerald-100">
                  <h4 className="text-sm font-semibold text-[#0f4030] mb-4">Extracted Information</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Certificate ID", value: formattedFields.certificateId, icon: Hash },
                      { label: "Name", value: formattedFields.name, icon: User },
                      { label: "Course", value: formattedFields.courseName, icon: FileText },
                      { label: "NQR Code", value: formattedFields.nqrCode, icon: Hash },
                      { label: "APAAR ID", value: formattedFields.apaarId, icon: User },
                      { label: "Year", value: formattedFields.year, icon: Calendar },
                    ].map(({ label, value, icon: Icon }) => (
                      <div key={label} className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-100">
                        <div className="flex items-center gap-1.5 text-xs text-teal-600 mb-1">
                          <Icon className="w-3 h-3" />
                          {label}
                        </div>
                        <p className="text-sm font-medium text-[#0f4030]">{value || "Not found"}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Detailed Results Toggle */}
              {result?.compareResult && (
                <div className="border-t border-emerald-100">
                  <button
                    onClick={() => setShowDetails(!showDetails)}
                    className="w-full p-4 flex items-center justify-between text-sm font-medium text-teal-700 hover:bg-emerald-50/50 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      View Detailed Analysis
                    </span>
                    {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  {showDetails && (
                    <div className="p-6 pt-0 space-y-6">
                      {/* Scores Overview */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[
                          { label: "Tampering Risk", value: result.compareResult.tampering_score },
                          { label: "Similarity", value: result.compareResult.similarity_score },
                          { label: "CV Analysis", value: result.compareResult.cv_tampering_score },
                          { label: "NLP Analysis", value: result.compareResult.nlp_tampering_score },
                        ].map(({ label, value }) => {
                          const level = getTamperingLevel(value || 0);
                          const displayValue = `${Math.round((value || 0) * 100)}%`;
                          return (
                            <div key={label} className={`p-3 rounded-lg border ${level.bg} ${level.border}`}>
                              <p className="text-xs text-slate-600 mb-1">{label}</p>
                              <p className={`text-lg font-bold ${level.color}`}>{displayValue}</p>
                            </div>
                          );
                        })}
                      </div>

                      {/* Field Mismatches */}
                      {result.mismatches && result.mismatches.length > 0 && (
                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className="w-4 h-4 text-amber-600" />
                            <h5 className="text-sm font-semibold text-amber-900">Mismatched Fields</h5>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {result.mismatches.map((field) => (
                              <span key={field} className="px-2 py-1 bg-amber-100 text-amber-800 text-xs rounded-full font-medium">
                                {field}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Analysis Images */}
                      {result.compareResult.analysis_images && (
                        <div>
                          <h5 className="text-sm font-semibold text-slate-900 mb-3">Visual Analysis</h5>
                          <div className="grid grid-cols-2 gap-3">
                            {result.compareResult.analysis_images.tampered_image && (
                              <div>
                                <p className="text-xs text-slate-500 mb-1.5">Detected Regions</p>
                                <img
                                  src={result.compareResult.analysis_images.tampered_image}
                                  alt="Tampered regions"
                                  className="w-full rounded-lg border border-slate-200"
                                />
                              </div>
                            )}
                            {result.compareResult.analysis_images.heatmap_image && (
                              <div>
                                <p className="text-xs text-slate-500 mb-1.5">Difference Heatmap</p>
                                <img
                                  src={result.compareResult.analysis_images.heatmap_image}
                                  alt="Difference heatmap"
                                  className="w-full rounded-lg border border-slate-200"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Technical Details */}
                      <div className="p-4 bg-slate-50 rounded-lg">
                        <h5 className="text-sm font-semibold text-slate-900 mb-3">Technical Details</h5>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                          <div>
                            <span className="text-slate-500">Match Points</span>
                            <p className="font-medium text-slate-900">{result.compareResult.match_count || 0}</p>
                          </div>
                          <div>
                            <span className="text-slate-500">Alignment</span>
                            <p className="font-medium text-slate-900">{result.compareResult.aligned ? "Success" : "Failed"}</p>
                          </div>
                          <div>
                            <span className="text-slate-500">Suspicious Regions</span>
                            <p className="font-medium text-slate-900">{result.compareResult.num_boxes || 0}</p>
                          </div>
                          <div>
                            <span className="text-slate-500">NLP Available</span>
                            <p className="font-medium text-slate-900">{result.compareResult.nlp_analysis?.nlp_available ? "Yes" : "No"}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CertificateVerification;