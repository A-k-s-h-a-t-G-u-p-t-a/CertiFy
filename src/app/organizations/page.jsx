"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { 
  Users, 
  TrendingUp, 
  Award, 
  Building2, 
  FileText, 
  Upload,
  Shield,
  CheckCircle,
  BookOpen,
  Database,
  Loader2,
  AlertCircle,
  RefreshCw,
  Eye,
  Bell,
  Link as LinkIcon,
  X
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function OrganizationDashboard() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [orgData, setOrgData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Alerts state
  const [alerts, setAlerts] = useState([]);
  const [alertsLoading, setAlertsLoading] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [uploadingAlert, setUploadingAlert] = useState(null);

  // Fetch organization data
  useEffect(() => {
    const fetchOrgData = async () => {
      if (status === "loading") return;
      
      if (!session?.user) {
        setError("Please log in to view organization details");
        setLoading(false);
        return;
      }

      if (session.user.role !== "organisation") {
        setError("Access denied. This page is for organizations only.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const response = await fetch("/api/organizations/me");
        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.error || "Failed to fetch organization data");
        }

        setOrgData(result);
      } catch (err) {
        console.error("Error fetching organization data:", err);
        setError(err.message || "Failed to load organization data");
      } finally {
        setLoading(false);
      }
    };

    fetchOrgData();
  }, [session, status]);

  // Fetch alerts for the organization
  useEffect(() => {
    const fetchAlerts = async () => {
      if (!session?.user?.name || session.user.role !== "organisation") return;
      
      try {
        setAlertsLoading(true);
        const response = await fetch(`/api/alerts/organization/${encodeURIComponent(session.user.name)}`);
        const result = await response.json();
        
        if (response.ok && result.success) {
          setAlerts(result.alerts || []);
        }
      } catch (err) {
        console.error("Error fetching alerts:", err);
      } finally {
        setAlertsLoading(false);
      }
    };

    fetchAlerts();
  }, [session]);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin");
    }
  }, [status, router]);

  // Handle upload to chain button
  const handleUploadToChain = async (alertId) => {
    try {
      setUploadingAlert(alertId);
      
      // Update alert status to completed
      const response = await fetch(`/api/alerts/${alertId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completed" }),
      });

      if (!response.ok) {
        throw new Error("Failed to update alert status");
      }

      // Remove alert from the list
      setAlerts(alerts.filter(alert => alert.id !== alertId));
      
      // Close dialog if this alert was open
      if (selectedAlert?.id === alertId) {
        setDetailDialogOpen(false);
        setSelectedAlert(null);
      }

      // TODO: Add blockchain upload functionality here
      alert("Certificate uploaded to blockchain successfully! (Blockchain integration pending)");
    } catch (err) {
      console.error("Error uploading to chain:", err);
      alert("Failed to upload certificate. Please try again.");
    } finally {
      setUploadingAlert(null);
    }
  };

  // Open detail dialog
  const viewAlertDetails = (alert) => {
    setSelectedAlert(alert);
    setDetailDialogOpen(true);
  };

  // Get tampered fields
  const getTamperedFields = (alert) => {
    if (!alert.comparisonData?.mismatched_fields) return [];
    return alert.comparisonData.mismatched_fields;
  };

  // Loading state
  if (loading || status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center">
        <Card className="w-full max-w-md shadow-2xl">
          <CardContent className="flex flex-col items-center justify-center p-12">
            <Loader2 className="h-12 w-12 text-green-600 animate-spin mb-4" />
            <p className="text-lg text-gray-700 font-medium">Loading organization details...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl shadow-2xl">
          <CardContent className="p-8">
            <div className="flex flex-col items-center text-center space-y-4">
              <AlertCircle className="h-16 w-16 text-red-500" />
              <h2 className="text-2xl font-bold text-gray-900">Error Loading Data</h2>
              <p className="text-gray-600 text-lg">{error}</p>
              <div className="flex gap-4 mt-6 w-full">
                <Button 
                  onClick={() => window.location.reload()} 
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
                <Button 
                  onClick={() => router.push("/")} 
                  variant="outline" 
                  className="flex-1"
                >
                  Go Home
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // No data state
  if (!orgData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center">
        <Card className="w-full max-w-md shadow-2xl">
          <CardContent className="flex flex-col items-center justify-center p-12">
            <AlertCircle className="h-12 w-12 text-yellow-600 mb-4" />
            <p className="text-lg text-gray-700">No organization data found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { organization, statistics, certificates = [], chartData = [] } = orgData;
  const establishedYear = organization.established || new Date(organization.createdAt).getFullYear();
  const yearsOfExcellence = new Date().getFullYear() - establishedYear;

  const stats = [
    { 
      title: "Academic Programs", 
      value: statistics.totalCourses.toString(), 
      icon: <BookOpen className="h-6 w-6" />,
      description: "Available courses",
      color: "from-green-500 to-emerald-500"
    },
    { 
      title: "Total Certificates", 
      value: statistics.totalCertificates.toLocaleString(), 
      icon: <Award className="h-6 w-6" />,
      description: "All time issued",
      color: "from-purple-500 to-pink-500"
    },
    { 
      title: "Issued Count", 
      value: statistics.issuedCertCount.toString(), 
      icon: <FileText className="h-6 w-6" />,
      description: "Recorded count",
      color: "from-blue-500 to-cyan-500"
    },
    { 
      title: "Years Active", 
      value: yearsOfExcellence.toString(), 
      icon: <Shield className="h-6 w-6" />,
      description: `Since ${establishedYear}`,
      color: "from-orange-500 to-red-500"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      {/* Hero Section */}
      <section className="relative py-20 px-4 pt-24">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-gradient-to-br from-green-600 to-emerald-700 rounded-full shadow-2xl">
                <Building2 className="h-12 w-12 text-white" />
              </div>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent mb-4">
              {organization.name}
            </h1>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto mb-4">
              {organization.metadata || `Established ${establishedYear}`}
            </p>
            <div className="flex justify-center gap-3 flex-wrap">
              <Badge className="bg-green-100 text-green-800 border border-green-300 px-4 py-2">
                <Shield className="h-4 w-4 mr-2" />
                Blockchain Verified Institution
              </Badge>
              {organization.isActive && (
                <Badge className="bg-blue-100 text-blue-800 border border-blue-300 px-4 py-2">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Active
                </Badge>
              )}
              {organization.walletAddress && (
                <Badge className="bg-purple-100 text-purple-800 border border-purple-300 px-4 py-2 font-mono text-xs">
                  {organization.walletAddress.slice(0, 6)}...{organization.walletAddress.slice(-4)}
                </Badge>
              )}
            </div>
          </motion.div>

          {/* Stats Cards */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ y: -5 }}
              >
                <Card className="bg-white/80 backdrop-blur-sm border-2 border-white/50 shadow-xl hover:shadow-2xl transition-all duration-300 group">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium text-gray-700">{stat.title}</CardTitle>
                      <div className={`p-2 bg-gradient-to-br ${stat.color} rounded-lg text-white group-hover:scale-110 transition-transform duration-300`}>
                        {stat.icon}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
                    <p className="text-sm text-gray-600">{stat.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 space-y-8 pb-20">
        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <Card className="bg-white/80 backdrop-blur-sm border-2 border-white/50 shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl text-gray-900 flex items-center gap-3">
                <Database className="h-6 w-6 text-green-600" />
                Quick Actions
              </CardTitle>
              <CardDescription className="text-gray-600 text-lg">
                Manage certificates and upload new documents for blockchain verification
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={() => router.push("/upload")}
                size="lg"
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 py-3 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
              >
                <Upload className="h-5 w-5 mr-2" />
                Upload Documents
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => router.push("/certificate-generator")}
                className="border-2 border-green-600 text-green-600 hover:bg-green-600 hover:text-white px-8 py-3 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
              >
                <FileText className="h-5 w-5 mr-2" />
                Certificate Playground
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => router.push("/verifier2")}
                className="border-2 border-purple-600 text-purple-600 hover:bg-purple-600 hover:text-white px-8 py-3 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
              >
                <Shield className="h-5 w-5 mr-2" />
                Verify Certificate
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Certificates Table */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <Card className="bg-white/80 backdrop-blur-sm border-2 border-white/50 shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl text-gray-900 flex items-center gap-3">
                <Award className="h-6 w-6 text-green-600" />
                Certificate Records
              </CardTitle>
              <CardDescription className="text-gray-600 text-lg">
                Complete list of blockchain-verified certificates issued by {organization.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border-2 border-white/50 overflow-hidden shadow-inner">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-green-50 to-emerald-50 border-b-2 border-green-100">
                      <TableHead className="text-gray-800 font-semibold py-4">Certificate ID</TableHead>
                      <TableHead className="text-gray-800 font-semibold">Student Name</TableHead>
                      <TableHead className="text-gray-800 font-semibold">Course Name</TableHead>
                      <TableHead className="text-gray-800 font-semibold">APAAR ID</TableHead>
                      <TableHead className="text-gray-800 font-semibold">Year</TableHead>
                      <TableHead className="text-gray-800 font-semibold">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {certificates.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-12 text-gray-500">
                          <Award className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                          <p className="text-lg font-medium">No certificates issued yet</p>
                          <p className="text-sm mt-1">Start by uploading or generating certificates</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      certificates.map((cert, index) => (
                        <TableRow
                          key={cert.id}
                          className={`hover:bg-green-50 transition-colors duration-200 ${
                            index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                          }`}
                        >
                          <TableCell className="font-mono text-sm text-blue-600 font-medium py-4">
                            {cert.certificateId}
                          </TableCell>
                          <TableCell className="font-medium text-gray-900">{cert.name}</TableCell>
                          <TableCell className="text-gray-700 max-w-xs">
                            <span className="line-clamp-2">{cert.courseName || cert.nqrCode || "N/A"}</span>
                          </TableCell>
                          <TableCell className="font-mono text-sm text-gray-600">
                            {cert.apaarId || "N/A"}
                          </TableCell>
                          <TableCell className="text-gray-700">
                            {cert.year ? (
                              <Badge variant="secondary" className="bg-green-100 text-green-800 border border-green-300">
                                {cert.year}
                              </Badge>
                            ) : (
                              <span className="text-gray-400">N/A</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <Badge className="bg-green-100 text-green-800 border border-green-300">
                                {cert.status}
                              </Badge>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Analytics Chart */}
        {chartData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            <Card className="bg-white/80 backdrop-blur-sm border-2 border-white/50 shadow-xl">
              <CardHeader>
                <CardTitle className="text-2xl text-gray-900 flex items-center gap-3">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                  Certificate Issuance Analytics
                </CardTitle>
                <CardDescription className="text-gray-600 text-lg">
                  Track certificate issuance trends and institutional growth over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                      <XAxis 
                        dataKey="year" 
                        stroke="#6b7280" 
                        fontSize={12} 
                        tickLine={{ stroke: '#6b7280' }}
                      />
                      <YAxis 
                        stroke="#6b7280" 
                        fontSize={12}
                        tickLine={{ stroke: '#6b7280' }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "white",
                          border: "2px solid #10b981",
                          borderRadius: "12px",
                          color: "#374151",
                          boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)"
                        }}
                        labelStyle={{ color: "#374151", fontWeight: "600" }}
                      />
                      <Line
                        type="monotone"
                        dataKey="count"
                        stroke="#10b981"
                        strokeWidth={4}
                        dot={{ fill: "#10b981", strokeWidth: 3, r: 6 }}
                        activeDot={{ r: 8, fill: "#059669", strokeWidth: 2, stroke: "#ffffff" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Alerts Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="col-span-1 lg:col-span-2"
        >
          <Card className="bg-white/80 backdrop-blur-sm border-2 border-white/50 shadow-xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl text-gray-900 flex items-center gap-3">
                    <Bell className="h-6 w-6 text-green-600" />
                    Certificate Alerts
                  </CardTitle>
                  <CardDescription className="text-gray-600 text-lg mt-1">
                    Review pending verification requests
                  </CardDescription>
                </div>
                <Badge className="bg-green-100 text-green-800 border border-green-300 px-3 py-1">
                  {alerts.length} Pending
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {alertsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 text-green-600 animate-spin" />
                  <span className="ml-3 text-gray-600">Loading alerts...</span>
                </div>
              ) : alerts.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <p className="text-gray-600 text-lg">No pending alerts</p>
                  <p className="text-gray-500 text-sm mt-2">All certificates have been reviewed</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {alerts.map((alert, index) => (
                    <motion.div
                      key={alert.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-2 border-green-100 rounded-lg p-4 hover:shadow-md transition-all duration-200 bg-white hover:border-green-200"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-3">
                            <h3 className="font-semibold text-gray-900">
                              {alert.certificate?.name || "Unknown Certificate"}
                            </h3>
                            <Badge 
                              className={`
                                ${alert.tamperingScore > 0.5 
                                  ? 'bg-red-100 text-red-700 border-red-200' 
                                  : 'bg-green-100 text-green-700 border-green-200'}
                              `}
                            >
                              {alert.tamperingScore > 0.5 ? 'High Risk' : 'Verified'}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                            <div>
                              <p className="text-gray-500 text-xs mb-1">Similarity</p>
                              <p className="font-semibold text-green-700">
                                {(alert.similarityScore * 100).toFixed(1)}%
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-500 text-xs mb-1">Course</p>
                              <p className="font-medium text-gray-900 truncate">
                                {alert.certificate?.courseName || "N/A"}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-500 text-xs mb-1">Certificate ID</p>
                              <p className="font-mono text-sm text-gray-700">
                                {alert.certificate?.certificateId || "N/A"}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-500 text-xs mb-1">Date</p>
                              <p className="font-medium text-gray-700">
                                {new Date(alert.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2">
                          <Button
                            onClick={() => viewAlertDetails(alert)}
                            variant="outline"
                            size="sm"
                            className="border-green-300 text-green-700 hover:bg-green-50"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Details
                          </Button>
                          <Button
                            onClick={() => handleUploadToChain(alert.id)}
                            disabled={uploadingAlert === alert.id}
                            size="sm"
                            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                          >
                            {uploadingAlert === alert.id ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                Uploading
                              </>
                            ) : (
                              <>
                                <LinkIcon className="h-4 w-4 mr-1" />
                                Upload
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Alert Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Shield className="h-6 w-6 text-blue-600" />
              Certificate Analysis Details
            </DialogTitle>
            <DialogDescription>
              Comprehensive comparison and tampering detection results
            </DialogDescription>
          </DialogHeader>

          {selectedAlert && (
            <div className="space-y-6 mt-4">
              {/* Certificate Information */}
              <Card>
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                  <CardTitle className="text-lg">Certificate Information</CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Name</p>
                      <p className="font-semibold">{selectedAlert.certificate?.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Certificate ID</p>
                      <p className="font-semibold">{selectedAlert.certificate?.certificateId}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Course</p>
                      <p className="font-semibold">{selectedAlert.certificate?.courseName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Year</p>
                      <p className="font-semibold">{selectedAlert.certificate?.year || "N/A"}</p>
                    </div>
                    {selectedAlert.certificate?.apaarId && (
                      <div>
                        <p className="text-sm text-gray-500">APAAR ID</p>
                        <p className="font-semibold">{selectedAlert.certificate.apaarId}</p>
                      </div>
                    )}
                    {selectedAlert.certificate?.nqrCode && (
                      <div>
                        <p className="text-sm text-gray-500">NQR Code</p>
                        <p className="font-semibold">{selectedAlert.certificate.nqrCode}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Comparison Scores */}
              <Card>
                <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
                  <CardTitle className="text-lg">Comparison Scores</CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Similarity Score</p>
                      <p className="text-3xl font-bold text-blue-700">
                        {(selectedAlert.similarityScore * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Tampering Score</p>
                      <p className="text-3xl font-bold text-red-700">
                        {(selectedAlert.tamperingScore * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">CV Tampering</p>
                      <p className="text-3xl font-bold text-purple-700">
                        {(selectedAlert.cvTamperingScore * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">NLP Tampering</p>
                      <p className="text-3xl font-bold text-orange-700">
                        {(selectedAlert.nlpTamperingScore * 100).toFixed(1)}%
                      </p>
                    </div>
                    {selectedAlert.ssimScore && (
                      <div className="text-center p-4 bg-gradient-to-br from-teal-50 to-teal-100 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">SSIM Score</p>
                        <p className="text-3xl font-bold text-teal-700">
                          {(selectedAlert.ssimScore * 100).toFixed(1)}%
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Tampered Fields */}
              {getTamperedFields(selectedAlert).length > 0 && (
                <Card>
                  <CardHeader className="bg-gradient-to-r from-red-50 to-rose-50">
                    <CardTitle className="text-lg text-red-700 flex items-center gap-2">
                      <AlertCircle className="h-5 w-5" />
                      Potentially Tampered Fields
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="space-y-3">
                      {getTamperedFields(selectedAlert).map((field, idx) => (
                        <div key={idx} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="font-semibold text-red-900">{field}</p>
                          {selectedAlert.comparisonData?.field_comparison?.[field] && (
                            <div className="mt-2 text-sm">
                              <p className="text-gray-600">
                                <span className="font-medium">Database:</span>{" "}
                                {selectedAlert.comparisonData.field_comparison[field].db_value || "N/A"}
                              </p>
                              <p className="text-gray-600">
                                <span className="font-medium">Uploaded:</span>{" "}
                                {selectedAlert.comparisonData.field_comparison[field].uploaded_value || "N/A"}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Extracted Fields */}
              {selectedAlert.extractedFields && (
                <Card>
                  <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50">
                    <CardTitle className="text-lg">Extracted Fields (OCR)</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {Object.entries(selectedAlert.extractedFields).map(([key, value]) => (
                        <div key={key} className="p-3 bg-gray-50 rounded-lg">
                          <p className="text-gray-500 capitalize">{key}</p>
                          <p className="font-semibold text-gray-900">{value || "N/A"}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Upload Button */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  onClick={() => setDetailDialogOpen(false)}
                  variant="outline"
                >
                  Close
                </Button>
                <Button
                  onClick={() => handleUploadToChain(selectedAlert.id)}
                  disabled={uploadingAlert === selectedAlert.id}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {uploadingAlert === selectedAlert.id ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <LinkIcon className="h-4 w-4 mr-2" />
                      Upload to Blockchain
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
