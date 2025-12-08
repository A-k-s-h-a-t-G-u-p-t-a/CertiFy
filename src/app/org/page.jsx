"use client";
import { useState, useEffect } from "react";
import { useActiveAccount, useReadContract, useSendTransaction } from "thirdweb/react";
import { getContract, prepareContractCall } from "thirdweb";
import { defineChain } from "thirdweb/chains";
import { client } from "../../lib/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Building2, Users, Loader2, Plus, FileText, CheckCircle, XCircle, AlertCircle, Shield, Award, Hash, Flag, X, Search, BarChart3, Upload, FileUp } from "lucide-react";

export default function Org() {
  const account = useActiveAccount();
  const [orgContract, setOrgContract] = useState(null);
  const [isValidOrg, setIsValidOrg] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [orgInfo, setOrgInfo] = useState(null);

  // Check if connected wallet is a valid organization by fetching from database
  useEffect(() => {
    const fetchOrganization = async () => {
      setIsLoading(true);
      
      if (account?.address) {
        try {
          // Fetch organization from database by wallet address
          const response = await fetch(`/api/organizations?wallet=${account.address}`);
          const data = await response.json();
          
          if (data.success && data.organization) {
            const org = data.organization;
            console.log("Organization found:", org);
            
            // Check if organization is active and has a contract address
            if (org.contractAddress && org.isActive && !org.isFlagged) {
              // Create custom contract for this organization
              const customContract = getContract({
                client,
                chain: defineChain(11155111),
                address: org.contractAddress,
              });
              
              setOrgContract(customContract);
              setOrgInfo(org);
              setIsValidOrg(true);
            } else {
              console.warn("Organization exists but is not active or missing contract:", org);
              setIsValidOrg(false);
              setOrgContract(null);
              setOrgInfo(org);
            }
          } else {
            console.warn("Organization not found for wallet:", account.address);
            setIsValidOrg(false);
            setOrgContract(null);
            setOrgInfo(null);
          }
        } catch (error) {
          console.error("Error fetching organization:", error);
          setIsValidOrg(false);
          setOrgContract(null);
          setOrgInfo(null);
        }
      } else {
        setIsValidOrg(false);
        setOrgContract(null);
        setOrgInfo(null);
      }
      
      setIsLoading(false);
    };

    fetchOrganization();
  }, [account?.address]);

  if (isLoading || !account) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin mr-3" />
        <div className="text-lg text-gray-600">
          {!account ? "Waiting for wallet connection..." : "Loading organization data..."}
        </div>
      </div>
    );
  }

  if (!isValidOrg) {
    return (
      <div className="container mx-auto p-6 pt-16">
        <div className="text-center space-y-6 mt-20">
          <XCircle className="h-24 w-24 text-red-400 mx-auto" />
          <div className="space-y-4">
            <h1 className="text-3xl font-bold text-red-600">
              {orgInfo && orgInfo.isFlagged 
                ? "Organization Flagged" 
                : orgInfo && !orgInfo.isActive 
                ? "Organization Inactive" 
                : "Invalid Organization"}
            </h1>
            <p className="text-gray-600 max-w-md mx-auto">
              {orgInfo && orgInfo.isFlagged 
                ? "Your organization has been flagged by the administrator. Please contact support." 
                : orgInfo && !orgInfo.isActive 
                ? "Your organization is currently inactive. Please contact the administrator." 
                : "Your wallet address is not registered as a valid organization. Please contact the administrator."}
            </p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md mx-auto">
              <p className="text-sm text-red-700">
                <strong>Connected Address:</strong> {account.address}
              </p>
              {orgInfo && (
                <>
                  <p className="text-sm text-red-700 mt-2">
                    <strong>Organization Name:</strong> {orgInfo.name}
                  </p>
                  <p className="text-sm text-red-700 mt-2">
                    <strong>Status:</strong> {orgInfo.isFlagged ? "Flagged" : orgInfo.isActive ? "Active" : "Inactive"}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Only render the dashboard when we have a valid contract
  return <OrgDashboard orgContract={orgContract} account={account} orgInfo={orgInfo} />;
}

// Separate component that only renders when contract is ready
function OrgDashboard({ orgContract, account, orgInfo }) {
  const [certificateData, setCertificateData] = useState({
    certID: "",
    filePhash: "",
    dataHash: "",
    encryptedData: ""
  });
  const [isIssuing, setIsIssuing] = useState(false);

  // Form states for additional operations
  const [decryptedHashData, setDecryptedHashData] = useState({
    certID: "",
    decryptedHash: ""
  });
  const [flagData, setFlagData] = useState({
    certID: "",
    reason: ""
  });
  const [revokeData, setRevokeData] = useState({
    certID: "",
    reason: ""
  });
  const [isRecording, setIsRecording] = useState(false);
  const [isFlagging, setIsFlagging] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);

  // Verification form state
  const [verificationData, setVerificationData] = useState({
    certID: "",
    recomputedFilePhash: "",
    recomputedDataHash: ""
  });
  const [shouldVerify, setShouldVerify] = useState(false);

  // Get organization details - using simpler enabled pattern
  const { data: orgDetails, isPending: detailsPending } = useReadContract({
    contract: orgContract,
    method: "function getOrganizationInfo() view returns (string name, string description, uint256 totalCertificates, bool isActive)",
    params: [],
    enabled: !!orgContract,
  });

  // Get organization name
  const { data: orgName, isPending: orgNamePending } = useReadContract({
    contract: orgContract,
    method: "function organizationName() view returns (string)",
    params: [],
    enabled: !!orgContract,
  });

  // Get certificate count
  const { data: certificateCount, isPending: countPending } = useReadContract({
    contract: orgContract,
    method: "function getCertificateCount() view returns (uint256)",
    params: [],
    enabled: !!orgContract,
  });

  // Get statistics
  const { data: stats, isPending: statsPending } = useReadContract({
    contract: orgContract,
    method: "function getStats() view returns (uint256 _totalIssued, uint256 _totalFlagged, uint256 _totalRevoked)",
    params: [],
    enabled: !!orgContract,
  });

  // Certificate verification
  const { data: verificationResult, isPending: verificationPending } = useReadContract({
    contract: orgContract,
    method: "function verifyCertificateView(string certID, bytes32 recomputedFilePhash, bytes32 recomputedDataHash) view returns (uint8 code, string message, bool adminMatch, bytes32 storedFilePhash, bytes32 storedDataHash)",
    params: [verificationData.certID, verificationData.recomputedFilePhash, verificationData.recomputedDataHash],
    enabled: !!orgContract && shouldVerify && verificationData.certID && verificationData.recomputedFilePhash && verificationData.recomputedDataHash,
  });

  const { mutate: sendTransaction } = useSendTransaction();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCertificateData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDecryptedHashChange = (e) => {
    const { name, value } = e.target;
    setDecryptedHashData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFlagChange = (e) => {
    const { name, value } = e.target;
    setFlagData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRevokeChange = (e) => {
    const { name, value } = e.target;
    setRevokeData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleVerificationChange = (e) => {
    const { name, value } = e.target;
    setVerificationData(prev => ({
      ...prev,
      [name]: value
    }));
    // Reset verification trigger when data changes
    setShouldVerify(false);
  };

  const handleVerifyCertificate = (e) => {
    e.preventDefault();
    if (!verificationData.certID || !verificationData.recomputedFilePhash || !verificationData.recomputedDataHash) {
      alert("Please fill in all required fields");
      return;
    }
    setShouldVerify(true);
  };

  const handleIssueCertificate = async (e) => {
    e.preventDefault();
    if (!certificateData.certID || !certificateData.filePhash || !certificateData.dataHash || !certificateData.encryptedData) {
      alert("Please fill in all required fields");
      return;
    }

    setIsIssuing(true);
    try {
      const transaction = prepareContractCall({
        contract: orgContract,
        method: "function issueCertificate(string certID, bytes32 filePhash, bytes32 dataHash, bytes encryptedData)",
        params: [
          certificateData.certID,
          certificateData.filePhash,
          certificateData.dataHash,
          certificateData.encryptedData
        ],
      });
      
      await new Promise((resolve, reject) => {
        sendTransaction(transaction, {
          onSuccess: (result) => {
            console.log("Certificate issued successfully:", result);
            resolve(result);
          },
          onError: (error) => {
            console.error("Failed to issue certificate:", error);
            reject(error);
          }
        });
      });
      
      alert("Certificate issued successfully!");
      setCertificateData({
        certID: "",
        filePhash: "",
        dataHash: "",
        encryptedData: ""
      });
      
    } catch (error) {
      console.error("Error issuing certificate:", error);
      alert("Failed to issue certificate. Please try again.");
    } finally {
      setIsIssuing(false);
    }
  };

  const handleRecordDecryptedHash = async (e) => {
    e.preventDefault();
    if (!decryptedHashData.certID || !decryptedHashData.decryptedHash) {
      alert("Please fill in all required fields");
      return;
    }

    setIsRecording(true);
    try {
      const transaction = prepareContractCall({
        contract: orgContract,
        method: "function adminRecordDecryptedHash(string certID, bytes32 decryptedHash)",
        params: [
          decryptedHashData.certID,
          decryptedHashData.decryptedHash
        ],
      });
      
      await new Promise((resolve, reject) => {
        sendTransaction(transaction, {
          onSuccess: (result) => {
            console.log("Decrypted hash recorded successfully:", result);
            resolve(result);
          },
          onError: (error) => {
            console.error("Failed to record decrypted hash:", error);
            reject(error);
          }
        });
      });
      
      alert("Decrypted hash recorded successfully!");
      setDecryptedHashData({
        certID: "",
        decryptedHash: ""
      });
      
    } catch (error) {
      console.error("Error recording decrypted hash:", error);
      alert("Failed to record decrypted hash. Please try again.");
    } finally {
      setIsRecording(false);
    }
  };

  const handleFlagCertificate = async (e) => {
    e.preventDefault();
    if (!flagData.certID || !flagData.reason) {
      alert("Please fill in all required fields");
      return;
    }

    setIsFlagging(true);
    try {
      const transaction = prepareContractCall({
        contract: orgContract,
        method: "function flagCertificateByFactory(string certID, string reason)",
        params: [
          flagData.certID,
          flagData.reason
        ],
      });
      
      await new Promise((resolve, reject) => {
        sendTransaction(transaction, {
          onSuccess: (result) => {
            console.log("Certificate flagged successfully:", result);
            resolve(result);
          },
          onError: (error) => {
            console.error("Failed to flag certificate:", error);
            reject(error);
          }
        });
      });
      
      alert("Certificate flagged successfully!");
      setFlagData({
        certID: "",
        reason: ""
      });
      
    } catch (error) {
      console.error("Error flagging certificate:", error);
      alert("Failed to flag certificate. Please try again.");
    } finally {
      setIsFlagging(false);
    }
  };

  const handleRevokeCertificate = async (e) => {
    e.preventDefault();
    if (!revokeData.certID || !revokeData.reason) {
      alert("Please fill in all required fields");
      return;
    }

    setIsRevoking(true);
    try {
      const transaction = prepareContractCall({
        contract: orgContract,
        method: "function revokeCertificateByOrg(string certID, string reason)",
        params: [
          revokeData.certID,
          revokeData.reason
        ],
      });
      
      await new Promise((resolve, reject) => {
        sendTransaction(transaction, {
          onSuccess: (result) => {
            console.log("Certificate revoked successfully:", result);
            resolve(result);
          },
          onError: (error) => {
            console.error("Failed to revoke certificate:", error);
            reject(error);
          }
        });
      });
      
      alert("Certificate revoked successfully!");
      setRevokeData({
        certID: "",
        reason: ""
      });
      
    } catch (error) {
      console.error("Error revoking certificate:", error);
      alert("Failed to revoke certificate. Please try again.");
    } finally {
      setIsRevoking(false);
    }
  };

  return (
    <div className="container mx-auto p-6 pt-16 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Building2 className="h-8 w-8 text-blue-600" />
            {orgNamePending ? (
              <div className="flex items-center">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                Loading...
              </div>
            ) : (
              orgName || "Organization Dashboard"
            )}
          </h1>
          <p className="text-gray-600">Issue and manage certificates for your organization</p>
        </div>
        <div className="flex items-center gap-4">
          <Button 
            onClick={() => window.location.href = '/certificate-generator'}
            variant="default"
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
          >
            <FileUp className="h-4 w-4" />
            Mass Upload Certificates
          </Button>
          <Button 
            onClick={() => window.location.href = '/upload'}
            variant="default"
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700"
          >
            <Upload className="h-4 w-4" />
            Add Legacy Documents
          </Button>
          <Button 
            onClick={() => window.location.href = '/organizations'}
            variant="outline"
            className="flex items-center gap-2"
          >
            <BarChart3 className="h-4 w-4" />
            Check Legacy Certificate Stats
          </Button>
          <Badge variant="outline" className="px-4 py-2 text-sm">
            <Award className="h-4 w-4 mr-2" />
            Contract: {orgInfo?.contractAddress || "N/A"}
          </Badge>
        </div>
      </div>

      {/* Organization Info & Statistics */}
      {(orgDetails || stats || certificateCount !== undefined) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Organization Info */}
          <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-700">
                <Building2 className="h-5 w-5" />
                Organization Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-700">Organization Name</Label>
                <p className="text-lg font-semibold text-blue-900">
                  {orgNamePending ? (
                    <div className="flex items-center">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Loading...
                    </div>
                  ) : (
                    orgName || orgDetails?.[0] || "Not Set"
                  )}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Total Certificates</Label>
                <p className="text-lg font-semibold text-green-600">
                  {countPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    certificateCount?.toString() || orgDetails?.[2]?.toString() || "0"
                  )}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Status</Label>
                <div className="flex items-center gap-2">
                  {orgDetails?.[3] ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                  <span className={`text-sm font-medium ${orgDetails?.[3] ? 'text-green-600' : 'text-red-600'}`}>
                    {orgDetails?.[3] ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Statistics */}
          <Card className="border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-700">
                <Shield className="h-5 w-5" />
                Certificate Statistics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {statsPending ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  <span className="text-sm text-gray-600">Loading statistics...</span>
                </div>
              ) : stats ? (
                <>
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium text-gray-700">Total Issued</Label>
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                      {stats[0]?.toString() || "0"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium text-gray-700">Total Flagged</Label>
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                      {stats[1]?.toString() || "0"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium text-gray-700">Total Revoked</Label>
                    <Badge variant="outline" className="bg-red-50 text-red-700">
                      {stats[2]?.toString() || "0"}
                    </Badge>
                  </div>
                </>
              ) : (
                <p className="text-sm text-gray-500 text-center">No statistics available</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Issue Certificate Form */}
      <Card className="border-2 border-dashed border-green-200 bg-green-50/30">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2 text-green-700">
            <Plus className="h-5 w-5" />
            Issue New Certificate
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleIssueCertificate} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="certID">Certificate ID *</Label>
                <Input
                  id="certID"
                  name="certID"
                  value={certificateData.certID}
                  onChange={handleInputChange}
                  placeholder="Enter unique certificate ID"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="filePhash">File P-Hash *</Label>
                <Input
                  id="filePhash"
                  name="filePhash"
                  value={certificateData.filePhash}
                  onChange={handleInputChange}
                  placeholder="Enter file perceptual hash (bytes32)"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dataHash">Data Hash *</Label>
                <Input
                  id="dataHash"
                  name="dataHash"
                  value={certificateData.dataHash}
                  onChange={handleInputChange}
                  placeholder="Enter data hash (bytes32)"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="encryptedData">Encrypted Data *</Label>
                <Textarea
                  id="encryptedData"
                  name="encryptedData"
                  value={certificateData.encryptedData}
                  onChange={handleInputChange}
                  placeholder="Enter encrypted certificate data (bytes)"
                  className="min-h-[80px]"
                  required
                />
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-blue-800">Certificate Data Format</p>
                  <p className="text-xs text-blue-700">
                    • Certificate ID: Unique identifier for the certificate<br/>
                    • File P-Hash: 32-byte perceptual hash of certificate file<br/>
                    • Data Hash: 32-byte hash of certificate metadata<br/>
                    • Encrypted Data: Encrypted certificate information in bytes format
                  </p>
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <Button 
                type="submit" 
                disabled={isIssuing}
                className="px-8"
              >
                {isIssuing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Issuing Certificate...
                  </>
                ) : (
                  <>
                    <Award className="h-4 w-4 mr-2" />
                    Issue Certificate
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Certificate Verification */}
      <Card className="border-2 border-dashed border-indigo-200 bg-indigo-50/30">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2 text-indigo-700">
            <Search className="h-5 w-5" />
            Verify Certificate
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleVerifyCertificate} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="verifyCertID">Certificate ID *</Label>
                <Input
                  id="verifyCertID"
                  name="certID"
                  value={verificationData.certID}
                  onChange={handleVerificationChange}
                  placeholder="Enter certificate ID to verify"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="verifyFilePhash">Recomputed File P-Hash *</Label>
                <Input
                  id="verifyFilePhash"
                  name="recomputedFilePhash"
                  value={verificationData.recomputedFilePhash}
                  onChange={handleVerificationChange}
                  placeholder="0x..."
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="verifyDataHash">Recomputed Data Hash *</Label>
                <Input
                  id="verifyDataHash"
                  name="recomputedDataHash"
                  value={verificationData.recomputedDataHash}
                  onChange={handleVerificationChange}
                  placeholder="0x..."
                  required
                />
              </div>
            </div>
            
            {/* Verification Results */}
            {shouldVerify && verificationResult && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-3">Verification Result:</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium text-gray-700">Status Code:</Label>
                    <Badge variant={verificationResult[0] === 0 ? "default" : "destructive"}>
                      {verificationResult[0]?.toString()}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Message:</Label>
                    <p className="text-sm text-gray-900 mt-1 p-2 bg-white rounded border">
                      {verificationResult[1] || "No message"}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium text-gray-700">Admin Hash Match:</Label>
                    <Badge variant={verificationResult[2] ? "default" : "destructive"}>
                      {verificationResult[2] ? "Match" : "No Match"}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Stored File P-Hash:</Label>
                      <p className="font-mono text-gray-600 break-all mt-1 p-2 bg-white rounded border">
                        {verificationResult[3] || "N/A"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Stored Data Hash:</Label>
                      <p className="font-mono text-gray-600 break-all mt-1 p-2 bg-white rounded border">
                        {verificationResult[4] || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {verificationPending && shouldVerify && (
              <div className="flex items-center justify-center p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <Loader2 className="h-5 w-5 animate-spin mr-2 text-blue-600" />
                <span className="text-blue-700">Verifying certificate...</span>
              </div>
            )}

            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-indigo-600 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-indigo-800">Certificate Verification</p>
                  <p className="text-xs text-indigo-700">
                    Enter the certificate ID and recomputed hashes to verify the certificate's authenticity and integrity against the blockchain records.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button 
                type="submit" 
                disabled={verificationPending}
                className="px-8"
              >
                {verificationPending ? (
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

      {/* Additional Certificate Management Forms */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Record Decrypted Hash */}
        <Card className="border-2 border-dashed border-blue-200 bg-blue-50/30">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-blue-700">
              <Hash className="h-5 w-5" />
              Record Decrypted Hash
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRecordDecryptedHash} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="decryptCertID">Certificate ID *</Label>
                <Input
                  id="decryptCertID"
                  value={decryptedHashData.certID}
                  onChange={(e) => handleDecryptedHashChange(e, 'certID')}
                  placeholder="Enter certificate ID"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="decryptedHash">Decrypted Hash *</Label>
                <Input
                  id="decryptedHash"
                  value={decryptedHashData.decryptedHash}
                  onChange={(e) => handleDecryptedHashChange(e, 'decryptedHash')}
                  placeholder="0x..."
                  required
                />
              </div>
              <Button 
                type="submit" 
                disabled={isRecording}
                size="sm"
                className="w-full"
              >
                {isRecording ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Recording...
                  </>
                ) : (
                  <>
                    <Hash className="h-4 w-4 mr-2" />
                    Record Hash
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Flag Certificate */}
        <Card className="border-2 border-dashed border-yellow-200 bg-yellow-50/30">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-yellow-700">
              <Flag className="h-5 w-5" />
              Flag Certificate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleFlagCertificate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="flagCertID">Certificate ID *</Label>
                <Input
                  id="flagCertID"
                  value={flagData.certID}
                  onChange={(e) => handleFlagChange(e, 'certID')}
                  placeholder="Enter certificate ID"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="flagReason">Reason *</Label>
                <Textarea
                  id="flagReason"
                  value={flagData.reason}
                  onChange={(e) => handleFlagChange(e, 'reason')}
                  placeholder="Enter reason for flagging"
                  className="min-h-[80px]"
                  required
                />
              </div>
              <Button 
                type="submit" 
                disabled={isFlagging}
                variant="destructive"
                size="sm"
                className="w-full"
              >
                {isFlagging ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Flagging...
                  </>
                ) : (
                  <>
                    <Flag className="h-4 w-4 mr-2" />
                    Flag Certificate
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Revoke Certificate */}
        <Card className="border-2 border-dashed border-red-200 bg-red-50/30">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-red-700">
              <X className="h-5 w-5" />
              Revoke Certificate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRevokeCertificate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="revokeCertID">Certificate ID *</Label>
                <Input
                  id="revokeCertID"
                  value={revokeData.certID}
                  onChange={(e) => handleRevokeChange(e, 'certID')}
                  placeholder="Enter certificate ID"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="revokeReason">Reason *</Label>
                <Textarea
                  id="revokeReason"
                  value={revokeData.reason}
                  onChange={(e) => handleRevokeChange(e, 'reason')}
                  placeholder="Enter reason for revocation"
                  className="min-h-[80px]"
                  required
                />
              </div>
              <Button 
                type="submit" 
                disabled={isRevoking}
                variant="destructive"
                size="sm"
                className="w-full"
              >
                {isRevoking ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Revoking...
                  </>
                ) : (
                  <>
                    <X className="h-4 w-4 mr-2" />
                    Revoke Certificate
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Certificates List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <FileText className="h-5 w-5 text-blue-600" />
          Issued Certificates
        </h2>
        
        {countPending ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin mr-3" />
            <span>Loading certificates...</span>
          </div>
        ) : certificateCount && Number(certificateCount) > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: Number(certificateCount) }, (_, index) => (
              <CertificateCard 
                key={index} 
                index={index} 
                orgContract={orgContract} 
              />
            ))}
          </div>
        ) : (
          <Card className="border-dashed border-2 border-gray-200">
            <CardContent className="p-8 text-center">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Certificates Issued</h3>
              <p className="text-gray-600">Issue your first certificate using the form above.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

// Certificate Card Component with ID fetching
function CertificateCard({ index, orgContract }) {
  const { data: certificateId, isPending: certIdPending } = useReadContract({
    contract: orgContract,
    method: "function getCertificateIdByIndex(uint256 index) view returns (string)",
    params: [BigInt(index)],
    enabled: !!orgContract,
  });

  return (
    <Card className="hover:shadow-lg transition-all duration-200 border-2 hover:border-green-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Award className="h-5 w-5 text-green-600" />
            Certificate #{index + 1}
          </CardTitle>
          <Badge variant="default" className="text-xs">
            Active
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <Label className="text-sm font-medium text-gray-700">Certificate ID:</Label>
          {certIdPending ? (
            <div className="flex items-center mt-1">
              <Loader2 className="h-3 w-3 animate-spin mr-2" />
              <span className="text-xs text-gray-500">Loading...</span>
            </div>
          ) : (
            <p className="text-sm font-semibold text-gray-900 break-all mt-1">
              {certificateId || "N/A"}
            </p>
          )}
        </div>
        <div className="pt-2 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Index: {index}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
