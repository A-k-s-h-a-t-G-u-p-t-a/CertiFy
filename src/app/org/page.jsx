"use client";
import { useState, useEffect } from "react";
import { useActiveAccount, useReadContract, useSendTransaction } from "thirdweb/react";
import { getContract, prepareContractCall } from "thirdweb";
import { defineChain } from "thirdweb/chains";
import { client } from "../../lib/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Building2, Users, Loader2, Plus, FileText, CheckCircle, XCircle, 
  AlertCircle, Shield, Award, Hash, Flag, X, Search, BarChart3, 
  Upload, FileUp, LayoutDashboard, FileSignature, ShieldAlert, 
  Menu, ChevronRight, Wallet, Lock, FileCheck
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
              setIsValidOrg(false);
              setOrgContract(null);
              setOrgInfo(org);
            }
          } else {
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
      <div className="flex items-center justify-center min-h-screen bg-[#F5FAFA] pt-20">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-[#009688]" />
          <p className="text-[#009688] font-medium animate-pulse">
            {!account ? "Waiting for wallet connection..." : "Loading organization data..."}
          </p>
        </div>
      </div>
    );
  }

  if (!isValidOrg) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5FAFA] pt-20">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-6 p-8 bg-white rounded-2xl shadow-xl max-w-md border border-[#D9E5E6]"
        >
          <XCircle className="h-24 w-24 text-red-400 mx-auto" />
          <div className="space-y-4">
            <h1 className="text-3xl font-bold text-red-600">
              {orgInfo && orgInfo.isFlagged 
                ? "Organization Flagged" 
                : orgInfo && !orgInfo.isActive 
                ? "Organization Inactive" 
                : "Invalid Organization"}
            </h1>
            <p className="text-gray-600">
              {orgInfo && orgInfo.isFlagged 
                ? "Your organization has been flagged by the administrator. Please contact support." 
                : orgInfo && !orgInfo.isActive 
                ? "Your organization is currently inactive. Please contact the administrator." 
                : "Your wallet address is not registered as a valid organization. Please contact the administrator."}
            </p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-left">
              <p className="text-sm text-red-700 truncate">
                <strong>Connected:</strong> {account.address}
              </p>
              {orgInfo && (
                <>
                  <p className="text-sm text-red-700 mt-2">
                    <strong>Name:</strong> {orgInfo.name}
                  </p>
                  <p className="text-sm text-red-700 mt-2">
                    <strong>Status:</strong> {orgInfo.isFlagged ? "Flagged" : orgInfo.isActive ? "Active" : "Inactive"}
                  </p>
                </>
              )}
            </div>
            <Button 
              onClick={() => window.location.href = '/'}
              className="w-full bg-[#009688] hover:bg-[#00796B]"
            >
              Return Home
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Only render the dashboard when we have a valid contract
  return <OrgDashboard orgContract={orgContract} account={account} orgInfo={orgInfo} />;
}

// Separate component that only renders when contract is ready
function OrgDashboard({ orgContract, account, orgInfo }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

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

  // Sidebar Component
  const SidebarItem = ({ id, icon: Icon, label }) => (
    <motion.button
      whileHover={{ x: 4, backgroundColor: "rgba(0, 150, 136, 0.1)" }}
      whileTap={{ scale: 0.98 }}
      onClick={() => setActiveTab(id)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
        activeTab === id 
          ? "bg-[#009688] text-white shadow-md" 
          : "text-gray-600 hover:text-[#009688]"
      }`}
    >
      <Icon className={`h-5 w-5 ${activeTab === id ? "text-white" : "text-current"}`} />
      {isSidebarOpen && <span className="font-medium">{label}</span>}
    </motion.button>
  );

  return (
    <div className="h-screen bg-[#F5FAFA] flex pt-20 overflow-hidden">
      {/* Sidebar */}
      <motion.div 
        initial={{ width: 280 }}
        animate={{ width: isSidebarOpen ? 280 : 80 }}
        className="bg-white border-r border-[#D9E5E6] h-full flex flex-col shadow-sm"
      >
        <div className="p-6 flex items-center justify-between">
          {isSidebarOpen ? (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }}
              className="flex items-center gap-2"
            >
              <Building2 className="h-8 w-8 text-[#009688]" />
              <span className="text-xl font-bold text-gray-800">Org Panel</span>
            </motion.div>
          ) : (
            <Building2 className="h-8 w-8 text-[#009688] mx-auto" />
          )}
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
          >
            {isSidebarOpen ? <Menu className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
          </button>
        </div>

        <div className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto">
          <SidebarItem id="overview" icon={LayoutDashboard} label="Overview" />
          <SidebarItem id="issue" icon={FileSignature} label="Issue Certificate" />
          <SidebarItem id="manage" icon={ShieldAlert} label="Manage & Revoke" />
          <SidebarItem id="verify" icon={FileCheck} label="Verify Certificate" />
          <SidebarItem id="playground" icon={FileText} label="Certificate Playground" />
        </div>

        <div className="p-4 border-t border-[#D9E5E6]">
          {isSidebarOpen ? (
            <div className="flex items-center gap-3 px-2">
              <div className="h-10 w-10 rounded-full bg-[#D9E5E6] flex items-center justify-center text-[#009688] font-bold">
                {orgName?.charAt(0).toUpperCase() || "O"}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-medium text-gray-900 truncate">{orgName || "Organization"}</p>
                <p className="text-xs text-gray-500">Active Session</p>
              </div>
            </div>
          ) : (
            <div className="h-10 w-10 rounded-full bg-[#D9E5E6] flex items-center justify-center text-[#009688] font-bold mx-auto">
              {orgName?.charAt(0).toUpperCase() || "O"}
            </div>
          )}
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-y-auto h-full">
        <div className="max-w-7xl mx-auto space-y-8 pb-20">
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between"
          >
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {activeTab === 'overview' && 'Dashboard Overview'}
                {activeTab === 'issue' && 'Issue New Certificate'}
                {activeTab === 'manage' && 'Manage Certificates'}
                {activeTab === 'verify' && 'Verify Certificate'}
                {activeTab === 'playground' && 'Certificate Playground'}
              </h1>
              <p className="text-gray-500 mt-1">
                Manage your organization's certificates and records.
              </p>
            </div>
            <div className="flex gap-3">
              <Button 
                onClick={() => window.location.href = '/upload-certificates'}
                className="bg-[#009688] hover:bg-[#00796B] text-white shadow-sm"
              >
                <FileUp className="h-4 w-4 mr-2" />
                Mass Generate
              </Button>
            </div>
          </motion.div>

          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    { title: "Total Issued", value: stats?.[0]?.toString() || "0", icon: Award, color: "green" },
                    { title: "Flagged", value: stats?.[1]?.toString() || "0", icon: Flag, color: "yellow" },
                    { title: "Revoked", value: stats?.[2]?.toString() || "0", icon: XCircle, color: "red" }
                  ].map((stat, index) => (
                    <motion.div
                      key={index}
                      whileHover={{ scale: 1.02, translateY: -5 }}
                      className="bg-white p-6 rounded-2xl shadow-sm border border-[#D9E5E6] relative overflow-hidden group"
                    >
                      <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-${stat.color}-600`}>
                        <stat.icon className="h-24 w-24 transform translate-x-4 translate-y-4" />
                      </div>
                      <div className="relative z-10">
                        <div className={`p-3 rounded-xl bg-${stat.color}-50 w-fit mb-4`}>
                          <stat.icon className={`h-6 w-6 text-${stat.color}-600`} />
                        </div>
                        <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                        <h3 className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</h3>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Organization Info Card */}
                <Card className="border-[#D9E5E6] shadow-sm bg-white">
                  <CardHeader className="bg-[#F5FAFA] border-b border-[#D9E5E6]">
                    <CardTitle className="flex items-center gap-2 text-[#009688]">
                      <Building2 className="h-5 w-5" />
                      Organization Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <Label className="text-gray-500">Organization Name</Label>
                      <p className="text-lg font-semibold text-gray-900">
                        {orgName || orgDetails?.[0] || "Loading..."}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-gray-500">Contract Address</Label>
                      <div className="flex items-center gap-2 bg-gray-50 p-2 rounded border border-gray-200">
                        <code className="text-xs flex-1 truncate">{orgInfo?.contractAddress}</code>
                        <button 
                          onClick={() => navigator.clipboard.writeText(orgInfo?.contractAddress)}
                          className="text-gray-400 hover:text-[#009688]"
                        >
                          <Wallet className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-gray-500">Status</Label>
                      <div className="flex items-center gap-2">
                        <Badge className={orgDetails?.[3] ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                          {orgDetails?.[3] ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {activeTab === 'issue' && (
              <motion.div
                key="issue"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="border-[#D9E5E6] shadow-sm bg-white overflow-hidden">
                  <div className="bg-[#F5FAFA] border-b border-[#D9E5E6] p-6">
                    <div className="flex items-center gap-3 text-[#009688] mb-1">
                      <div className="p-2 bg-white rounded-lg border border-[#D9E5E6]">
                        <Plus className="h-5 w-5" />
                      </div>
                      <h3 className="font-bold text-lg text-gray-900">Issue Single Certificate</h3>
                    </div>
                    <p className="text-sm text-gray-500 ml-[52px]">Manually issue a new certificate on the blockchain</p>
                  </div>
                  
                  <CardContent className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-gray-700 font-medium">Certificate ID</Label>
                        <div className="relative group">
                          <Hash className="absolute left-3 top-3 h-4 w-4 text-gray-400 group-focus-within:text-[#009688] transition-colors" />
                          <Input 
                            placeholder="e.g. CERT-2025-001" 
                            className="pl-10 border-gray-200 focus:border-[#009688] focus:ring-[#009688] bg-gray-50/50 h-11"
                            value={certificateData.certID}
                            onChange={handleInputChange}
                            name="certID"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-gray-700 font-medium">File Hash (IPFS)</Label>
                        <div className="relative group">
                          <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-400 group-focus-within:text-[#009688] transition-colors" />
                          <Input 
                            placeholder="Qm..." 
                            className="pl-10 border-gray-200 focus:border-[#009688] focus:ring-[#009688] bg-gray-50/50 h-11"
                            value={certificateData.filePhash}
                            onChange={handleInputChange}
                            name="filePhash"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-gray-700 font-medium">Data Hash</Label>
                        <div className="relative group">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400 group-focus-within:text-[#009688] transition-colors" />
                          <Input 
                            placeholder="0x..." 
                            className="pl-10 border-gray-200 focus:border-[#009688] focus:ring-[#009688] bg-gray-50/50 h-11"
                            value={certificateData.dataHash}
                            onChange={handleInputChange}
                            name="dataHash"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-gray-700 font-medium">Encrypted Data</Label>
                        <div className="relative group">
                          <Shield className="absolute left-3 top-3 h-4 w-4 text-gray-400 group-focus-within:text-[#009688] transition-colors" />
                          <Input 
                            placeholder="0x..." 
                            className="pl-10 border-gray-200 focus:border-[#009688] focus:ring-[#009688] bg-gray-50/50 h-11"
                            value={certificateData.encryptedData}
                            onChange={handleInputChange}
                            name="encryptedData"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <Button 
                      onClick={handleIssueCertificate}
                      disabled={isIssuing}
                      className="w-full bg-[#009688] hover:bg-[#00796B] text-white h-12 text-base font-medium shadow-md hover:shadow-lg transition-all"
                    >
                      {isIssuing ? <Loader2 className="animate-spin mr-2" /> : <Plus className="mr-2 h-5 w-5" />}
                      Issue Certificate
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {activeTab === 'manage' && (
              <motion.div
                key="manage"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-8"
              >
                {/* Record Decrypted Hash */}
                <Card className="border-[#D9E5E6] shadow-sm bg-white h-fit">
                  <CardHeader className="bg-[#F5FAFA] border-b border-[#D9E5E6]">
                    <CardTitle className="flex items-center gap-2 text-gray-700">
                      <Lock className="h-5 w-5" />
                      Record Decrypted Hash
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div className="space-y-2">
                      <Label>Certificate ID</Label>
                      <Input 
                        placeholder="e.g. CERT-2025-001" 
                        className="border-gray-200 focus:ring-[#009688]"
                        value={decryptedHashData.certID}
                        onChange={handleDecryptedHashChange}
                        name="certID"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Decrypted Hash</Label>
                      <Input 
                        placeholder="0x..." 
                        className="border-gray-200 focus:ring-[#009688]"
                        value={decryptedHashData.decryptedHash}
                        onChange={handleDecryptedHashChange}
                        name="decryptedHash"
                      />
                    </div>
                    <Button 
                      onClick={handleRecordDecryptedHash}
                      disabled={isRecording}
                      variant="outline"
                      className="w-full border-[#009688] text-[#009688] hover:bg-[#F5FAFA]"
                    >
                      {isRecording ? <Loader2 className="animate-spin mr-2" /> : "Record Hash"}
                    </Button>
                  </CardContent>
                </Card>

                <div className="space-y-8">
                  {/* Flag Certificate */}
                  <Card className="border-yellow-100 shadow-sm bg-white">
                    <CardHeader className="bg-yellow-50/50 border-b border-yellow-100">
                      <CardTitle className="flex items-center gap-2 text-yellow-700">
                        <Flag className="h-5 w-5" />
                        Flag Certificate
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                      <div className="space-y-2">
                        <Label>Certificate ID</Label>
                        <Input 
                          placeholder="e.g. CERT-2025-001" 
                          className="border-yellow-200 focus:ring-yellow-500"
                          value={flagData.certID}
                          onChange={handleFlagChange}
                          name="certID"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Reason</Label>
                        <Input 
                          placeholder="Why is this flagged?" 
                          className="border-yellow-200 focus:ring-yellow-500"
                          value={flagData.reason}
                          onChange={handleFlagChange}
                          name="reason"
                        />
                      </div>
                      <Button 
                        onClick={handleFlagCertificate}
                        disabled={isFlagging}
                        className="w-full bg-yellow-500 hover:bg-yellow-600 text-white"
                      >
                        {isFlagging ? <Loader2 className="animate-spin mr-2" /> : "Flag Certificate"}
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Revoke Certificate */}
                  <Card className="border-red-100 shadow-sm bg-white">
                    <CardHeader className="bg-red-50/50 border-b border-red-100">
                      <CardTitle className="flex items-center gap-2 text-red-700">
                        <XCircle className="h-5 w-5" />
                        Revoke Certificate
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                      <div className="space-y-2">
                        <Label>Certificate ID</Label>
                        <Input 
                          placeholder="e.g. CERT-2025-001" 
                          className="border-red-200 focus:ring-red-500"
                          value={revokeData.certID}
                          onChange={handleRevokeChange}
                          name="certID"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Reason</Label>
                        <Input 
                          placeholder="Why is this revoked?" 
                          className="border-red-200 focus:ring-red-500"
                          value={revokeData.reason}
                          onChange={handleRevokeChange}
                          name="reason"
                        />
                      </div>
                      <Button 
                        onClick={handleRevokeCertificate}
                        disabled={isRevoking}
                        className="w-full bg-red-600 hover:bg-red-700 text-white"
                      >
                        {isRevoking ? <Loader2 className="animate-spin mr-2" /> : "Revoke Permanently"}
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            )}

            {activeTab === 'playground' && (
              <motion.div
                key="playground"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="border-[#D9E5E6] shadow-sm bg-white">
                  <CardHeader className="bg-[#F5FAFA] border-b border-[#D9E5E6]">
                    <CardTitle className="flex items-center gap-2 text-[#009688]">
                      <FileText className="h-5 w-5" />
                      Certificate Playground
                    </CardTitle>
                    <CardDescription>
                      Design and preview your certificates with our interactive builder
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="text-center py-12">
                      <FileText className="h-16 w-16 text-[#009688] mx-auto mb-4 opacity-50" />
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        Certificate Builder
                      </h3>
                      <p className="text-gray-600 mb-6 max-w-md mx-auto">
                        Create beautiful, professional certificates with our easy-to-use builder. 
                        Customize templates, add your branding, and preview in real-time.
                      </p>
                      <Button 
                        onClick={() => window.location.href = '/certificate-generator'}
                        className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
                      >
                        Open Certificate Playground
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {activeTab === 'verify' && (
              <motion.div
                key="verify"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="border-[#D9E5E6] shadow-sm bg-white">
                  <CardHeader className="bg-[#F5FAFA] border-b border-[#D9E5E6]">
                    <CardTitle className="flex items-center gap-2 text-[#009688]">
                      <FileCheck className="h-5 w-5" />
                      Verify Certificate Integrity
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <Label>Certificate ID</Label>
                        <Input 
                          placeholder="e.g. CERT-2025-001" 
                          className="border-gray-200 focus:ring-[#009688]"
                          value={verificationData.certID}
                          onChange={handleVerificationChange}
                          name="certID"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Recomputed File Hash</Label>
                        <Input 
                          placeholder="0x..." 
                          className="border-gray-200 focus:ring-[#009688]"
                          value={verificationData.recomputedFilePhash}
                          onChange={handleVerificationChange}
                          name="recomputedFilePhash"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Recomputed Data Hash</Label>
                        <Input 
                          placeholder="0x..." 
                          className="border-gray-200 focus:ring-[#009688]"
                          value={verificationData.recomputedDataHash}
                          onChange={handleVerificationChange}
                          name="recomputedDataHash"
                        />
                      </div>
                    </div>
                    
                    <Button 
                      onClick={handleVerifyCertificate}
                      className="w-full bg-[#009688] hover:bg-[#00796B] text-white"
                    >
                      Verify Now
                    </Button>

                    <AnimatePresence>
                      {shouldVerify && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="mt-6"
                        >
                          {verificationPending ? (
                            <div className="flex items-center justify-center p-8 bg-gray-50 rounded-xl">
                              <Loader2 className="h-6 w-6 animate-spin text-[#009688] mr-2" />
                              <span className="text-gray-600">Verifying on blockchain...</span>
                            </div>
                          ) : verificationResult ? (
                            <div className={`p-6 rounded-xl border ${verificationResult[0] === 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                              <div className="flex items-center gap-3 mb-2">
                                {verificationResult[0] === 0 ? (
                                  <CheckCircle className="h-6 w-6 text-green-600" />
                                ) : (
                                  <XCircle className="h-6 w-6 text-red-600" />
                                )}
                                <h3 className={`text-lg font-bold ${verificationResult[0] === 0 ? 'text-green-800' : 'text-red-800'}`}>
                                  {verificationResult[0] === 0 ? "Verification Successful" : "Verification Failed"}
                                </h3>
                              </div>
                              <p className="text-gray-700 ml-9">{verificationResult[1]}</p>
                              
                              <div className="mt-4 grid grid-cols-2 gap-4 ml-9 text-sm">
                                <div>
                                  <span className="text-gray-500">Stored File Hash:</span>
                                  <p className="font-mono text-gray-800 truncate">{verificationResult[3]}</p>
                                </div>
                                <div>
                                  <span className="text-gray-500">Stored Data Hash:</span>
                                  <p className="font-mono text-gray-800 truncate">{verificationResult[4]}</p>
                                </div>
                              </div>
                            </div>
                          ) : null}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
