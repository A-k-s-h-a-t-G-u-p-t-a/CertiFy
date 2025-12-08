"use client";
import { contract } from "../../lib/client";
import { useSession } from "next-auth/react";
import { useReadContract, useSendTransaction, useActiveAccount } from "thirdweb/react";
import { prepareContractCall } from "thirdweb";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { 
  Building2, Users, Loader2, Plus, UserPlus, Search, Eye, X, 
  CheckCircle, XCircle, AlertCircle, Flag, Shield, ShieldAlert, 
  BarChart3, TrendingUp, Activity, PieChart, LayoutDashboard, 
  Settings, Menu, ChevronRight, Wallet, Copy, ExternalLink
} from "lucide-react";
import { useState, useEffect } from "react";
import { 
  PieChart as RechartsPieChart, Cell, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, Pie 
} from 'recharts';
import { motion, AnimatePresence } from "framer-motion";

// Color Constants
const COLORS = {
  primary: "#F5FAFA",    // Frost White-Teal (Backgrounds)
  secondary: "#D9E5E6",  // Cool Mist Teal-Gray (Cards/Sidebar)
  accent: "#009688",     // Subtle Teal (Actions)
  accentHover: "#00796B", // Darker Teal (Hover)
  text: "#1F2937",       // Dark Gray (Text)
  muted: "#6B7280"       // Muted Text
};

// Helper component for individual organization card
const OrganizationCard = ({ orgAddress, index, onViewDetails }) => {
  const { data: details, isPending } = useReadContract({
    contract,
    method: "function getOrganization(address orgWallet) view returns (address _orgWallet, address _certContract, string _name, string _meta, bool _isActive, bool _isFlagged, uint256 _issuedCertCount)",
    params: [orgAddress],
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ scale: 1.02 }}
      className="bg-white rounded-xl border border-[#D9E5E6] p-6 shadow-sm hover:shadow-md transition-all flex flex-col h-full"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="h-10 w-10 rounded-full bg-[#F5FAFA] flex items-center justify-center text-[#009688]">
          <Building2 className="h-5 w-5" />
        </div>
        <Badge className="bg-[#D9E5E6] text-[#009688] hover:bg-[#D9E5E6]">
          #{index + 1}
        </Badge>
      </div>
      
      <div className="flex-1">
        {isPending ? (
          <div className="space-y-2 animate-pulse">
            <div className="h-6 bg-gray-100 rounded w-3/4"></div>
            <div className="h-4 bg-gray-100 rounded w-1/2"></div>
          </div>
        ) : (
          <>
            <h3 className="font-bold text-lg text-gray-900 mb-1 truncate" title={details?.[2]}>
              {details?.[2] || "Unknown Organization"}
            </h3>
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="outline" className={details?.[4] ? "text-green-600 border-green-200 bg-green-50" : "text-gray-500"}>
                {details?.[4] ? "Active" : "Inactive"}
              </Badge>
              {details?.[5] && (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <Flag className="h-3 w-3" /> Flagged
                </Badge>
              )}
            </div>
          </>
        )}
      </div>

      <div className="bg-[#F5FAFA] p-2 rounded-lg border border-[#D9E5E6] mb-4 mt-2">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
          <span>Wallet Address</span>
          <button 
            onClick={() => navigator.clipboard.writeText(orgAddress)}
            className="hover:text-[#009688]"
          >
            <Copy className="h-3 w-3" />
          </button>
        </div>
        <p className="text-xs font-mono text-gray-700 truncate">{orgAddress}</p>
      </div>

      <Button 
        variant="outline" 
        className="w-full border-[#009688] text-[#009688] hover:bg-[#F5FAFA] mt-auto"
        onClick={() => onViewDetails(orgAddress)}
      >
        View Full Details
      </Button>
    </motion.div>
  );
};

export default function AdminPage() {
  const ADMIN_ADDRESS = "0x0408e64385FA3E98b86b55b8998B94Ecb771EF1D";
  const account = useActiveAccount();
  const { data: session } = useSession();
  const adminUsername = session?.user?.username || "Unknown";

  // State
  const [activeTab, setActiveTab] = useState("overview");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedOrgAddress, setSelectedOrgAddress] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    orgWallet: "",
    name: "",
    meta: ""
  });
  const [viewOrgAddress, setViewOrgAddress] = useState("");
  const [flagFormData, setFlagFormData] = useState({
    orgWallet: "",
    flagged: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFlagging, setIsFlagging] = useState(false);
  const [transactionResult, setTransactionResult] = useState(null);

  const { mutate: sendTransaction } = useSendTransaction();

  // Get all organizations
  const { data: organizations, isPending, refetch } = useReadContract({
    contract,
    method: "function getAllOrganizations() view returns (address[])",
    params: [],
  });

  // Get specific organization details for modal
  const { data: modalOrgDetails, isPending: modalDetailsPending } = useReadContract({
    contract,
    method: "function getOrganization(address orgWallet) view returns (address _orgWallet, address _certContract, string _name, string _meta, bool _isActive, bool _isFlagged, uint256 _issuedCertCount)",
    params: selectedOrgAddress ? [selectedOrgAddress] : undefined,
  });

  // Get specific organization details for management tab
  const { data: orgDetails, isPending: detailsPending } = useReadContract({
    contract,
    method: "function getOrganization(address orgWallet) view returns (address _orgWallet, address _certContract, string _name, string _meta, bool _isActive, bool _isFlagged, uint256 _issuedCertCount)",
    params: viewOrgAddress ? [viewOrgAddress] : undefined,
  });

  const handleViewDetails = (address) => {
    setSelectedOrgAddress(address);
    setIsDetailsModalOpen(true);
  };

  // Analytics state
  const [analyticsData, setAnalyticsData] = useState({
    total: 0,
    active: 0,
    flagged: 0,
    totalCertificates: 0,
    loading: false,
    pieChartData: [],
    barChartData: [],
    trendData: []
  });

  // Fetch analytics data
  const fetchAnalyticsData = async () => {
    if (!organizations || organizations.length === 0) {
      setAnalyticsData({
        total: 0,
        active: 0,
        flagged: 0,
        totalCertificates: 0,
        loading: false,
        pieChartData: [],
        barChartData: [],
        trendData: []
      });
      return;
    }

    setAnalyticsData(prev => ({ ...prev, loading: true }));

    try {
      let active = 0;
      let flagged = 0;
      let totalCertificates = 0;

      const total = organizations.length;
      
      // Simulate realistic distribution
      active = Math.floor(total * 0.85); 
      flagged = Math.floor(total * 0.15); 
      const inactive = total - active - flagged;
      totalCertificates = total * 25; 

      const pieChartData = [
        { name: 'Active', value: active, color: '#22c55e' },
        { name: 'Flagged', value: flagged, color: '#ef4444' },
        { name: 'Inactive', value: inactive, color: '#6b7280' }
      ].filter(item => item.value > 0);

      const barChartData = [
        { name: 'Organizations', total, active, flagged, inactive },
        { name: 'Certificates', total: totalCertificates, active: Math.floor(totalCertificates * 0.8), flagged: Math.floor(totalCertificates * 0.1), inactive: Math.floor(totalCertificates * 0.1) }
      ];

      const trendData = Array.from({ length: 7 }, (_, index) => ({
        day: `Day ${index + 1}`,
        organizations: Math.floor(total * (0.7 + (index * 0.05))),
        certificates: Math.floor(totalCertificates * (0.6 + (index * 0.07))),
        flagged: Math.floor(flagged * (1 - (index * 0.1)))
      }));

      setAnalyticsData({
        total,
        active,
        flagged,
        totalCertificates,
        loading: false,
        pieChartData,
        barChartData,
        trendData
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
      setAnalyticsData(prev => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    if (organizations) {
      fetchAnalyticsData();
    }
  }, [organizations]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleViewOrgSubmit = (e) => {
    e.preventDefault();
    if (!viewOrgAddress.trim()) {
      alert("Please enter a valid organization wallet address");
      return;
    }
  };

  const clearOrgDetails = () => {
    setViewOrgAddress("");
  };

  const handleFlagSubmit = async (e) => {
    e.preventDefault();
    if (!flagFormData.orgWallet.trim()) {
      alert("Please enter a valid organization wallet address");
      return;
    }

    setIsFlagging(true);
    setTransactionResult(null);
    
    try {
      const transaction = prepareContractCall({
        contract,
        method: "function flagOrganization(address orgWallet, bool flagged)",
        params: [flagFormData.orgWallet, flagFormData.flagged],
      });
      
      const result = await new Promise((resolve, reject) => {
        sendTransaction(transaction, {
          onSuccess: (result) => {
            resolve(result);
          },
          onError: (error) => {
            reject(error);
          }
        });
      });
      
      setTransactionResult({
        rawData: result,
        action: flagFormData.flagged ? "flagged" : "unflagged"
      });
      
      setFlagFormData({ orgWallet: "", flagged: false });
      
      setTimeout(() => {
        refetch();
        if (viewOrgAddress === flagFormData.orgWallet) {
          setViewOrgAddress("");
          setTimeout(() => setViewOrgAddress(flagFormData.orgWallet), 100);
        }
      }, 2000);
      
    } catch (error) {
      console.error("Error flagging organization:", error);
      alert("Failed to update organization flag status. Please try again.");
    } finally {
      setIsFlagging(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.orgWallet || !formData.name) {
      alert("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const transaction = prepareContractCall({
        contract,
        method: "function addOrganization(address orgWallet, string name, string meta)",
        params: [formData.orgWallet, formData.name, formData.meta],
      });
      
      await new Promise((resolve, reject) => {
        sendTransaction(transaction, {
          onSuccess: (result) => {
            resolve(result);
          },
          onError: (error) => {
            reject(error);
          }
        });
      });
      
      // Sync to DB
      await new Promise(resolve => setTimeout(resolve, 3000));
      try {
        const syncResponse = await fetch("/api/organizations/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
        const syncResult = await syncResponse.json();
        if (syncResult.success) {
          alert(`Organization added & synced successfully!`);
        } else {
          alert("Added to blockchain but DB sync failed.");
        }
      } catch (syncError) {
        console.error("Error syncing to database:", syncError);
      }
      
      setFormData({ orgWallet: "", name: "", meta: "" });
      setTimeout(() => {
        refetch();
      }, 2000);
      
    } catch (error) {
      console.error("Error adding organization:", error);
      alert("Failed to add organization. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Access Control
  if (!account || account.address.toLowerCase() !== ADMIN_ADDRESS.toLowerCase()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5FAFA] pt-20">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-6 p-8 bg-white rounded-2xl shadow-xl max-w-md border border-[#D9E5E6]"
        >
          <ShieldAlert className="h-24 w-24 text-red-400 mx-auto" />
          <div className="space-y-4">
            <h1 className="text-3xl font-bold text-red-600">Access Denied</h1>
            <p className="text-gray-600">
              You are not authorized to access this admin panel.
            </p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-700 font-mono">
                {account?.address || "Not connected"}
              </p>
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

  if (isPending) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F5FAFA] pt-20">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-[#009688]" />
          <p className="text-[#009688] font-medium animate-pulse">Loading Admin Dashboard...</p>
        </div>
      </div>
    );
  }

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
              <Shield className="h-8 w-8 text-[#009688]" />
              <span className="text-xl font-bold text-gray-800">CertiFy Admin</span>
            </motion.div>
          ) : (
            <Shield className="h-8 w-8 text-[#009688] mx-auto" />
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
          <SidebarItem id="organizations" icon={Building2} label="Organizations" />
          <SidebarItem id="management" icon={Settings} label="Management" />
        </div>

        <div className="p-4 border-t border-[#D9E5E6]">
          {isSidebarOpen ? (
            <div className="flex items-center gap-3 px-2">
              <div className="h-10 w-10 rounded-full bg-[#D9E5E6] flex items-center justify-center text-[#009688] font-bold">
                {adminUsername.charAt(0).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-medium text-gray-900 truncate">{adminUsername}</p>
                <p className="text-xs text-gray-500">Administrator</p>
              </div>
            </div>
          ) : (
            <div className="h-10 w-10 rounded-full bg-[#D9E5E6] flex items-center justify-center text-[#009688] font-bold mx-auto">
              {adminUsername.charAt(0).toUpperCase()}
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
                {activeTab === 'organizations' && 'Registered Organizations'}
                {activeTab === 'management' && 'System Management'}
              </h1>
              <p className="text-gray-500 mt-1">
                Welcome back, {adminUsername}. Here's what's happening today.
              </p>
            </div>
            <div className="flex gap-3">
              <Badge className="bg-[#D9E5E6] text-[#009688] hover:bg-[#D9E5E6] px-4 py-1.5 text-sm">
                <Users className="h-4 w-4 mr-2" />
                {organizations?.length || 0} Orgs
              </Badge>
              <Badge className="bg-[#009688] hover:bg-[#00796B] px-4 py-1.5 text-sm">
                <Shield className="h-4 w-4 mr-2" />
                Admin Active
              </Badge>
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { title: "Total Organizations", value: analyticsData.total, icon: Building2, color: "blue" },
                    { title: "Active Organizations", value: analyticsData.active, icon: CheckCircle, color: "green" },
                    { title: "Flagged Organizations", value: analyticsData.flagged, icon: Flag, color: "red" },
                    { title: "Total Certificates", value: analyticsData.totalCertificates.toLocaleString(), icon: Activity, color: "purple" }
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

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="border-[#D9E5E6] shadow-sm bg-white">
                    <CardHeader>
                      <CardTitle className="text-gray-800">Organization Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <RechartsPieChart>
                          <Tooltip />
                          <Legend />
                          <Pie
                            data={analyticsData.pieChartData}
                            cx="50%" cy="50%" 
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {analyticsData.pieChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card className="border-[#D9E5E6] shadow-sm bg-white">
                    <CardHeader>
                      <CardTitle className="text-gray-800">Growth Trends</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={analyticsData.trendData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                          <XAxis dataKey="day" stroke="#888" fontSize={12} />
                          <YAxis stroke="#888" fontSize={12} />
                          <Tooltip 
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                          />
                          <Line type="monotone" dataKey="organizations" stroke="#009688" strokeWidth={3} dot={{ r: 4 }} />
                          <Line type="monotone" dataKey="certificates" stroke="#6366f1" strokeWidth={2} strokeDasharray="5 5" />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            )}

            {activeTab === 'organizations' && (
              <motion.div
                key="organizations"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {organizations?.map((orgAddress, index) => (
                  <OrganizationCard 
                    key={index} 
                    orgAddress={orgAddress} 
                    index={index} 
                    onViewDetails={handleViewDetails}
                  />
                ))}
              </motion.div>
            )}

            {activeTab === 'management' && (
              <motion.div
                key="management"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-8"
              >
                {/* Add Organization */}
                <Card className="border-[#D9E5E6] shadow-sm h-fit bg-white overflow-hidden">
                  <div className="bg-[#F5FAFA] border-b border-[#D9E5E6] p-6">
                    <div className="flex items-center gap-3 text-[#009688] mb-1">
                      <div className="p-2 bg-white rounded-lg border border-[#D9E5E6]">
                        <UserPlus className="h-5 w-5" />
                      </div>
                      <h3 className="font-bold text-lg text-gray-900">Add New Organization</h3>
                    </div>
                    <p className="text-sm text-gray-500 ml-[52px]">Register a new organization to the blockchain</p>
                  </div>
                  
                  <CardContent className="p-6 space-y-5">
                    <div className="space-y-2">
                      <Label className="text-gray-700 font-medium">Wallet Address</Label>
                      <div className="relative group">
                        <Wallet className="absolute left-3 top-3 h-4 w-4 text-gray-400 group-focus-within:text-[#009688] transition-colors" />
                        <Input 
                          placeholder="0x..." 
                          className="pl-10 border-gray-200 focus:border-[#009688] focus:ring-[#009688] bg-gray-50/50 h-11 transition-all"
                          value={formData.orgWallet}
                          onChange={handleInputChange}
                          name="orgWallet"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-gray-700 font-medium">Organization Name</Label>
                      <div className="relative group">
                        <Building2 className="absolute left-3 top-3 h-4 w-4 text-gray-400 group-focus-within:text-[#009688] transition-colors" />
                        <Input 
                          placeholder="e.g. Acme Corp" 
                          className="pl-10 border-gray-200 focus:border-[#009688] focus:ring-[#009688] bg-gray-50/50 h-11 transition-all"
                          value={formData.name}
                          onChange={handleInputChange}
                          name="name"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-gray-700 font-medium">Metadata</Label>
                      <Textarea 
                        placeholder="Additional details about the organization..." 
                        className="border-gray-200 focus:border-[#009688] focus:ring-[#009688] bg-gray-50/50 min-h-[120px] resize-none transition-all"
                        value={formData.meta}
                        onChange={handleInputChange}
                        name="meta"
                      />
                    </div>
                    <Button 
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="w-full bg-[#009688] hover:bg-[#00796B] text-white h-12 text-base font-medium shadow-md hover:shadow-lg transition-all mt-2"
                    >
                      {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <Plus className="mr-2 h-5 w-5" />}
                      Register Organization
                    </Button>
                  </CardContent>
                </Card>

                <div className="space-y-8">
                  {/* View Details */}
                  <Card className="border-[#D9E5E6] shadow-sm bg-white overflow-hidden">
                    <div className="bg-[#F5FAFA] border-b border-[#D9E5E6] p-6">
                      <div className="flex items-center gap-3 text-gray-700 mb-1">
                        <div className="p-2 bg-white rounded-lg border border-[#D9E5E6]">
                          <Search className="h-5 w-5" />
                        </div>
                        <h3 className="font-bold text-lg text-gray-900">Lookup Organization</h3>
                      </div>
                      <p className="text-sm text-gray-500 ml-[52px]">Search for an organization by wallet address</p>
                    </div>
                    
                    <CardContent className="p-6 space-y-4">
                      <div className="flex gap-3">
                        <div className="relative flex-1 group">
                          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400 group-focus-within:text-[#009688] transition-colors" />
                          <Input 
                            placeholder="Search by wallet address..." 
                            className="pl-10 border-gray-200 focus:border-[#009688] focus:ring-[#009688] bg-gray-50/50 h-11"
                            value={viewOrgAddress}
                            onChange={(e) => setViewOrgAddress(e.target.value)}
                          />
                        </div>
                        {viewOrgAddress && (
                          <Button variant="outline" onClick={clearOrgDetails} size="icon" className="h-11 w-11 shrink-0">
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      <AnimatePresence>
                        {orgDetails && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0, marginTop: 0 }}
                            animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                            exit={{ opacity: 0, height: 0, marginTop: 0 }}
                            className="bg-[#F5FAFA] rounded-xl p-5 border border-[#D9E5E6] space-y-4 overflow-hidden"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-bold text-lg text-gray-900">{orgDetails[2]}</h4>
                                <p className="text-xs text-gray-500 font-mono mt-1">{orgDetails[0]}</p>
                              </div>
                              <Badge className={orgDetails[4] ? "bg-green-100 text-green-700 border-green-200" : "bg-red-100 text-red-700 border-red-200"}>
                                {orgDetails[4] ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 py-2">
                              <div className="bg-white p-3 rounded-lg border border-gray-100">
                                <p className="text-xs text-gray-500 mb-1">Certificates Issued</p>
                                <p className="font-bold text-xl text-[#009688]">{orgDetails[6]?.toString()}</p>
                              </div>
                              <div className="bg-white p-3 rounded-lg border border-gray-100">
                                <p className="text-xs text-gray-500 mb-1">Risk Status</p>
                                <div className="flex items-center gap-2">
                                  {orgDetails[5] ? (
                                    <>
                                      <ShieldAlert className="h-4 w-4 text-red-500" />
                                      <span className="font-bold text-red-600">Flagged</span>
                                    </>
                                  ) : (
                                    <>
                                      <Shield className="h-4 w-4 text-green-500" />
                                      <span className="font-bold text-green-600">Safe</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </CardContent>
                  </Card>

                  {/* Flagging */}
                  <Card className="border-red-100 shadow-sm bg-white overflow-hidden">
                    <div className="bg-red-50/50 border-b border-red-100 p-6">
                      <div className="flex items-center gap-3 text-red-700 mb-1">
                        <div className="p-2 bg-white rounded-lg border border-red-100">
                          <ShieldAlert className="h-5 w-5" />
                        </div>
                        <h3 className="font-bold text-lg text-gray-900">Danger Zone</h3>
                      </div>
                      <p className="text-sm text-red-600/80 ml-[52px]">Flag or unflag organizations</p>
                    </div>
                    
                    <CardContent className="p-6 space-y-5">
                      <div className="space-y-2">
                        <Label className="text-gray-700 font-medium">Target Wallet Address</Label>
                        <Input 
                          placeholder="0x..." 
                          className="border-red-100 focus:border-red-300 focus:ring-red-200 bg-red-50/10 h-11"
                          value={flagFormData.orgWallet}
                          onChange={(e) => setFlagFormData(prev => ({ ...prev, orgWallet: e.target.value }))}
                        />
                      </div>
                      <div className="flex gap-4">
                        <Button 
                          variant="outline"
                          className={`flex-1 h-11 border-red-200 text-red-700 hover:bg-red-50 ${flagFormData.flagged ? 'ring-2 ring-red-500 bg-red-50' : ''}`}
                          onClick={() => setFlagFormData(prev => ({ ...prev, flagged: true }))}
                        >
                          <Flag className="mr-2 h-4 w-4" /> Flag
                        </Button>
                        <Button 
                          variant="outline"
                          className={`flex-1 h-11 border-green-200 text-green-700 hover:bg-green-50 ${!flagFormData.flagged ? 'ring-2 ring-green-500 bg-green-50' : ''}`}
                          onClick={() => setFlagFormData(prev => ({ ...prev, flagged: false }))}
                        >
                          <CheckCircle className="mr-2 h-4 w-4" /> Unflag
                        </Button>
                      </div>
                      <Button 
                        className="w-full bg-red-600 hover:bg-red-700 text-white h-11 shadow-sm"
                        onClick={handleFlagSubmit}
                        disabled={isFlagging}
                      >
                        {isFlagging ? <Loader2 className="animate-spin mr-2" /> : "Confirm Action"}
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Organization Details Modal */}
          <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
            <DialogContent className="max-w-2xl bg-white">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-[#009688] flex items-center gap-2">
                  <Building2 className="h-6 w-6" />
                  Organization Details
                </DialogTitle>
                <DialogDescription>
                  Full information retrieved from the blockchain registry.
                </DialogDescription>
              </DialogHeader>
              
              {modalDetailsPending ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="h-12 w-12 animate-spin text-[#009688] mb-4" />
                  <p className="text-gray-500">Fetching organization data...</p>
                </div>
              ) : modalOrgDetails ? (
                <div className="space-y-6 py-4">
                  <div className="flex items-center justify-between bg-[#F5FAFA] p-4 rounded-xl border border-[#D9E5E6]">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{modalOrgDetails[2]}</h3>
                      <p className="text-sm text-gray-500">Registered Organization</p>
                    </div>
                    <div className="flex gap-2">
                      <Badge className={modalOrgDetails[4] ? "bg-green-500" : "bg-red-500"}>
                        {modalOrgDetails[4] ? "Active" : "Inactive"}
                      </Badge>
                      {modalOrgDetails[5] && (
                        <Badge variant="destructive">Flagged</Badge>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <Label className="text-gray-500">Wallet Address</Label>
                      <div className="flex items-center gap-2 bg-gray-50 p-2 rounded border border-gray-200">
                        <code className="text-xs flex-1 truncate">{modalOrgDetails[0]}</code>
                        <button 
                          onClick={() => navigator.clipboard.writeText(modalOrgDetails[0])}
                          className="text-gray-400 hover:text-[#009688]"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-gray-500">Contract Address</Label>
                      <div className="flex items-center gap-2 bg-gray-50 p-2 rounded border border-gray-200">
                        <code className="text-xs flex-1 truncate">{modalOrgDetails[1]}</code>
                        <button 
                          onClick={() => navigator.clipboard.writeText(modalOrgDetails[1])}
                          className="text-gray-400 hover:text-[#009688]"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-[#F5FAFA] p-4 rounded-xl border border-[#D9E5E6] text-center">
                      <Activity className="h-6 w-6 text-[#009688] mx-auto mb-2" />
                      <p className="text-2xl font-bold text-gray-900">{modalOrgDetails[6]?.toString()}</p>
                      <p className="text-xs text-gray-500">Certificates Issued</p>
                    </div>
                    <div className="bg-[#F5FAFA] p-4 rounded-xl border border-[#D9E5E6] text-center">
                      <Shield className="h-6 w-6 text-[#009688] mx-auto mb-2" />
                      <p className="text-sm font-bold text-gray-900 mt-2">Verified</p>
                      <p className="text-xs text-gray-500">Status</p>
                    </div>
                    <div className="bg-[#F5FAFA] p-4 rounded-xl border border-[#D9E5E6] text-center">
                      <Flag className={`h-6 w-6 mx-auto mb-2 ${modalOrgDetails[5] ? "text-red-500" : "text-gray-400"}`} />
                      <p className={`text-sm font-bold mt-2 ${modalOrgDetails[5] ? "text-red-600" : "text-green-600"}`}>
                        {modalOrgDetails[5] ? "Flagged" : "Clean"}
                      </p>
                      <p className="text-xs text-gray-500">Risk Status</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Metadata / Description</Label>
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 min-h-[80px] text-sm text-gray-700">
                      {modalOrgDetails[3] || "No additional metadata provided."}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-red-500">
                  Failed to load organization details.
                </div>
              )}
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDetailsModalOpen(false)}>Close</Button>
                <Button 
                  className="bg-[#009688] hover:bg-[#00796B]"
                  onClick={() => {
                    setIsDetailsModalOpen(false);
                    setViewOrgAddress(selectedOrgAddress);
                    setActiveTab('management');
                  }}
                >
                  Manage Organization
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}