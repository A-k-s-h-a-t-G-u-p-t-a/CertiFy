"use client"

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { Users, GraduationCap, TrendingUp, Award, Building2, FileText, Upload } from "lucide-react";


  //const [data, setData] = useState<any>(null);

  // useEffect(() => {
  //   fetch("/api/dashboard")
  //     .then((res) => res.json())
  //     .then((json) => setData(json))
  //     .catch((err) => console.error(err));
  // }, []);

  // if (!data) {
  //   return (
  //     <div className="min-h-screen bg-[#f8f6f1] flex items-center justify-center">
  //       <div className="text-center space-y-4">
  //         <div className="w-8 h-8 border-4 border-[#66b2a0] border-t-transparent rounded-full animate-spin mx-auto"></div>
  //         <p className="text-[#4e796b]">Loading dashboard...</p>
  //       </div>
  //     </div>
  //   );
  // }



export default function AcademicDashboardPage() {
  const router = useRouter();

  
  const data = {
    org: {
      name: "Apna College",
    },
    certificates: [
      { certificateId: null, name: "Florence Williams", degree: "Bachelor of Science in Surgery", rollNo: null, year: 2020, organisation: "Apna College" },

      { certificateId: null, name: "Samuel Gray", degree: "Bachelor of Science in Surgery", rollNo: null, year: 2024, organisation: "Apna College" },

      { certificateId: null, name: "DARRELL WILSON", degree: "specialized German language course program", rollNo: null, year: 2024, organisation: "Apna College" },

      { certificateId: 748504619, name: "Bhavay Wadhwa", degree: "Delta (Full Stack Web Development)", rollNo: null, year: null, organisation: "Apna College" },

      { certificateId: 3859374948, name: "Kanavpreet Singh", degree: null, rollNo: null, year: null, organisation: "Apna College" },

      { certificateId: 749374064, name: "abcd", degree: "cse", rollNo: null, year: 2025, organisation: "Apna College" },

      { certificateId: 123, name: "SAMRAT HORA", degree: "BACHELOR OF TECHNOLOGY", rollNo: 231, year: 2013, organisation: "Apna College" },
    ],
    chartData: [
      { year: "2020", count: 1 },
      { year: "2024", count: 2 },
      { year: "2025", count: 1 },
      { year: "2013", count: 1 },
    ],
  };

 
  // Safety defaults for undefined arrays
  const { org, certificates = [], chartData = [] } = data;

  return (
    <div className="min-h-screen bg-[#f8f6f1]">
      <div className="container mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-[#4e796b]">Academic Dashboard</h1>
          <p className="text-[#4e796b] text-lg">Manage certificates and track institutional progress</p>
        </div>

        {/* Institute Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-[#f8f6f1] border border-[#a7d7b8] shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-[#4e796b]">Institute</CardTitle>
              <Building2 className="h-4 w-4 text-[#66b2a0]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#4e796b]">{org?.name ?? "null"}</div>
              <p className="text-xs text-[#4e796b] mt-1">Est. 2020</p>
            </CardContent>
          </Card>

          <Card className="bg-[#f8f6f1] border border-[#a7d7b8] shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-[#4e796b]">Students</CardTitle>
              <Users className="h-4 w-4 text-[#66b2a0]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#4e796b]">12</div>
              <p className="text-xs text-[#4e796b] mt-1">Active enrollment</p>
            </CardContent>
          </Card>

          <Card className="bg-[#f8f6f1] border border-[#a7d7b8] shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-[#4e796b]">Programmes</CardTitle>
              <GraduationCap className="h-4 w-4 text-[#66b2a0]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#4e796b]">5</div>
              <p className="text-xs text-[#4e796b] mt-1">Academic programs</p>
            </CardContent>
          </Card>

          <Card className="bg-[#f8f6f1] border border-[#a7d7b8] shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-[#4e796b]">Certificates</CardTitle>
              <Award className="h-4 w-4 text-[#66b2a0]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#4e796b]">{certificates.length}</div>
              <p className="text-xs text-[#4e796b] mt-1">Verified posts</p>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <Card className="bg-[#e1eae5] border border-[#a7d7b8]">
          <CardHeader>
            <CardTitle className="text-[#4e796b]">Quick Actions</CardTitle>
            <CardDescription className="text-[#4e796b]">Manage certificates and upload new documents</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={() => router.push("/upload")}
              className="bg-[#66b2a0] hover:bg-[#4e796b] text-[#f8f6f1] flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              Upload Documents
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/certificate-generator")}
              className="border-[#66b2a0] text-[#66b2a0] hover:bg-[#66b2a0] hover:text-[#f8f6f1] flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              Create Certificate
            </Button>
          </CardContent>
        </Card>

       {/* Certificates Table */}
<Card className="shadow-lg bg-[#f8f6f1] border border-[#a7d7b8]">
  <CardHeader>
    <CardTitle className="text-[#4e796b] flex items-center gap-2">
      <Award className="h-5 w-5 text-[#66b2a0]" />
      Certificate Records
    </CardTitle>
    <CardDescription className="text-[#4e796b]">Complete list of issued certificates</CardDescription>
  </CardHeader>
  <CardContent>
    <div className="rounded-lg border border-[#a7d7b8] overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-[#e1eae5]">
            <TableHead className="text-[#4e796b] font-semibold">Issuer</TableHead>
            <TableHead className="text-[#4e796b] font-semibold">Certificate ID</TableHead>
            <TableHead className="text-[#4e796b] font-semibold">Student</TableHead>
            <TableHead className="text-[#4e796b] font-semibold">Degree</TableHead>
            <TableHead className="text-[#4e796b] font-semibold">Roll No</TableHead>
            <TableHead className="text-[#4e796b] font-semibold">Year</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {certificates.map((cert, index) => (
            <TableRow
              key={cert.certificateId ?? index}
              className={`hover:bg-[#a7d7b8]/20 ${index % 2 === 0 ? "bg-[#f8f6f1]" : "bg-[#e1eae5]"}`}
            >
              <TableCell className="text-[#4e796b] font-medium">{cert.organisation ?? "null"}</TableCell>
              <TableCell className="font-mono text-sm text-[#66b2a0]">{cert.certificateId ?? "null"}</TableCell>
              <TableCell className="font-medium text-[#4e796b]">{cert.name ?? "null"}</TableCell>
              <TableCell className="text-[#4e796b]">{cert.degree ?? "null"}</TableCell>
              <TableCell className="text-[#4e796b]">{cert.rollNo ?? "null"}</TableCell>
              <TableCell className="text-[#4e796b]">
                <Badge variant="secondary" className="bg-[#a7d7b8] text-[#4e796b]">
                  {cert.year ?? "null"}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  </CardContent>
</Card>


        {/* Analytics Chart */}
        <Card className="shadow-lg bg-[#f8f6f1] border border-[#a7d7b8]">
          <CardHeader>
            <CardTitle className="text-[#4e796b] flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-[#66b2a0]" />
              Yearly Certificate Analysis
            </CardTitle>
            <CardDescription className="text-[#4e796b]">Track certificate issuance trends over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#a7d7b8" opacity={0.3} />
                  <XAxis dataKey="year" stroke="#4e796b" fontSize={12} />
                  <YAxis stroke="#4e796b" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#f8f6f1",
                      border: "1px solid #a7d7b8",
                      borderRadius: "8px",
                      color: "#4e796b",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#66b2a0"
                    strokeWidth={3}
                    dot={{ fill: "#66b2a0", strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, fill: "#4e796b" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
