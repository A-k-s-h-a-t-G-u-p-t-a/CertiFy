"use client";

import { useState, useEffect } from "react";
import { ThirdwebProvider, useActiveAccount } from "thirdweb/react";
import { createThirdwebClient, getContract, defineChain, readContract } from "thirdweb";
import { Upload, CheckCircle, XCircle, AlertCircle, Loader2, FileText, Shield, Building2, Hash, Clock, Eye, Lock } from "lucide-react";
import { computeFileHash, getZeroDataHash } from "@/utils/phash";
import { extractFromImageFile, verifySteganographicData } from "@/utils/steganography";
import { FileUpload } from "@/components/ui/file-upload";
import { motion, AnimatePresence } from "motion/react";

// Create Thirdweb client
const client = createThirdwebClient({
  clientId: "46d711b3df7e82f546ee080b590da647",
});

// Contract configuration
const VERIFIER_CONTRACT_ADDRESS = "0x25aF0a1fCC9188303aEcc9Df8D64a4093e3Bf6d5";
const CHAIN_ID = 11155111; // Sepolia testnet

// Main component wrapped in ThirdwebProvider
export default function Verifier2Page() {
  return (
    <ThirdwebProvider>
      <VerifierContent />
    </ThirdwebProvider>
  );
}

function VerifierContent() {
  const account = useActiveAccount();
  const [certificateId, setCertificateId] = useState("");
  const [certContractAddress, setCertContractAddress] = useState("");
  const [selectedOrg, setSelectedOrg] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [fileHash, setFileHash] = useState("");
  const [steganographyResult, setSteganographyResult] = useState(null);
  const [extractedStegData, setExtractedStegData] = useState(null);
  const [organizations, setOrganizations] = useState([]);
  const [isLoadingOrgs, setIsLoadingOrgs] = useState(true);

  // Fetch organizations from database
  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        setIsLoadingOrgs(true);
        const response = await fetch('/api/organizations/list');
        const data = await response.json();
        if (data.success && data.organizations) {
          setOrganizations(data.organizations);
        }
      } catch (error) {
        console.error('Error fetching organizations:', error);
      } finally {
        setIsLoadingOrgs(false);
      }
    };
    fetchOrganizations();
  }, []);

  // Get contract instance
  const contract = getContract({
    client,
    chain: defineChain(CHAIN_ID),
    address: VERIFIER_CONTRACT_ADDRESS,
  });

  // Handle organization selection
  const handleOrgChange = (e) => {
    const orgName = e.target.value;
    setSelectedOrg(orgName);
    const org = organizations.find(o => o.name === orgName);
    if (org) {
      setCertContractAddress(org.address);
    }
  };

  // Handle file upload from FileUpload component
  const handleFileUpload = async (files) => {
    const file = files[0];
    if (file) {
      setSelectedFile(file);
      setVerificationResult(null);
      setSteganographyResult(null);
      setExtractedStegData(null);
      
      // Convert file to base64 and compute hash
      try {
        const base64Data = await fileToBase64(file);
        const hash = await computeFileHash(base64Data);
        setFileHash(hash);
        console.log("File base64 computed");
        console.log("File pHash:", hash);
        
        // Extract steganographic data from the image
        if (file.type.startsWith('image/')) {
          console.log("Attempting to extract steganographic data...");
          const stegResult = await extractFromImageFile(file);
          setExtractedStegData(stegResult);
          console.log("Steganography extraction result:", stegResult);
        }
      } catch (error) {
        console.error("Error computing file hash:", error);
      }
    }
  };

  // Helper function to convert file to base64
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        // Get the base64 string without the data URL prefix
        const base64String = reader.result.split(',')[1];
        resolve(base64String);
      };
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  };

  // Handle OCR extraction for certificate ID
  const handleOCRExtraction = async () => {
    if (!selectedFile) {
      alert("Please upload a certificate file first");
      return;
    }

    setIsExtractingOCR(true);
    setOcrError("");

    try {
      // Convert file to base64
      const base64Data = await fileToBase64(selectedFile);
      
      // Call Python OCR API
      const response = await fetch('http://localhost:5001/extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename: selectedFile.name,
          b64: base64Data,
        }),
      });

      if (!response.ok) {
        throw new Error('OCR extraction failed');
      }

      const data = await response.json();
      console.log('OCR Response:', data);

      // Extract certificateId from the first page/result
      if (data.results && data.results.length > 0) {
        const fields = data.results[0].fields;
        if (fields && fields.certificateId) {
          setCertificateId(fields.certificateId);
          setOcrError("");
        } else {
          setOcrError("Certificate ID not found in document");
        }
      } else {
        setOcrError("No data extracted from document");
      }
    } catch (error) {
      console.error('OCR extraction error:', error);
      setOcrError(error.message || "Failed to extract certificate ID");
    } finally {
      setIsExtractingOCR(false);
    }
  };

  // Handle verification
  const handleVerify = async () => {
    if (!certContractAddress.trim()) {
      alert("Please enter a certificate contract address");
      return;
    }

    if (!certificateId.trim()) {
      alert("Please enter a certificate ID");
      return;
    }

    if (!selectedFile) {
      alert("Please upload a certificate file");
      return;
    }

    setIsVerifying(true);
    setVerificationResult(null);
    setSteganographyResult(null);

    try {
      // Compute data hash from extracted steganographic data
      let recomputedDataHash = getZeroDataHash(); // Default to zero hash
      
      // If steganographic data was extracted, compute its hash
      if (extractedStegData && extractedStegData.success && extractedStegData.encryptedData) {
        const { computeDataHash } = await import("@/utils/steganography");
        recomputedDataHash = await computeDataHash(extractedStegData.encryptedData);
        console.log("Recomputed data hash from extracted steganography:", recomputedDataHash);
      }

      // Call the verify function on the VerifierContract using readContract
      // The contract returns a struct VerificationResult
      const result = await readContract({
        contract: contract,
        method: "function verify(address certContract, string certID, bytes32 recomputedFilePhash, bytes32 recomputedDataHash) view returns ((uint8 code, string message, address certContract, bytes32 storedFilePhash, bytes32 storedDataHash, bytes32 recomputedFilePhash, bytes32 recomputedDataHash, bool adminDecryptedMatches))",
        params: [
          certContractAddress.trim(),
          certificateId.trim(),
          fileHash, // SHA-256 hash of the file
          recomputedDataHash, // Hash computed from extracted steganographic data
        ],
      });

      // Perform steganography verification for display
      let stegVerification = null;
      if (extractedStegData && extractedStegData.success) {
        stegVerification = await verifySteganographicData(
          extractedStegData.encryptedData,
          result.storedDataHash
        );
        console.log("Steganography verification result:", stegVerification);
        setSteganographyResult(stegVerification);
      } else {
        // No steganographic data extracted
        console.log("No steganographic data extracted");
        stegVerification = {
          matches: false,
          extractedHash: null,
          storedHash: result.storedDataHash,
          details: extractedStegData?.error || "No steganographic data could be extracted from this certificate"
        };
        setSteganographyResult(stegVerification);
      }

      console.log("Final stegVerification.matches:", stegVerification?.matches);
      console.log("Setting adminMatch to:", stegVerification?.matches || false);

      // Parse the result - result is an object representing the struct
      setVerificationResult({
        code: Number(result.code),
        message: result.message,
        adminMatch: stegVerification?.matches || false, // Use steganography match status
        storedFilePhash: result.storedFilePhash,
        storedDataHash: result.storedDataHash,
        recomputedFilePhash: result.recomputedFilePhash,
        recomputedDataHash: result.recomputedDataHash,
        certContract: result.certContract,
        timestamp: new Date().toISOString(),
        steganographyVerified: stegVerification?.matches || false,
      });
    } catch (error) {
      console.error("Verification error:", error);
      setVerificationResult({
        code: 0,
        message: error.message || "Verification failed. Please check if the certificate exists and the contract address is correct.",
        adminMatch: false,
        error: true,
      });
    } finally {
      setIsVerifying(false);
    }
  };

  // Get status icon and color based on verification code
  const getStatusDisplay = (code) => {
    switch (code) {
      case 1:
        return {
          icon: <CheckCircle className="w-12 h-12" />,
          color: "text-green-600",
          bgColor: "bg-green-50",
          borderColor: "border-green-200",
          title: "Verified ✓",
        };
      case 2:
        return {
          icon: <AlertCircle className="w-12 h-12" />,
          color: "text-yellow-600",
          bgColor: "bg-yellow-50",
          borderColor: "border-yellow-200",
          title: "Partial Match ⚠",
        };
      case 3:
        return {
          icon: <AlertCircle className="w-12 h-12" />,
          color: "text-blue-600",
          bgColor: "bg-blue-50",
          borderColor: "border-blue-200",
          title: "Data Match ℹ",
        };
      case 4:
        return {
          icon: <XCircle className="w-12 h-12" />,
          color: "text-red-600",
          bgColor: "bg-red-50",
          borderColor: "border-red-200",
          title: "Invalid ✗",
        };
      case 5:
        return {
          icon: <AlertCircle className="w-12 h-12" />,
          color: "text-orange-600",
          bgColor: "bg-orange-50",
          borderColor: "border-orange-200",
          title: "Flagged 🚩",
        };
      case 6:
        return {
          icon: <XCircle className="w-12 h-12" />,
          color: "text-gray-600",
          bgColor: "bg-gray-50",
          borderColor: "border-gray-200",
          title: "Revoked 🚫",
        };
      default:
        return {
          icon: <XCircle className="w-12 h-12" />,
          color: "text-red-600",
          bgColor: "bg-red-50",
          borderColor: "border-red-200",
          title: "Error ✗",
        };
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8f6f1] via-[#e8f5e8] to-[#d4f4dd] py-12 px-4 sm:px-6 lg:px-8">
      {/* Animated Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.2, 0.3]
          }}
          transition={{ 
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute -top-1/2 -left-1/2 w-96 h-96 bg-gradient-to-br from-[#a7d7b8]/20 to-[#66b2a0]/20 rounded-full blur-3xl"
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.3, 0.2]
          }}
          transition={{ 
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
          className="absolute -bottom-1/2 -right-1/2 w-96 h-96 bg-gradient-to-br from-[#4e796b]/20 to-[#a7d7b8]/20 rounded-full blur-3xl"
        />
      </div>

      <div className="relative max-w-5xl mx-auto">
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <motion.div 
            whileHover={{ scale: 1.05, rotate: 5 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-[#4e796b] to-[#66b2a0] rounded-3xl flex items-center justify-center shadow-2xl"
          >
            <Shield className="w-10 h-10 text-white" />
          </motion.div>
          <h1 className="text-5xl font-extrabold bg-gradient-to-r from-[#2d5a47] via-[#4e796b] to-[#66b2a0] bg-clip-text text-transparent mb-4">
            Verifier / Employer
          </h1>
          <p className="text-[#4e796b] text-lg max-w-2xl mx-auto mb-6">
            Verify the authenticity of certificates on the blockchain with advanced cryptographic validation
          </p>
        </motion.div>

        {/* Main Verification Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-[#a7d7b8]/30 overflow-hidden"
        >
          <div className="p-8 lg:p-12">
            {/* Step-by-step Form */}
            <div className="space-y-8">
              {/* Step 1: Organization Selection */}
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-3"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-full bg-[#4e796b] text-white flex items-center justify-center text-sm font-bold">1</div>
                  <label className="text-base font-bold text-[#2d5a47]">
                    Select Organization
                  </label>
                </div>
                <div className="relative group">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#4e796b]/50 group-hover:text-[#4e796b] transition-colors" />
                  <select
                    value={selectedOrg}
                    onChange={handleOrgChange}
                    disabled={isLoadingOrgs}
                    className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-[#a7d7b8]/50 focus:border-[#4e796b] focus:ring-4 focus:ring-[#4e796b]/10 outline-none transition-all bg-white/70 text-[#2d5a47] font-medium hover:bg-white hover:shadow-md appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-wait"
                  >
                    <option value="">
                      {isLoadingOrgs ? "Loading organizations..." : "Select an organization (Optional)"}
                    </option>
                    {organizations.map((org) => (
                      <option key={org.id || org.name} value={org.name}>
                        {org.name}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    {isLoadingOrgs ? (
                      <Loader2 className="w-5 h-5 text-[#4e796b] animate-spin" />
                    ) : (
                      <svg className="w-5 h-5 text-[#4e796b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    )}
                  </div>
                </div>
                <p className="text-xs text-[#4e796b]/60 ml-11">
                  {isLoadingOrgs 
                    ? "Fetching organizations from database..." 
                    : `${organizations.length} organization${organizations.length !== 1 ? 's' : ''} available - or enter the contract address manually below`
                  }
                </p>
              </motion.div>

              {/* Step 2: Contract Address */}
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="space-y-3"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-full bg-[#4e796b] text-white flex items-center justify-center text-sm font-bold">2</div>
                  <label className="text-base font-bold text-[#2d5a47]">
                    Certificate Contract Address
                  </label>
                </div>
                <div className="relative group">
                  <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#4e796b]/50 group-hover:text-[#4e796b] transition-colors" />
                  <input
                    type="text"
                    value={certContractAddress}
                    onChange={(e) => setCertContractAddress(e.target.value)}
                    placeholder="0x..."
                    className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-[#a7d7b8]/50 focus:border-[#4e796b] focus:ring-4 focus:ring-[#4e796b]/10 outline-none transition-all bg-white/70 text-[#2d5a47] font-mono hover:bg-white hover:shadow-md"
                  />
                </div>
                <p className="text-xs text-[#4e796b]/60 ml-11">The blockchain address where the certificate is registered</p>
              </motion.div>

              {/* Step 3: Certificate ID */}
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="space-y-3"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-full bg-[#4e796b] text-white flex items-center justify-center text-sm font-bold">3</div>
                  <label className="text-base font-bold text-[#2d5a47]">
                    Certificate ID
                  </label>
                </div>
                <div className="relative group">
                  <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#4e796b]/50 group-hover:text-[#4e796b] transition-colors" />
                  <input
                    type="text"
                    value={certificateId}
                    onChange={(e) => setCertificateId(e.target.value)}
                    placeholder="Enter certificate ID"
                    className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-[#a7d7b8]/50 focus:border-[#4e796b] focus:ring-4 focus:ring-[#4e796b]/10 outline-none transition-all bg-white/70 text-[#2d5a47] hover:bg-white hover:shadow-md"
                  />
                </div>
                <p className="text-xs text-[#4e796b]/60 ml-11">Unique identifier for the certificate to be verified</p>
              </motion.div>

              {/* Step 4: File Upload */}
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
                className="space-y-3"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-full bg-[#4e796b] text-white flex items-center justify-center text-sm font-bold">4</div>
                  <label className="text-base font-bold text-[#2d5a47]">
                    Upload Certificate File
                  </label>
                </div>
                <FileUpload onChange={handleFileUpload} />
                <p className="text-xs text-[#4e796b]/60 ml-11">Upload the certificate file (PDF, PNG, JPG) to compute its cryptographic hash</p>
              </motion.div>

              {/* Hash Display */}
              <AnimatePresence>
                {selectedFile && fileHash && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-6 bg-gradient-to-br from-[#e8f5e8] to-[#d4f4dd] rounded-2xl border border-[#a7d7b8]/50 space-y-3"
                  >
                    <div className="flex items-center gap-2 text-[#2d5a47] font-semibold mb-3">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span>File Processed Successfully</span>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-[#4e796b] flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        Computed File Hash (SHA-256):
                      </p>
                      <p className="text-xs text-[#2d5a47] font-mono break-all bg-white/60 p-3 rounded-lg border border-[#a7d7b8]/30">
                        {fileHash}
                      </p>
                    </div>
                    
                    {/* Steganography Extraction Status */}
                    {selectedFile?.type?.startsWith('image/') && (
                      <div className="mt-4 pt-4 border-t border-[#a7d7b8]/30 space-y-2">
                        <p className="text-xs font-semibold text-[#4e796b] flex items-center gap-2">
                          <Eye className="w-4 h-4" />
                          <Lock className="w-4 h-4" />
                          Steganography Detection:
                        </p>
                        {extractedStegData ? (
                          extractedStegData.error ? (
                            <div className="flex items-center gap-2 text-yellow-700 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                              <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                              <span className="text-xs">No hidden data found in image</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-green-700 bg-green-50 p-3 rounded-lg border border-green-200">
                              <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></span>
                              <span className="text-xs font-medium">Hidden data detected! ({extractedStegData.encryptedData?.length || 0} characters)</span>
                            </div>
                          )
                        ) : (
                          <div className="flex items-center gap-2 text-gray-500 bg-gray-50 p-3 rounded-lg border border-gray-200">
                            <span className="w-3 h-3 rounded-full bg-gray-400"></span>
                            <span className="text-xs">Analyzing image...</span>
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Verify Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleVerify}
                disabled={isVerifying || !certificateId || !selectedFile || !certContractAddress}
                className="w-full py-5 bg-gradient-to-r from-[#4e796b] via-[#5a8a7a] to-[#66b2a0] text-white font-bold text-lg rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3 group relative overflow-hidden"
              >
                <motion.div
                  className="absolute inset-0 bg-white/20"
                  initial={{ x: "-100%" }}
                  whileHover={{ x: "100%" }}
                  transition={{ duration: 0.6 }}
                />
                {isVerifying ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span>Verifying Certificate...</span>
                  </>
                ) : (
                  <>
                    <Shield className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                    <span>Verify Certificate on Blockchain</span>
                  </>
                )}
              </motion.button>
            </div>
          </div>

          {/* Verification Result */}
          <AnimatePresence>
            {verificationResult && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="border-t-2 border-[#a7d7b8]/30 p-8"
              >
                {verificationResult.error ? (
                  <motion.div 
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    className="text-center p-8"
                  >
                    <motion.div 
                      animate={{ rotate: [0, -10, 10, -10, 0] }}
                      transition={{ duration: 0.5 }}
                      className="w-20 h-20 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center"
                    >
                      <XCircle className="w-12 h-12 text-red-600" />
                    </motion.div>
                    <h3 className="text-2xl font-bold text-red-600 mb-3">Verification Failed</h3>
                    <p className="text-[#4e796b] max-w-md mx-auto">{verificationResult.message}</p>
                  </motion.div>
                ) : (
                  <>
                    {(() => {
                      const status = getStatusDisplay(verificationResult.code);
                      return (
                        <motion.div 
                          initial={{ scale: 0.95 }}
                          animate={{ scale: 1 }}
                          className={`${status.bgColor} ${status.borderColor} border-2 rounded-3xl p-8 shadow-xl`}
                        >
                          {/* Status Header */}
                          <div className="text-center mb-8">
                            <motion.div 
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                              className={`${status.color} mb-4 flex justify-center`}
                            >
                              {status.icon}
                            </motion.div>
                            <motion.h3 
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.3 }}
                              className={`text-3xl font-bold ${status.color} mb-3`}
                            >
                              {status.title}
                            </motion.h3>
                            <motion.p 
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: 0.4 }}
                              className="text-[#4e796b] font-medium text-lg"
                            >
                              {verificationResult.message}
                            </motion.p>
                          </div>

                          {/* Details Grid */}
                          <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="grid grid-cols-1 md:grid-cols-2 gap-4"
                          >
                            {/* Verification Code */}
                            <motion.div 
                              whileHover={{ scale: 1.02 }}
                              className="bg-white/70 backdrop-blur-sm p-5 rounded-2xl border border-white/50 shadow-md"
                            >
                              <p className="text-xs font-semibold text-[#4e796b]/70 mb-2 flex items-center gap-2">
                                <Shield className="w-4 h-4" />
                                Verification Code
                              </p>
                              <p className={`text-2xl font-bold ${status.color}`}>
                                Code {verificationResult.code}
                              </p>
                            </motion.div>

                            {/* Steganography Data Match */}
                            <motion.div 
                              whileHover={{ scale: 1.02 }}
                              className="bg-white/70 backdrop-blur-sm p-5 rounded-2xl border border-white/50 shadow-md"
                            >
                              <p className="text-xs font-semibold text-[#4e796b]/70 mb-2 flex items-center gap-2">
                                <CheckCircle className="w-4 h-4" />
                                Steganography Data Match
                              </p>
                              <p className={`text-2xl font-bold ${verificationResult.adminMatch ? 'text-green-600' : 'text-gray-600'}`}>
                                {verificationResult.adminMatch ? "Matched ✓" : "Not Matched ✗"}
                              </p>
                            </motion.div>

                            {/* Contract Address */}
                            <motion.div 
                              whileHover={{ scale: 1.02 }}
                              className="bg-white/70 backdrop-blur-sm p-5 rounded-2xl border border-white/50 shadow-md col-span-full"
                            >
                              <p className="text-xs font-semibold text-[#4e796b]/70 mb-2 flex items-center gap-2">
                                <Hash className="w-4 h-4" />
                                Certificate Contract Address
                              </p>
                              <p className="text-sm text-[#2d5a47] font-mono break-all">
                                {verificationResult.certContract}
                              </p>
                            </motion.div>

                            {/* File Hash Comparison */}
                            <motion.div 
                              whileHover={{ scale: 1.02 }}
                              className="bg-white/70 backdrop-blur-sm p-5 rounded-2xl border border-white/50 shadow-md"
                            >
                              <p className="text-xs font-semibold text-[#4e796b]/70 mb-3 flex items-center gap-2">
                                📦 Stored File Hash
                              </p>
                              <p className="text-xs text-[#2d5a47] font-mono break-all bg-gray-100 p-3 rounded-lg">
                                {verificationResult.storedFilePhash}
                              </p>
                            </motion.div>

                            <motion.div 
                              whileHover={{ scale: 1.02 }}
                              className="bg-white/70 backdrop-blur-sm p-5 rounded-2xl border border-white/50 shadow-md"
                            >
                              <p className="text-xs font-semibold text-[#4e796b]/70 mb-3 flex items-center gap-2">
                                🔄 Recomputed File Hash
                              </p>
                              <p className="text-xs text-[#2d5a47] font-mono break-all bg-gray-100 p-3 rounded-lg">
                                {verificationResult.recomputedFilePhash}
                              </p>
                            </motion.div>

                            {/* Data Hash Comparison */}
                            <motion.div 
                              whileHover={{ scale: 1.02 }}
                              className="bg-white/70 backdrop-blur-sm p-5 rounded-2xl border border-white/50 shadow-md"
                            >
                              <p className="text-xs font-semibold text-[#4e796b]/70 mb-3 flex items-center gap-2">
                                📦 Stored Data Hash
                              </p>
                              <p className="text-xs text-[#2d5a47] font-mono break-all bg-gray-100 p-3 rounded-lg">
                                {verificationResult.storedDataHash}
                              </p>
                            </motion.div>

                            <motion.div 
                              whileHover={{ scale: 1.02 }}
                              className="bg-white/70 backdrop-blur-sm p-5 rounded-2xl border border-white/50 shadow-md"
                            >
                              <p className="text-xs font-semibold text-[#4e796b]/70 mb-3 flex items-center gap-2">
                                🔄 Recomputed Data Hash
                              </p>
                              <p className="text-xs text-[#2d5a47] font-mono break-all bg-gray-100 p-3 rounded-lg">
                                {verificationResult.recomputedDataHash}
                              </p>
                            </motion.div>

                            {/* Hash Match Summary */}
                            <motion.div 
                              whileHover={{ scale: 1.02 }}
                              className="bg-white/70 backdrop-blur-sm p-5 rounded-2xl border border-white/50 shadow-md col-span-full"
                            >
                              <p className="text-xs font-semibold text-[#4e796b]/70 mb-4 flex items-center gap-2">
                                <CheckCircle className="w-4 h-4" />
                                Hash Comparison Summary
                              </p>
                              <div className="flex flex-wrap gap-6">
                                <div className="flex items-center gap-3">
                                  <motion.span 
                                    animate={{ scale: [1, 1.2, 1] }}
                                    transition={{ duration: 1, repeat: Infinity }}
                                    className={`w-4 h-4 rounded-full ${verificationResult.storedFilePhash === verificationResult.recomputedFilePhash ? 'bg-green-500' : 'bg-red-500'}`}
                                  />
                                  <span className="text-sm text-[#2d5a47] font-semibold">
                                    File Hash: {verificationResult.storedFilePhash === verificationResult.recomputedFilePhash ? 'Match ✓' : 'Mismatch ✗'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <motion.span 
                                    animate={{ scale: [1, 1.2, 1] }}
                                    transition={{ duration: 1, repeat: Infinity, delay: 0.5 }}
                                    className={`w-4 h-4 rounded-full ${verificationResult.storedDataHash === verificationResult.recomputedDataHash ? 'bg-green-500' : 'bg-red-500'}`}
                                  />
                                  <span className="text-sm text-[#2d5a47] font-semibold">
                                    Data Hash: {verificationResult.storedDataHash === verificationResult.recomputedDataHash ? 'Match ✓' : 'Mismatch ✗'}
                                  </span>
                                </div>
                              </div>
                            </motion.div>

                            {/* Steganography Verification */}
                            <motion.div 
                              whileHover={{ scale: 1.02 }}
                              className={`backdrop-blur-sm p-5 rounded-2xl border shadow-md col-span-full ${
                                steganographyResult?.isValid 
                                  ? 'bg-green-50/80 border-green-200' 
                                  : steganographyResult?.error 
                                    ? 'bg-yellow-50/80 border-yellow-200'
                                    : 'bg-red-50/80 border-red-200'
                              }`}
                            >
                              <p className="text-xs font-semibold text-[#4e796b]/70 mb-4 flex items-center gap-2">
                                <Eye className="w-4 h-4" />
                                <Lock className="w-4 h-4" />
                                Steganography Verification
                              </p>
                              
                              {steganographyResult ? (
                                <div className="space-y-4">
                                  {/* Status Banner */}
                                  <div className={`flex items-center gap-3 p-3 rounded-xl ${
                                    steganographyResult.matches 
                                      ? 'bg-green-100 text-green-800' 
                                      : !steganographyResult.extractedHash 
                                        ? 'bg-yellow-100 text-yellow-800'
                                        : 'bg-red-100 text-red-800'
                                  }`}>
                                    <motion.span 
                                      animate={{ scale: [1, 1.2, 1] }}
                                      transition={{ duration: 1, repeat: Infinity }}
                                      className={`w-4 h-4 rounded-full ${
                                        steganographyResult.matches 
                                          ? 'bg-green-500' 
                                          : !steganographyResult.extractedHash 
                                            ? 'bg-yellow-500'
                                            : 'bg-red-500'
                                      }`}
                                    />
                                    <span className="text-sm font-bold">
                                      {steganographyResult.matches 
                                        ? '✓ Hidden Data Verified - Authentic Certificate' 
                                        : !steganographyResult.extractedHash 
                                          ? '⚠ Could Not Extract Hidden Data'
                                          : '✗ Hidden Data Mismatch - Possible Tampering'}
                                    </span>
                                  </div>

                                  {/* Hash Comparison */}
                                  {steganographyResult.extractedHash && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <div className="bg-white/60 p-3 rounded-lg border border-gray-200">
                                        <p className="text-xs font-semibold text-[#4e796b]/70 mb-2 flex items-center gap-2">
                                          🔍 Extracted Data Hash
                                        </p>
                                        <p className="text-xs text-[#2d5a47] font-mono break-all bg-gray-100 p-2 rounded">
                                          {steganographyResult.extractedHash}
                                        </p>
                                      </div>
                                      <div className="bg-white/60 p-3 rounded-lg border border-gray-200">
                                        <p className="text-xs font-semibold text-[#4e796b]/70 mb-2 flex items-center gap-2">
                                          ⛓️ Blockchain Data Hash
                                        </p>
                                        <p className="text-xs text-[#2d5a47] font-mono break-all bg-gray-100 p-2 rounded">
                                          {steganographyResult.storedHash}
                                        </p>
                                      </div>
                                    </div>
                                  )}

                                  {/* Details */}
                                  <div className="text-xs text-[#4e796b]/80 bg-white/40 p-3 rounded-lg">
                                    <p className="font-semibold mb-1">Details:</p>
                                    <p>{steganographyResult.details}</p>
                                  </div>

                                  {/* Extracted Data Preview (if available) */}
                                  {extractedStegData?.encryptedData && (
                                    <details className="bg-white/40 p-3 rounded-lg">
                                      <summary className="text-xs font-semibold text-[#4e796b]/70 cursor-pointer hover:text-[#4e796b]">
                                        ▶ View Extracted Hidden Data (Encrypted)
                                      </summary>
                                      <p className="text-xs text-[#2d5a47] font-mono break-all bg-gray-100 p-2 rounded mt-2 max-h-32 overflow-auto">
                                        {extractedStegData.encryptedData.length > 500 
                                          ? extractedStegData.encryptedData.substring(0, 500) + '...' 
                                          : extractedStegData.encryptedData}
                                      </p>
                                    </details>
                                  )}
                                </div>
                              ) : (
                                <div className="text-center py-4 text-[#4e796b]/60">
                                  <p className="text-sm">No steganographic data available</p>
                                  <p className="text-xs mt-1">Upload an image certificate to check for hidden data</p>
                                </div>
                              )}
                            </motion.div>

                            {/* Timestamp */}
                            <motion.div 
                              whileHover={{ scale: 1.02 }}
                              className="bg-white/70 backdrop-blur-sm p-5 rounded-2xl border border-white/50 shadow-md col-span-full"
                            >
                              <p className="text-xs font-semibold text-[#4e796b]/70 mb-2 flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                Verification Time
                              </p>
                              <p className="text-sm text-[#2d5a47] font-medium">
                                {new Date(verificationResult.timestamp).toLocaleString()}
                              </p>
                            </motion.div>
                          </motion.div>
                        </motion.div>
                      );
                    })()}
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Info Cards */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12"
        >
          <motion.div 
            whileHover={{ scale: 1.05, y: -5 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl border border-[#a7d7b8]/40 shadow-lg hover:shadow-2xl transition-shadow"
          >
            <div className="w-14 h-14 bg-gradient-to-br from-[#4e796b] to-[#66b2a0] rounded-2xl flex items-center justify-center mb-4 shadow-lg">
              <FileText className="w-7 h-7 text-white" />
            </div>
            <h3 className="font-bold text-[#2d5a47] mb-2 text-lg">Verifier Contract</h3>
            <p className="text-xs text-[#4e796b]/80 font-mono break-all leading-relaxed">
              {VERIFIER_CONTRACT_ADDRESS}
            </p>
          </motion.div>

          <motion.div 
            whileHover={{ scale: 1.05, y: -5 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl border border-[#a7d7b8]/40 shadow-lg hover:shadow-2xl transition-shadow"
          >
            <div className="w-14 h-14 bg-gradient-to-br from-[#66b2a0] to-[#a7d7b8] rounded-2xl flex items-center justify-center mb-4 shadow-lg">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <h3 className="font-bold text-[#2d5a47] mb-2 text-lg">Network</h3>
            <p className="text-sm text-[#4e796b]/80 font-medium">Sepolia Testnet</p>
            <p className="text-xs text-[#4e796b]/60 mt-1">Chain ID: {CHAIN_ID}</p>
          </motion.div>

          <motion.div 
            whileHover={{ scale: 1.05, y: -5 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl border border-[#a7d7b8]/40 shadow-lg hover:shadow-2xl transition-shadow"
          >
            <div className="w-14 h-14 bg-gradient-to-br from-[#a7d7b8] to-[#4e796b] rounded-2xl flex items-center justify-center mb-4 shadow-lg">
              <CheckCircle className="w-7 h-7 text-white" />
            </div>
            <h3 className="font-bold text-[#2d5a47] mb-2 text-lg">Verification Method</h3>
            <p className="text-sm text-[#4e796b]/80 font-medium">Blockchain + Cryptographic Hash</p>
          </motion.div>
        </motion.div>

        {/* Footer */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="mt-12 text-center"
        >
          <p className="text-sm text-[#4e796b]/70">
            Powered by blockchain technology to ensure tamper-proof certificate authenticity
          </p>
        </motion.div>
      </div>
    </div>
  );
}
