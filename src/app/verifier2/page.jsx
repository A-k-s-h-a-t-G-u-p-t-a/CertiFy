"use client";

import { useState } from "react";
import { ThirdwebProvider, useActiveAccount } from "thirdweb/react";
import { createThirdwebClient, getContract, defineChain, readContract } from "thirdweb";
import { Upload, CheckCircle, XCircle, AlertCircle, Loader2, FileText, Shield } from "lucide-react";
import { computeFileHash, getZeroDataHash } from "@/utils/phash";

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
  const [selectedFile, setSelectedFile] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [fileHash, setFileHash] = useState("");

  // Get contract instance
  const contract = getContract({
    client,
    chain: defineChain(CHAIN_ID),
    address: VERIFIER_CONTRACT_ADDRESS,
  });

  // Handle file upload
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setVerificationResult(null);
      
      // Compute SHA-256 hash of the file
      try {
        const hash = await computeFileHash(file);
        setFileHash(hash);
        console.log("File SHA-256 hash:", hash);
      } catch (error) {
        console.error("Error computing file hash:", error);
      }
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

    try {
      // Call the verify function on the VerifierContract using readContract
      // function verify(address certContract, string calldata certID, bytes32 recomputedFilePhash, bytes32 recomputedDataHash) 
      // returns (VerificationResult memory result)
      // Use SHA-256 file hash as filePhash, dataHash set to 0x00...
      const zeroHash = getZeroDataHash();
      
      const result = await readContract({
        contract: contract,
        method: "function verify(address certContract, string certID, bytes32 recomputedFilePhash, bytes32 recomputedDataHash) view returns (uint8 code, string message, address certContract, bytes32 storedFilePhash, bytes32 storedDataHash, bytes32 recomputedFilePhash, bytes32 recomputedDataHash, bool adminDecryptedMatches)",
        params: [
          certContractAddress.trim(),
          certificateId.trim(),
          fileHash, // SHA-256 hash of the file used as filePhash
          zeroHash, // dataHash set to 0x00... as requested
        ],
      });

      // Parse the result - readContract returns the decoded struct values
      const [code, message, returnedCertContract, storedFilePhash, storedDataHash, recomputedFilePhash, recomputedDataHash, adminMatch] = result;

      setVerificationResult({
        code: Number(code),
        message,
        adminMatch,
        storedFilePhash,
        storedDataHash,
        recomputedFilePhash,
        recomputedDataHash,
        certContract: returnedCertContract,
        timestamp: new Date().toISOString(),
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
    <div className="min-h-screen bg-gradient-to-br from-[#f8f6f1] via-[#e8f5e8] to-[#d4f4dd] p-4 py-12">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-96 h-96 bg-gradient-to-br from-[#a7d7b8]/20 to-[#66b2a0]/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-1/2 -right-1/2 w-96 h-96 bg-gradient-to-br from-[#4e796b]/20 to-[#a7d7b8]/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-[#4e796b] to-[#66b2a0] rounded-2xl flex items-center justify-center shadow-lg">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-[#4e796b] to-[#2d5a47] bg-clip-text text-transparent mb-2">
            Certificate Verifier
          </h1>
          <p className="text-[#4e796b] text-sm">
            Verify the authenticity of certificates on the blockchain
          </p>
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-sm rounded-full border border-[#a7d7b8]/40">
            <div className={`w-2 h-2 rounded-full ${account ? 'bg-green-500' : 'bg-gray-400'}`}></div>
            <span className="text-xs text-[#4e796b] font-medium">
              {account ? `Connected: ${account.address.slice(0, 6)}...${account.address.slice(-4)}` : 'Wallet not connected'}
            </span>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl border border-[#a7d7b8]/20 overflow-hidden">
          <div className="p-8">
            {/* Certificate ID Input */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-[#4e796b] mb-2">
                Certificate Contract Address
              </label>
              <input
                type="text"
                value={certContractAddress}
                onChange={(e) => setCertContractAddress(e.target.value)}
                placeholder="Enter certificate contract address (0x...)"
                className="w-full px-4 py-3 rounded-xl border-2 border-[#a7d7b8] focus:border-[#66b2a0] focus:outline-none transition-colors bg-white/50 backdrop-blur-sm"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-[#4e796b] mb-2">
                Certificate ID
              </label>
              <input
                type="text"
                value={certificateId}
                onChange={(e) => setCertificateId(e.target.value)}
                placeholder="Enter certificate ID"
                className="w-full px-4 py-3 rounded-xl border-2 border-[#a7d7b8] focus:border-[#66b2a0] focus:outline-none transition-colors bg-white/50 backdrop-blur-sm"
              />
            </div>

            {/* File Upload */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-[#4e796b] mb-2">
                Certificate File
              </label>
              <div className="relative">
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept="image/*,.pdf"
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="flex items-center justify-center w-full px-4 py-8 border-2 border-dashed border-[#a7d7b8] rounded-xl cursor-pointer hover:border-[#66b2a0] hover:bg-[#f8f6f1]/50 transition-all bg-white/50 backdrop-blur-sm"
                >
                  <div className="text-center">
                    <Upload className="w-10 h-10 mx-auto mb-2 text-[#66b2a0]" />
                    <p className="text-sm text-[#4e796b] font-medium">
                      {selectedFile ? selectedFile.name : "Click to upload certificate"}
                    </p>
                    <p className="text-xs text-[#4e796b]/60 mt-1">
                      PDF, PNG, JPG up to 10MB
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Hash Display (for debugging) */}
            {selectedFile && (
              <div className="mb-6 p-4 bg-[#f8f6f1]/50 rounded-xl border border-[#a7d7b8]/30">
                <p className="text-xs text-[#4e796b]/70 mb-2">
                  <strong>File SHA-256 Hash:</strong> {fileHash}
                </p>
                <p className="text-xs text-[#4e796b]/70">
                  <strong>Data Hash:</strong> 0x0000...0000 (placeholder)
                </p>
              </div>
            )}

            {/* Verify Button */}
            <button
              onClick={handleVerify}
              disabled={isVerifying || !certificateId || !selectedFile || !certContractAddress}
              className="w-full py-4 bg-gradient-to-r from-[#4e796b] to-[#66b2a0] text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Verify Certificate
                </>
              )}
            </button>
          </div>

          {/* Verification Result */}
          {verificationResult && (
            <div className="border-t border-[#a7d7b8]/20 p-8 bg-gradient-to-b from-white/50 to-[#f8f6f1]/30">
              {verificationResult.error ? (
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                    <XCircle className="w-10 h-10 text-red-600" />
                  </div>
                  <h3 className="text-xl font-bold text-red-600 mb-2">Verification Failed</h3>
                  <p className="text-sm text-[#4e796b]/70">{verificationResult.message}</p>
                </div>
              ) : (
                <>
                  {(() => {
                    const status = getStatusDisplay(verificationResult.code);
                    return (
                      <div className={`${status.bgColor} ${status.borderColor} border-2 rounded-2xl p-6`}>
                        <div className="text-center mb-6">
                          <div className={`${status.color} mb-3 flex justify-center`}>
                            {status.icon}
                          </div>
                          <h3 className={`text-2xl font-bold ${status.color} mb-2`}>
                            {status.title}
                          </h3>
                          <p className="text-[#4e796b] font-medium">{verificationResult.message}</p>
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                          <div className="bg-white/60 p-4 rounded-xl">
                            <p className="text-xs font-semibold text-[#4e796b]/70 mb-1">
                              Verification Code
                            </p>
                            <p className={`text-lg font-bold ${status.color}`}>
                              Code {verificationResult.code}
                            </p>
                          </div>

                          <div className="bg-white/60 p-4 rounded-xl">
                            <p className="text-xs font-semibold text-[#4e796b]/70 mb-1">
                              Admin Verification
                            </p>
                            <p className={`text-lg font-bold ${verificationResult.adminMatch ? 'text-green-600' : 'text-gray-600'}`}>
                              {verificationResult.adminMatch ? "Matched ✓" : "Not Matched"}
                            </p>
                          </div>

                          <div className="bg-white/60 p-4 rounded-xl col-span-full">
                            <p className="text-xs font-semibold text-[#4e796b]/70 mb-2">
                              Stored File Hash (SHA-256)
                            </p>
                            <p className="text-xs text-[#4e796b] font-mono break-all">
                              {verificationResult.storedFilePhash}
                            </p>
                          </div>

                          <div className="bg-white/60 p-4 rounded-xl col-span-full">
                            <p className="text-xs font-semibold text-[#4e796b]/70 mb-2">
                              Stored Data Hash
                            </p>
                            <p className="text-xs text-[#4e796b] font-mono break-all">
                              {verificationResult.storedDataHash}
                            </p>
                          </div>

                          <div className="bg-white/60 p-4 rounded-xl col-span-full">
                            <p className="text-xs font-semibold text-[#4e796b]/70 mb-1">
                              Verification Time
                            </p>
                            <p className="text-sm text-[#4e796b]">
                              {new Date(verificationResult.timestamp).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </>
              )}
            </div>
          )}
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-[#a7d7b8]/40 shadow-lg">
            <div className="w-12 h-12 bg-gradient-to-r from-[#4e796b] to-[#66b2a0] rounded-xl flex items-center justify-center mb-4 shadow-md">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-bold text-[#4e796b] mb-2">Verifier Contract</h3>
            <p className="text-xs text-[#4e796b]/70 font-mono break-all">
              {VERIFIER_CONTRACT_ADDRESS}
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-[#a7d7b8]/40 shadow-lg">
            <div className="w-12 h-12 bg-gradient-to-r from-[#66b2a0] to-[#a7d7b8] rounded-xl flex items-center justify-center mb-4 shadow-md">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-bold text-[#4e796b] mb-2">Network</h3>
            <p className="text-sm text-[#4e796b]/70">Sepolia Testnet</p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-[#a7d7b8]/40 shadow-lg">
            <div className="w-12 h-12 bg-gradient-to-r from-[#a7d7b8] to-[#4e796b] rounded-xl flex items-center justify-center mb-4 shadow-md">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-bold text-[#4e796b] mb-2">Verification Method</h3>
            <p className="text-sm text-[#4e796b]/70">Blockchain + pHash</p>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-8 text-center">
          <p className="text-xs text-[#4e796b]/60">
            This verifier uses blockchain technology to ensure certificate authenticity
          </p>
        </div>
      </div>
    </div>
  );
}
