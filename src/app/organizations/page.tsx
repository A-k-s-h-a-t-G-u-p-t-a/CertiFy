"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import {
  Users,
  GraduationCap,
  BookOpen,
  TrendingUp,
  Award,
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  Copy,
} from "lucide-react"
import { useState } from "react"

export default function AcademicDashboardPage() {
  const [copiedHash, setCopiedHash] = useState(false)

  // Mock data adapted to an academic / educational certificate verification platform
  const instituteData = {
    name: "Greenfield Polytechnic College",
    established: "1998",
    students: 3842,
    programmes: 24,
    verifiedPosts: 4820, // number of certificates posted (legacy + digital)
  }

  // Example blockchain verification transaction info for demonstration
  const txData = {
    hash: "0x9f3b2a7c1e4d8a4b6c2d5f7e8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7",
    certificateRef: "STU-2024-ENG-00123",
    status: "Anchored",
    lastUpdated: "2025-08-01 11:22:33 UTC",
  }

  // Student certificate records (legacy + digital)
  const certificateData = [
    {
      id: "STU-2024-ENG-00123",
      studentName: "Aisha Sharma",
      degree: "B.Tech (Computer Science)",
      rollNo: "GFPC/CS/2024/123",
      year: "2024",
      issuer: "Greenfield Polytechnic College",
      txHash: "0x9f3b2a7c1e4d8a4b6c2d5f7e8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7",
      status: "Verified",
    },
    {
      id: "STU-2023-MECH-00456",
      studentName: "Rohan Patel",
      degree: "Diploma (Mechanical)",
      rollNo: "GFPC/ME/2023/456",
      year: "2023",
      issuer: "Greenfield Polytechnic College",
      txHash: "",
      status: "Legacy (Pending Upload)",
    },
    {
      id: "STU-2022-CIV-00901",
      studentName: "Priya Nair",
      degree: "Diploma (Civil)",
      rollNo: "GFPC/CV/2022/901",
      year: "2022",
      issuer: "Greenfield Polytechnic College",
      txHash: "0x2b7a5d3c9f1e6a8b4c3d2e1f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4",
      status: "Verified",
    },
    {
      id: "STU-2021-ECE-00211",
      studentName: "Sonal Gupta",
      degree: "Diploma (Electronics)",
      rollNo: "GFPC/EC/2021/211",
      year: "2021",
      issuer: "Greenfield Polytechnic College",
      txHash: "",
      status: "Revoked",
    },
    {
      id: "STU-2024-CS-01005",
      studentName: "Vikram Singh",
      degree: "B.Tech (Computer Science)",
      rollNo: "GFPC/CS/2024/1005",
      year: "2024",
      issuer: "Greenfield Polytechnic College",
      txHash: "0xa7f6e5d4c3b2a1908f7e6d5c4b3a2910f8e7d6c5b4a39281706f5e4d3c2b1a0",
      status: "Verified",
    },
  ]

  // Monthly issuance / uploads for analytics
  const issuanceData = [
    { month: "Jan", issued: 120, verified: 110 },
    { month: "Feb", issued: 95, verified: 90 },
    { month: "Mar", issued: 130, verified: 125 },
    { month: "Apr", issued: 100, verified: 95 },
    { month: "May", issued: 140, verified: 135 },
    { month: "Jun", issued: 160, verified: 158 },
  ]

  // Verification status distribution
  const verificationDistribution = [
    { name: "Verified", value: 3500, color: "#0d9488" },
    { name: "Pending", value: 820, color: "#f59e0b" },
    { name: "Revoked", value: 120, color: "#ef4444" },
  ]

  const copyToClipboard = (text: string) => {
    if (!text) return
    navigator.clipboard.writeText(text)
    setCopiedHash(true)
    setTimeout(() => setCopiedHash(false), 2000)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Verified":
        return <Badge className="bg-green-600 text-white">Verified</Badge>
      case "Pending":
      case "Legacy (Pending Upload)":
        return <Badge variant="destructive">Pending</Badge>
      case "Revoked":
        return <Badge variant="outline">Revoked</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <div className="pt-20 min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <BookOpen className="h-10 w-10 text-primary" />
            <h1 className="text-4xl font-bold text-balance">{instituteData.name}</h1>
          </div>
          <p className="text-xl text-muted-foreground">
            Student Certificate Verification — legacy & blockchain-anchored digital records
          </p>
        </div>

        {/* Key Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Enrolled Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{instituteData.students.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Includes active & alumni</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Programmes</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{instituteData.programmes}</div>
              <p className="text-xs text-muted-foreground">Diploma & Degree courses</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Certificates Posted</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{instituteData.verifiedPosts.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Legacy + blockchain-anchored</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Established</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{instituteData.established}</div>
              <p className="text-xs text-muted-foreground">Years of accreditation</p>
            </CardContent>
          </Card>
        </div>

        {/* Blockchain / Verification Info Section */}
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex items-center gap-2">
              <GraduationCap className="h-6 w-6 text-primary" />
              <CardTitle className="text-xl">Verification Anchor (Blockchain)</CardTitle>
            </div>
            <CardDescription>Each verified certificate is anchored to an immutable transaction to prevent tampering.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Anchor Tx Hash</label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="flex-1 p-3 bg-muted rounded-md text-sm font-mono break-all">
                      {txData.hash || "—"}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(txData.hash)}
                      className="shrink-0"
                    >
                      {copiedHash ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Certificate Ref</label>
                    <div className="text-lg font-bold text-primary mt-1">{txData.certificateRef}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                    <div className="text-lg font-bold text-accent mt-1">{txData.status}</div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Last Anchored</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{txData.lastUpdated}</span>
                  </div>
                </div>

                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Recent Verification Rate</span>
                  </div>
                  <div className="text-lg font-bold text-primary">98.6%</div>
                  <div className="text-sm text-muted-foreground">Verified within 24h of upload</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Dashboard Tabs */}
        <Tabs defaultValue="certificates" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="certificates">Student Certificates</TabsTrigger>
            <TabsTrigger value="analytics">Issuance Analytics</TabsTrigger>
            <TabsTrigger value="verification">Verification Overview</TabsTrigger>
          </TabsList>

          {/* Certificates Tab */}
          <TabsContent value="certificates" className="space-y-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Users className="h-6 w-6 text-primary" />
                  <CardTitle className="text-xl">Student Certificates (Legacy & Digital)</CardTitle>
                </div>
                <CardDescription>
                  Browse student certificates posted by verified institutes. Students may search & verify their records.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Certificate ID</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>Degree</TableHead>
                      <TableHead>Roll No.</TableHead>
                      <TableHead>Year</TableHead>
                      <TableHead>Issuer</TableHead>
                      <TableHead>Tx Hash</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {certificateData.map((cert) => (
                      <TableRow key={cert.id}>
                        <TableCell className="font-mono text-sm">{cert.id}</TableCell>
                        <TableCell className="font-medium">{cert.studentName}</TableCell>
                        <TableCell>{cert.degree}</TableCell>
                        <TableCell className="font-mono text-sm">{cert.rollNo}</TableCell>
                        <TableCell>{cert.year}</TableCell>
                        <TableCell>{cert.issuer}</TableCell>
                        <TableCell>
                          {cert.txHash ? (
                            <div className="flex items-center gap-2">
                              <code className="text-xs font-mono break-all">{cert.txHash}</code>
                              <Button size="sm" variant="outline" onClick={() => copyToClipboard(cert.txHash)}>
                                {copiedHash ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                              </Button>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(cert.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle>Certificates Issued (Monthly)</CardTitle>
                  <CardDescription>Volume of certificates posted each month</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={issuanceData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="issued" stroke="#0d9488" strokeWidth={3} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle>Verification Trend</CardTitle>
                  <CardDescription>Verified vs Issued over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={issuanceData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="verified" fill="#6ee7b7" />
                      <Bar dataKey="issued" fill="#60a5fa" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Verification Overview Tab */}
          <TabsContent value="verification" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle>Verification Status Distribution</CardTitle>
                  <CardDescription>How many certificates are Verified, Pending, or Revoked</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={verificationDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {verificationDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle>Verification Health Score</CardTitle>
                  <CardDescription>Platform-level verification health</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-primary mb-2">94%</div>
                    <p className="text-muted-foreground">High integrity — most certificates are anchored and verified</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Anchored Certificates</span>
                        <span>88%</span>
                      </div>
                      <Progress value={88} className="h-2" />
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Manual Legacy Uploads Verified</span>
                        <span>76%</span>
                      </div>
                      <Progress value={76} className="h-2" />
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Revocation Response Time</span>
                        <span>98%</span>
                      </div>
                      <Progress value={98} className="h-2" />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-primary" />
                      <span>{verificationDistribution.find(d => d.name === "Verified")?.value ?? 0} Verified Certificates</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      <span>{verificationDistribution.find(d => d.name === "Pending")?.value ?? 0} Pending Verification</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
