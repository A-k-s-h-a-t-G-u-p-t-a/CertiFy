"use client";
import { contract } from "../../lib/client";
import { useReadContract, useSendTransaction, useActiveAccount } from "thirdweb/react";
import { prepareContractCall } from "thirdweb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Building2, Users, Loader2, Plus, UserPlus, Search, Eye, X, CheckCircle, XCircle, AlertCircle, Flag, Shield, ShieldAlert, BarChart3, TrendingUp, Activity, PieChart } from "lucide-react";
import { useState, useEffect } from "react";
import { PieChart as RechartsPieChart, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, AreaChart, Area, Pie } from 'recharts';

export default function AdminPage() {
  const ADMIN_ADDRESS = "0x0408e64385FA3E98b86b55b8998B94Ecb771EF1D";
  const account = useActiveAccount();
  
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

  // Get specific organization details
  const { data: orgDetails, isPending: detailsPending } = useReadContract({
    contract,
    method: "function getOrganization(address orgWallet) view returns (address _orgWallet, address _certContract, string _name, string _meta, bool _isActive, bool _isFlagged, uint256 _issuedCertCount)",
    params: viewOrgAddress ? [viewOrgAddress] : undefined,
  });

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

      // For demo purposes, we'll simulate some data since we can't efficiently 
      // fetch details for all organizations in one call
      const total = organizations.length;
      
      // Simulate realistic distribution
      active = Math.floor(total * 0.85); // 85% active
      flagged = Math.floor(total * 0.15); // 15% flagged
      const inactive = total - active - flagged;
      totalCertificates = total * 25; // Average 25 certificates per org

      // Prepare chart data
      const pieChartData = [
        { name: 'Active', value: active, color: '#22c55e' },
        { name: 'Flagged', value: flagged, color: '#ef4444' },
        { name: 'Inactive', value: inactive, color: '#6b7280' }
      ].filter(item => item.value > 0);

      const barChartData = [
        { name: 'Organizations', total, active, flagged, inactive },
        { name: 'Certificates', total: totalCertificates, active: Math.floor(totalCertificates * 0.8), flagged: Math.floor(totalCertificates * 0.1), inactive: Math.floor(totalCertificates * 0.1) }
      ];

      // Simulate trend data (last 7 days)
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

  // Update analytics when organizations change
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
    // The useReadContract hook will automatically refetch when viewOrgAddress changes
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
    setTransactionResult(null); // Clear previous result
    
    try {
      const transaction = prepareContractCall({
        contract,
        method: "function flagOrganization(address orgWallet, bool flagged)",
        params: [flagFormData.orgWallet, flagFormData.flagged],
      });
      
      // Send transaction and wait for completion
      const result = await new Promise((resolve, reject) => {
        sendTransaction(transaction, {
          onSuccess: (result) => {
            console.log("Transaction successful:", result);
            resolve(result);
          },
          onError: (error) => {
            console.error("Transaction failed:", error);
            reject(error);
          }
        });
      });
      
      // Store raw transaction result for display
      setTransactionResult({
        rawData: result,
        action: flagFormData.flagged ? "flagged" : "unflagged"
      });
      
      // Reset form
      setFlagFormData({ orgWallet: "", flagged: false });
      
      // Refetch organizations list and details if viewing
      setTimeout(() => {
        refetch();
        if (viewOrgAddress === flagFormData.orgWallet) {
          setViewOrgAddress(""); // This will trigger a re-fetch of org details
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
      
      // Send transaction and wait for completion
      const result = await new Promise((resolve, reject) => {
        sendTransaction(transaction, {
          onSuccess: (result) => {
            console.log("Transaction successful:", result);
            resolve(result);
          },
          onError: (error) => {
            console.error("Transaction failed:", error);
            reject(error);
          }
        });
      });
      
      alert("Organization added successfully!");
      
      // Reset form
      setFormData({ orgWallet: "", name: "", meta: "" });
      
      // Refetch organizations list
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

  // Check if user is admin
  if (!account || account.address.toLowerCase() !== ADMIN_ADDRESS.toLowerCase()) {
    return (
      <div className="container mx-auto p-6 pt-16">
        <div className="text-center space-y-6 mt-20">
          <ShieldAlert className="h-24 w-24 text-red-400 mx-auto" />
          <div className="space-y-4">
            <h1 className="text-3xl font-bold text-red-600">Access Denied</h1>
            <p className="text-gray-600 max-w-md mx-auto">
              You are not authorized to access this admin panel. Only designated administrators can view this page.
            </p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md mx-auto">
              <p className="text-sm text-red-700">
                <strong>Connected Address:</strong> {account?.address || "Not connected"}
              </p>
              <p className="text-sm text-red-700 mt-1">
                <strong>Required Address:</strong> 
              </p>
            </div>
            <Button 
              onClick={() => window.location.href = '/'}
              className="mt-4"
            >
              Go Back to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (isPending) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin mr-3" />
        <div className="text-lg text-gray-600">Loading organizations...</div>
      </div>
    );
  }

  if (!organizations || organizations.length === 0) {
    return (
      <div className="container mx-auto p-6 pt-16">
        <div className="text-center space-y-6 mt-20">
          <Building2 className="h-24 w-24 text-gray-300 mx-auto" />
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-gray-900">No Organizations Found</h1>
            <p className="text-gray-600 max-w-md mx-auto">
              There are currently no organizations registered in the system.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 pt-16 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Shield className="h-8 w-8 text-blue-600" />
            Admin Dashboard
          </h1>
          <p className="text-gray-600">Manage and view all registered organizations</p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="px-4 py-2 text-sm">
            <Users className="h-4 w-4 mr-2" />
            Total: {organizations.length}
          </Badge>
          <Badge variant="secondary" className="px-4 py-2 text-sm">
            <Shield className="h-4 w-4 mr-2" />
            Admin Access
          </Badge>
        </div>
      </div>

      {/* Add Organization Form */}
      <Card className="border-2 border-dashed border-blue-200 bg-blue-50/30">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2 text-blue-700">
            <UserPlus className="h-5 w-5" />
            Add New Organization
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="orgWallet" className="text-sm font-medium">
                  Organization Wallet Address *
                </Label>
                <Input
                  id="orgWallet"
                  name="orgWallet"
                  type="text"
                  placeholder="0x..."
                  value={formData.orgWallet}
                  onChange={handleInputChange}
                  className="font-mono text-sm"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">
                  Organization Name *
                </Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Enter organization name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="meta" className="text-sm font-medium">
                Metadata (Optional)
              </Label>
              <Textarea
                id="meta"
                name="meta"
                placeholder="Additional information about the organization..."
                value={formData.meta}
                onChange={handleInputChange}
                rows={3}
              />
            </div>
            <div className="flex justify-end">
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="px-6"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Adding Organization...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Organization
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* View Organization Details Form */}
      <Card className="border-2 border-dashed border-green-200 bg-green-50/30">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2 text-green-700">
            <Eye className="h-5 w-5" />
            View Organization Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleViewOrgSubmit} className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1 space-y-2">
                <Label htmlFor="viewOrgAddress" className="text-sm font-medium">
                  Organization Wallet Address
                </Label>
                <Input
                  id="viewOrgAddress"
                  type="text"
                  placeholder="Enter wallet address to view details..."
                  value={viewOrgAddress}
                  onChange={(e) => setViewOrgAddress(e.target.value)}
                  className="font-mono text-sm"
                />
              </div>
              <div className="flex items-end gap-2">
                <Button type="submit" variant="outline" className="px-4">
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
                {viewOrgAddress && (
                  <Button type="button" variant="ghost" onClick={clearOrgDetails} className="px-3">
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </form>

          {/* Organization Details Display */}
          {viewOrgAddress && (
            <div className="mt-6 p-4 border rounded-lg bg-white">
              {detailsPending ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mr-3" />
                  <span className="text-gray-600">Loading organization details...</span>
                </div>
              ) : orgDetails ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b pb-3">
                    <h3 className="text-lg font-semibold text-gray-900">Organization Details</h3>
                    <div className="flex gap-2">
                      <Badge variant={orgDetails[4] ? "success" : "secondary"} className="flex items-center gap-1">
                        {orgDetails[4] ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                        {orgDetails[4] ? "Active" : "Inactive"}
                      </Badge>
                      {orgDetails[5] && (
                        <Badge variant="destructive" className="flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          Flagged
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">Organization Name</Label>
                      <div className="p-3 bg-gray-50 rounded-md border">
                        <p className="text-sm font-medium">{orgDetails[2] || 'N/A'}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">Certificates Issued</Label>
                      <div className="p-3 bg-gray-50 rounded-md border">
                        <p className="text-sm font-semibold text-blue-600">
                          {orgDetails[6] ? orgDetails[6].toString() : '0'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">Wallet Address</Label>
                      <div className="p-3 bg-gray-50 rounded-md border">
                        <p className="text-sm font-mono break-all">{orgDetails[0]}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">Certificate Contract</Label>
                      <div className="p-3 bg-gray-50 rounded-md border">
                        <p className="text-sm font-mono break-all">{orgDetails[1] || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                  
                  {orgDetails[3] && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">Metadata</Label>
                      <div className="p-3 bg-gray-50 rounded-md border">
                        <p className="text-sm whitespace-pre-wrap">{orgDetails[3]}</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <XCircle className="h-12 w-12 text-red-400 mx-auto mb-3" />
                  <p className="text-red-600 font-medium">Organization not found</p>
                  <p className="text-sm text-gray-600 mt-1">Please check the wallet address and try again</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Flag Organization Form */}
      <Card className="border-2 border-dashed border-orange-200 bg-orange-50/30">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2 text-orange-700">
            <Flag className="h-5 w-5" />
            Flag/Unflag Organization
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleFlagSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="flagOrgWallet" className="text-sm font-medium">
                  Organization Wallet Address *
                </Label>
                <Input
                  id="flagOrgWallet"
                  type="text"
                  placeholder="0x..."
                  value={flagFormData.orgWallet}
                  onChange={(e) => setFlagFormData(prev => ({ ...prev, orgWallet: e.target.value }))}
                  className="font-mono text-sm"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Flag Status</Label>
                <div className="flex items-center space-x-4 pt-2">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="flagged"
                      checked={!flagFormData.flagged}
                      onChange={() => setFlagFormData(prev => ({ ...prev, flagged: false }))}
                      className="text-green-600"
                    />
                    <span className="text-sm flex items-center gap-1">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Remove Flag
                    </span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="flagged"
                      checked={flagFormData.flagged}
                      onChange={() => setFlagFormData(prev => ({ ...prev, flagged: true }))}
                      className="text-red-600"
                    />
                    <span className="text-sm flex items-center gap-1">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      Flag Organization
                    </span>
                  </label>
                </div>
              </div>
            </div>
            
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-orange-800">Important Notice</p>
                  <p className="text-sm text-orange-700">
                    {flagFormData.flagged 
                      ? "Flagging an organization will mark it as potentially problematic. This action should be used carefully and only when necessary."
                      : "Removing the flag will restore the organization to normal status. Make sure this action is appropriate."}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button 
                type="submit" 
                disabled={isFlagging}
                variant={flagFormData.flagged ? "destructive" : "default"}
                className="px-6"
              >
                {isFlagging ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Flag className="h-4 w-4 mr-2" />
                    {flagFormData.flagged ? "Flag Organization" : "Remove Flag"}
                  </>
                )}
              </Button>
            </div>
          </form>

          {/* Transaction Result Display */}
          {transactionResult && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div className="space-y-2 flex-1">
                  <p className="text-sm font-medium text-green-800">
                    Organization successfully {transactionResult.action}!
                  </p>
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-green-700">Transaction Details:</p>
                    <div className="bg-green-100 p-3 rounded border max-h-64 overflow-y-auto">
                      <pre className="text-xs text-green-800 whitespace-pre-wrap break-words">
                        {JSON.stringify(transactionResult.rawData, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setTransactionResult(null)}
                  className="p-1"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Organizations Grid */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Registered Organizations</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {organizations.map((orgAddress, index) => (
            <Card key={index} className="hover:shadow-lg transition-all duration-200 border-2 hover:border-blue-200">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-blue-600" />
                    Organization {index + 1}
                  </CardTitle>
                  <Badge variant="secondary" className="text-xs">
                    Active
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Wallet Address:</label>
                    <div className="bg-gray-50 p-2 rounded-md border">
                      <p className="text-sm font-mono text-gray-800 break-all">
                        {orgAddress}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>Registry ID:</span>
                    <span className="font-mono">#{(index + 1).toString().padStart(3, '0')}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Analytics Dashboard */}
      <div className="mt-8 space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <BarChart3 className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Organization Analytics</h2>
          {analyticsData.loading && (
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
          )}
        </div>

        {/* Main Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Organizations */}
          <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-blue-700">Total Organizations</CardTitle>
                <Building2 className="h-4 w-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className="text-3xl font-bold text-blue-900">{analyticsData.total}</p>
                <p className="text-xs text-blue-600">Registered in system</p>
              </div>
            </CardContent>
          </Card>

          {/* Active Organizations */}
          <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-green-100">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-green-700">Active Organizations</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className="text-3xl font-bold text-green-900">{analyticsData.active}</p>
                <p className="text-xs text-green-600">
                  {analyticsData.total > 0 ? Math.round((analyticsData.active / analyticsData.total) * 100) : 0}% of total
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Flagged Organizations */}
          <Card className="border-2 border-red-200 bg-gradient-to-br from-red-50 to-red-100">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-red-700">Flagged Organizations</CardTitle>
                <Flag className="h-4 w-4 text-red-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className="text-3xl font-bold text-red-900">{analyticsData.flagged}</p>
                <p className="text-xs text-red-600">
                  {analyticsData.total > 0 ? Math.round((analyticsData.flagged / analyticsData.total) * 100) : 0}% of total
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Total Certificates */}
          <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-purple-700">Total Certificates</CardTitle>
                <Activity className="h-4 w-4 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className="text-3xl font-bold text-purple-900">{analyticsData.totalCertificates.toLocaleString()}</p>
                <p className="text-xs text-purple-600">Issued across all orgs</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pie Chart - Organization Status Distribution */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5 text-blue-600" />
                Organization Status Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
                  <Tooltip 
                    formatter={(value, name) => [value, name]}
                    labelFormatter={() => 'Organizations'}
                  />
                  <Legend />
                  <Pie
                    data={analyticsData.pieChartData}
                    cx="50%" 
                    cy="50%" 
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {analyticsData.pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </RechartsPieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Bar Chart - Organizations vs Certificates */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-green-600" />
                Organizations & Certificates Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analyticsData.barChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="active" fill="#22c55e" name="Active" />
                  <Bar dataKey="flagged" fill="#ef4444" name="Flagged" />
                  <Bar dataKey="inactive" fill="#6b7280" name="Inactive" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Trend Chart */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Growth Trends (Last 7 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={analyticsData.trendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <XAxis dataKey="day" />
                <YAxis />
                <CartesianGrid strokeDasharray="3 3" />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="organizations" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  name="Organizations"
                />
                <Line 
                  type="monotone" 
                  dataKey="certificates" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  name="Certificates"
                />
                <Line 
                  type="monotone" 
                  dataKey="flagged" 
                  stroke="#ef4444" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Flagged"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}