"use client"

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { 
  Users, 
  GraduationCap, 
  TrendingUp, 
  Award, 
  Building2, 
  FileText, 
  Upload,
  Shield,
  CheckCircle,
  Calendar,
  UserCheck,
  BookOpen,
  Database
} from "lucide-react";

export default function AcademicDashboardPage() {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState({});

  // Intersection observer for animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsVisible((prev) => ({
            ...prev,
            [entry.target.id]: entry.isIntersecting
          }));
        });
      },
      { threshold: 0.1 }
    );

    const sections = document.querySelectorAll('[id^="section-"]');
    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, []);

  const data = {
    org: {
      name: "Punjab Engineering College (PEC)",
      established: "1921",
      students: 4200,
      programmes: 18,
    },
    certificates: [
      { 
        certificateId: "PEC-2024-CS-001", 
        name: "Aadhya Sharma", 
        degree: "Bachelor of Technology in Computer Science", 
        rollNo: "20CS001", 
        year: 2024, 
        organisation: "Punjab Engineering College",
        status: "Verified",
        issueDate: "2024-06-15"
      },
      { 
        certificateId: "PEC-2024-ME-045", 
        name: "Arjun Singh", 
        degree: "Bachelor of Technology in Mechanical Engineering", 
        rollNo: "20ME045", 
        year: 2024, 
        organisation: "Punjab Engineering College",
        status: "Verified", 
        issueDate: "2024-06-15"
      },
      { 
        certificateId: "PEC-2024-EE-023", 
        name: "Priya Patel", 
        degree: "Bachelor of Technology in Electrical Engineering", 
        rollNo: "20EE023", 
        year: 2024, 
        organisation: "Punjab Engineering College",
        status: "Verified",
        issueDate: "2024-06-15"
      },
      { 
        certificateId: "PEC-2023-CE-067", 
        name: "Rohit Kumar", 
        degree: "Bachelor of Technology in Civil Engineering", 
        rollNo: "19CE067", 
        year: 2023, 
        organisation: "Punjab Engineering College",
        status: "Verified",
        issueDate: "2023-06-20"
      },
      { 
        certificateId: "PEC-2023-IT-089", 
        name: "Kavya Reddy", 
        degree: "Bachelor of Technology in Information Technology", 
        rollNo: "19IT089", 
        year: 2023, 
        organisation: "Punjab Engineering College",
        status: "Verified",
        issueDate: "2023-06-20"
      },
      { 
        certificateId: "PEC-2024-PhD-002", 
        name: "Dr. Rajesh Gupta", 
        degree: "Doctor of Philosophy in Computer Science", 
        rollNo: "PhD-CS-002", 
        year: 2024, 
        organisation: "Punjab Engineering College",
        status: "Verified",
        issueDate: "2024-05-10"
      },
      { 
        certificateId: "PEC-2023-MS-015", 
        name: "Sneha Agarwal", 
        degree: "Master of Science in Electronics", 
        rollNo: "MS-EC-015", 
        year: 2023, 
        organisation: "Punjab Engineering College",
        status: "Verified",
        issueDate: "2023-07-30"
      }
    ],
    chartData: [
      { year: "2021", count: 892 },
      { year: "2022", count: 1156 },
      { year: "2023", count: 1340 },
      { year: "2024", count: 1578 },
    ],
  };

  const stats = [
    { 
      title: "Total Students", 
      value: data.org.students.toLocaleString(), 
      icon: <Users className="h-6 w-6" />,
      description: "Active enrollment",
      color: "from-blue-500 to-cyan-500"
    },
    { 
      title: "Academic Programs", 
      value: data.org.programmes.toString(), 
      icon: <BookOpen className="h-6 w-6" />,
      description: "UG & PG courses",
      color: "from-green-500 to-emerald-500"
    },
    { 
      title: "Certificates Issued", 
      value: data.certificates.length.toString(), 
      icon: <Award className="h-6 w-6" />,
      description: "This year",
      color: "from-purple-500 to-pink-500"
    },
    { 
      title: "Years of Excellence", 
      value: (new Date().getFullYear() - 1921).toString(), 
      icon: <Shield className="h-6 w-6" />,
      description: "Since 1921",
      color: "from-orange-500 to-red-500"
    }
  ];

  // Safety defaults for undefined arrays
  const { org, certificates = [], chartData = [] } = data;

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
              {org.name}
            </h1>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto mb-2">
              Premier Engineering Institution - Established {org.established}
            </p>
            <div className="flex justify-center">
              <Badge className="bg-green-100 text-green-800 border border-green-300 px-4 py-2">
                <Shield className="h-4 w-4 mr-2" />
                Blockchain Verified Institution
              </Badge>
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
                Create Certificate
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
                Complete list of blockchain-verified certificates issued by PEC
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border-2 border-white/50 overflow-hidden shadow-inner">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-green-50 to-emerald-50 border-b-2 border-green-100">
                      <TableHead className="text-gray-800 font-semibold py-4">Certificate ID</TableHead>
                      <TableHead className="text-gray-800 font-semibold">Student Name</TableHead>
                      <TableHead className="text-gray-800 font-semibold">Degree Program</TableHead>
                      <TableHead className="text-gray-800 font-semibold">Roll No</TableHead>
                      <TableHead className="text-gray-800 font-semibold">Year</TableHead>
                      <TableHead className="text-gray-800 font-semibold">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {certificates.map((cert, index) => (
                      <TableRow
                        key={cert.certificateId}
                        className={`hover:bg-green-50 transition-colors duration-200 ${
                          index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                        }`}
                      >
                        <TableCell className="font-mono text-sm text-blue-600 font-medium py-4">
                          {cert.certificateId}
                        </TableCell>
                        <TableCell className="font-medium text-gray-900">{cert.name}</TableCell>
                        <TableCell className="text-gray-700 max-w-xs">
                          <span className="line-clamp-2">{cert.degree}</span>
                        </TableCell>
                        <TableCell className="font-mono text-sm text-gray-600">{cert.rollNo}</TableCell>
                        <TableCell className="text-gray-700">
                          <Badge variant="secondary" className="bg-green-100 text-green-800 border border-green-300">
                            {cert.year}
                          </Badge>
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
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Analytics Chart */}
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
      </div>
    </div>
  );
}
