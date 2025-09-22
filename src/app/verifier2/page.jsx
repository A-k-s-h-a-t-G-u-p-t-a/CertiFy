"use client";
import { useState, useEffect } from "react";
import { useActiveAccount, useReadContract } from "thirdweb/react";
import { getContract } from "thirdweb";
import { defineChain } from "thirdweb/chains";
import { client } from "../../lib/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, CheckCircle, XCircle, AlertTriangle, Search, FileText, Hash, Building2, Loader2, Upload, Image } from "lucide-react";

export default function Verifier2() {
  // Wallet to contract mapping
  const WALLET_CONTRACT_MAPPING = {
    "IIT": "0x1627fb0cc3e87E22648C05Db23c4638B0B881e3E",
    "NIT - Trichy": "0xE13FB895ce3Bc12b61Ff725a32b44585DD0ACc2e", 
    "PEC": "0xD2722d58332c42f27d1242D5Bb8D19e9DBFDB4eD"
  };

  // Hash computation functions
  const computeFilePhash = async (file) => {
    try {
      // For now, we'll use a simulated pHash computation
      // In a real implementation, you'd use a proper pHash library
      const fileBuffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', fileBuffer);
      const hashArray = new Uint8Array(hashBuffer);
      const hashHex = Array.from(hashArray)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      return '0x' + hashHex;
    } catch (error) {
      console.error('Error computing file pHash:', error);
      throw error;
    }
  };

  const computeDataHash = (extractedData) => {
    try {
      // Create SHA-256 hash of the extracted data
      const dataString = JSON.stringify(extractedData, null, 0);
      const encoder = new TextEncoder();
      const data = encoder.encode(dataString);
      
      return crypto.subtle.digest('SHA-256', data).then(hashBuffer => {
        const hashArray = new Uint8Array(hashBuffer);
        const hashHex = Array.from(hashArray)
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');
        return '0x' + hashHex;
      });
    } catch (error) {
      console.error('Error computing data hash:', error);
      throw error;
    }
  };

  // Get active account
  const account = useActiveAccount();

  // State for verification form
  const [verificationData, setVerificationData] = useState({
    selectedOrg: "",
    certContract: "",
    certID: "",
    selectedFile: null,
    extractedFields: null,
    recomputedFilePhash: "",
    recomputedDataHash: ""
  });
  
  const [isVerifying, setIsVerifying] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [shouldVerify, setShouldVerify] = useState(false);

  // Get contract dynamically based on selected organization
  const getSelectedContract = () => {
    if (!verificationData.certContract) return null;
    
    try {
      return getContract({
        client,
        chain: defineChain(11155111), // Sepolia testnet
        address: verificationData.certContract
      });
    } catch (error) {
      console.error("Invalid contract address:", error);
      return null;
    }
  };

  const selectedContract = getSelectedContract();

  // Auto-set contract address when organization is selected
  useEffect(() => {
    if (verificationData.selectedOrg && WALLET_CONTRACT_MAPPING[verificationData.selectedOrg]) {
      setVerificationData(prev => ({
        ...prev,
        certContract: WALLET_CONTRACT_MAPPING[verificationData.selectedOrg]
      }));
    }
  }, [verificationData.selectedOrg]);

  // Get user's organization based on wallet address
  const getUserOrganization = () => {
    if (!account?.address) return null;
    
    const walletToOrgMapping = {
      "0x7e14929d682236d3Cb02B6E2aCC779ca9b255E78": "IIT",
      "0x5b2E5aB341743706cFae342A05df91E018838F59": "NIT - Trichy", 
      "0x8e6a18B80bDbdF6422dA06BA04daCe8D832Fea98": "PEC"
    };
    
    return walletToOrgMapping[account.address] || null;
  };

  const userOrganization = getUserOrganization();

  // Initialize form with user's organization if available
  useEffect(() => {
    if (userOrganization && !verificationData.selectedOrg) {
      setVerificationData(prev => ({
        ...prev,
        selectedOrg: userOrganization,
        certContract: WALLET_CONTRACT_MAPPING[userOrganization]
      }));
    }
  }, [userOrganization, verificationData.selectedOrg]);

  // Create a dummy contract for the hook when no contract is selected
  const dummyContract = getContract({
    client,
    chain: defineChain(11155111),
    address: "0x0000000000000000000000000000000000000000" // Zero address as fallback
  });

  // Verification contract call - only when contract is available
  const { data: verificationResult, isPending: verificationPending, refetch: refetchVerification } = useReadContract({
    contract: selectedContract || dummyContract,
    method: "function verifyCertificateView(string certID, bytes32 recomputedFilePhash, bytes32 recomputedDataHash) view returns (uint8 code, string message, bool adminMatch, bytes32 storedFilePhash, bytes32 storedDataHash)",
    params: [
      verificationData.certID || "",
      verificationData.recomputedFilePhash || "0x0000000000000000000000000000000000000000000000000000000000000000",
      verificationData.recomputedDataHash || "0x0000000000000000000000000000000000000000000000000000000000000000"
    ],
    enabled: shouldVerify && selectedContract !== null && verificationData.certID.length > 0 // Only run when we have valid contract and data
  });

  // Console log the blockchain output whenever verificationResult changes
  useEffect(() => {
    if (verificationResult) {
      console.log("🔗 BLOCKCHAIN CONTRACT OUTPUT:");
      console.log("Raw result:", verificationResult);
      console.log("Is Array:", Array.isArray(verificationResult));
      
      if (Array.isArray(verificationResult)) {
        console.log("Array contents:");
        console.log("  [0] Code:", verificationResult[0]);
        console.log("  [1] Message:", verificationResult[1]);
        console.log("  [2] Admin Match:", verificationResult[2]);
        console.log("  [3] Stored File pHash:", verificationResult[3]);
        console.log("  [4] Stored Data Hash:", verificationResult[4]);
      } else {
        console.log("Object contents:", verificationResult);
      }
    }
  }, [verificationResult]);

  // Handle file selection and OCR processing
  const handleFileSelection = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      alert('Please select a valid image file (JPG, PNG) or PDF');
      return;
    }

    setVerificationData(prev => ({
      ...prev,
      selectedFile: file,
      extractedFields: null,
      recomputedFilePhash: "",
      recomputedDataHash: ""
    }));

    setIsProcessingFile(true);

    try {
      // Convert file to base64
      const fileBuffer = await file.arrayBuffer();
      const base64Data = btoa(
        new Uint8Array(fileBuffer).reduce(
          (data, byte) => data + String.fromCharCode(byte),
          ""
        )
      );

      // Send file to OCR backend
      const res = await fetch("http://localhost:5001/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          b64: base64Data,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "OCR extraction failed");

      // Extract fields from OCR response
      const fields = data?.results?.[0]?.fields || {};
      
      // Compute file pHash (simulated for now)
      console.log("Computing file pHash...");
      const filePhash = await computeFilePhash(file);
      
      // Compute data hash from extracted fields
      console.log("Computing data hash...");
      const dataHash = await computeDataHash(fields);
      
      setVerificationData(prev => ({
        ...prev,
        extractedFields: fields,
        recomputedFilePhash: filePhash,
        recomputedDataHash: dataHash,
        // Auto-populate cert ID if available in extracted data
        certID: fields.certificateId || fields.id || fields.certificate_id || prev.certID
      }));

    } catch (error) {
      console.error("File processing error:", error);
      alert(`Failed to process file: ${error.message}`);
    } finally {
      setIsProcessingFile(false);
    }
  };

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setVerificationData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle organization selection
  const handleOrgSelection = (value) => {
    setVerificationData(prev => ({
      ...prev,
      selectedOrg: value,
      certContract: WALLET_CONTRACT_MAPPING[value] || ""
    }));
  };

  // Handle form submission
  const handleVerify = async (e) => {
    e.preventDefault();
    if (!verificationData.selectedOrg || !verificationData.certContract || 
        !verificationData.certID || !verificationData.selectedFile) {
      alert("Please fill in all required fields and select a certificate file");
      return;
    }

    if (!selectedContract) {
      alert("Invalid contract address. Please select a valid organization.");
      return;
    }

    // Check if hashes are computed
    if (!verificationData.recomputedFilePhash || !verificationData.recomputedDataHash) {
      alert("Hashes are still being computed. Please wait for file processing to complete.");
      return;
    }

    setIsVerifying(true);
    setShouldVerify(true);
    
    try {
      console.log("🚀 STARTING VERIFICATION:");
      console.log("Verification parameters being sent to contract:");
      console.log("  Contract Address:", verificationData.certContract);
      console.log("  Certificate ID:", verificationData.certID);
      console.log("  File pHash:", verificationData.recomputedFilePhash);
      console.log("  Data Hash:", verificationData.recomputedDataHash);
      
      console.log("Verifying with hashes:", {
        filePhash: verificationData.recomputedFilePhash,
        dataHash: verificationData.recomputedDataHash,
        certID: verificationData.certID
      });
      
      // Trigger the contract call
      await refetchVerification();
    } catch (error) {
      console.error("Verification error:", error);
      alert("Failed to verify certificate. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  // Reset verification
  const handleReset = () => {
    setVerificationData({
      selectedOrg: userOrganization || "",
      certContract: userOrganization ? WALLET_CONTRACT_MAPPING[userOrganization] : "",
      certID: "",
      selectedFile: null,
      extractedFields: null,
      recomputedFilePhash: "",
      recomputedDataHash: ""
    });
    setShouldVerify(false);
    // Reset file input
    const fileInput = document.getElementById('certificateFile');
    if (fileInput) fileInput.value = '';
  };

//   const verificationStatus = getVerificationStatus();

  return (
    <div className="container mx-auto p-6 pt-16 space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-8 rounded-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white rounded-lg shadow-md">
              <Shield className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Certificate Verifier</h1>
              <p className="text-gray-600">Verify certificates using factory contract verification</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {userOrganization && (
              <Badge variant="outline" className="px-4 py-2 text-sm">
                <Building2 className="h-4 w-4 mr-2" />
                Your Org: {userOrganization}
              </Badge>
            )}
            {account?.address && (
              <Badge variant="secondary" className="px-4 py-2 text-sm">
                <Shield className="h-4 w-4 mr-2" />
                {account.address.slice(0, 6)}...{account.address.slice(-4)}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Verification Form */}
      <Card className="border-2 border-dashed border-blue-200 bg-blue-50/30">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2 text-blue-700">
            <Search className="h-5 w-5" />
            Certificate Verification
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleVerify} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="selectedOrg">Select Organization *</Label>
                <Select value={verificationData.selectedOrg} onValueChange={handleOrgSelection}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose organization" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(WALLET_CONTRACT_MAPPING).map((org) => (
                      <SelectItem key={org} value={org}>
                        {org} {userOrganization === org && "(Your Org)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="certContract">Certificate Contract Address *</Label>
                <Input
                  id="certContract"
                  name="certContract"
                  value={verificationData.certContract}
                  onChange={handleInputChange}
                  placeholder="0x..."
                  readOnly
                  className="bg-gray-50"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="certID">Certificate ID *</Label>
                <Input
                  id="certID"
                  name="certID"
                  value={verificationData.certID}
                  onChange={handleInputChange}
                  placeholder="Enter certificate ID or auto-fill from file"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="certificateFile">Certificate File *</Label>
                <div className="relative">
                  <Input
                    id="certificateFile"
                    name="certificateFile"
                    type="file"
                    onChange={handleFileSelection}
                    accept=".jpg,.jpeg,.png,.pdf"
                    required
                    className="cursor-pointer"
                    disabled={isProcessingFile}
                  />
                  {isProcessingFile && (
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                      <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                    </div>
                  )}
                </div>
                {verificationData.selectedFile && (
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    {verificationData.selectedFile.name} ({(verificationData.selectedFile.size / 1024).toFixed(1)} KB)
                  </p>
                )}
              </div>
            </div>

            {/* Show extracted fields if available */}
            {verificationData.extractedFields && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-green-800">OCR Extraction Complete</p>
                    <div className="text-xs text-green-700 space-y-1">
                      <p><strong>Extracted Fields:</strong></p>
                      {Object.entries(verificationData.extractedFields).length > 0 ? (
                        <div className="ml-2 space-y-1">
                          {Object.entries(verificationData.extractedFields).map(([key, value]) => (
                            <p key={key}><span className="font-medium">{key}:</span> {String(value)}</p>
                          ))}
                        </div>
                      ) : (
                        <p className="ml-2 text-orange-600">No fields extracted - manual entry required</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Show computed hashes */}
            {(verificationData.recomputedFilePhash || verificationData.recomputedDataHash) && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <Hash className="h-5 w-5 text-purple-600 mt-0.5" />
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-purple-800">Hash Computation Complete</p>
                    <div className="text-xs text-purple-700 space-y-2">
                      {verificationData.recomputedFilePhash && (
                        <div>
                          <p><strong>File pHash (Certificate):</strong></p>
                          <p className="ml-2 font-mono break-all bg-purple-100 p-2 rounded text-xs">
                            {verificationData.recomputedFilePhash}
                          </p>
                        </div>
                      )}
                      {verificationData.recomputedDataHash && (
                        <div>
                          <p><strong>Data Hash (SHA-256):</strong></p>
                          <p className="ml-2 font-mono break-all bg-purple-100 p-2 rounded text-xs">
                            {verificationData.recomputedDataHash}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {isProcessingFile && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-blue-800">Processing Certificate File</p>
                    <p className="text-xs text-blue-700">Extracting data using OCR and computing hashes...</p>
                    <div className="text-xs text-blue-600">
                      • pHash computation for certificate file<br/>
                      • SHA-256 hash generation for extracted data
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-blue-800">Verification Requirements</p>
                  <p className="text-xs text-blue-700">
                    • Organization: Select the organization that issued the certificate<br/>
                    • Contract Address: Auto-populated based on organization selection<br/>
                    • Certificate ID: The unique identifier (auto-filled from OCR if available)<br/>
                    • Certificate File: Upload the certificate image/PDF for automatic data extraction
                  </p>
                  {userOrganization && (
                    <p className="text-xs text-blue-600 mt-2">
                      💡 Your organization ({userOrganization}) is automatically highlighted
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button 
                type="button" 
                variant="outline"
                onClick={handleReset}
                disabled={isVerifying || verificationPending}
              >
                Reset Form
              </Button>
              <Button 
                type="submit" 
                disabled={isVerifying || verificationPending || isProcessingFile || 
                         !verificationData.selectedFile || 
                         !verificationData.recomputedFilePhash || 
                         !verificationData.recomputedDataHash}
                className="px-8"
              >
                {isVerifying || verificationPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Verify Certificate
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Verification Results */}
      {shouldVerify && (verificationResult || verificationPending) && (
        <Card className="border-2 border-dashed border-blue-200 bg-blue-50/30">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2 text-blue-700">
              <Shield className="h-5 w-5" />
              Verification Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            {verificationPending ? (
              <div className="flex flex-col items-center justify-center p-12">
                <div className="relative">
                  <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
                  <div className="absolute inset-0 h-12 w-12 rounded-full border-2 border-blue-200"></div>
                </div>
                <div className="mt-6 text-center">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Verifying Certificate</h3>
                  <p className="text-gray-600">Please wait while we verify your certificate...</p>
                  <div className="flex justify-center mt-4">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                  </div>
                </div>
              </div>
            ) : verificationResult ? (
              <div className="space-y-6">
                {/* Main Message Display */}
                <div className="bg-gradient-to-r from-white to-blue-50 p-6 rounded-lg border-2 border-blue-200">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <FileText className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Verification Message</h3>
                      <p className="text-gray-700 text-base leading-relaxed">
                        {Array.isArray(verificationResult) ? verificationResult[1] || "No message provided" : verificationResult.message || "No message provided"}
                      </p>
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <span>Verification Code: {Array.isArray(verificationResult) ? verificationResult[0] : verificationResult.code}</span>
                          <span>Contract: {verificationData.certContract}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Success Indicator */}
                <div className="flex items-center justify-center">
                  <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-full">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">Verification Complete</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center p-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to Verify</h3>
                <p className="text-gray-500">Fill in the form above and click verify to see results</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
