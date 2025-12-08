import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    if (session.user.role !== "user") {
      return NextResponse.json({ error: "Access denied. User role required." }, { status: 403 });
    }
    
    const userApaarId = session.user.username;
    
    // Fetch all certificates for this user from Certificate2
    const userCertificates = await prisma.certificate2.findMany({
      where: {
        apaarId: userApaarId
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    // Calculate analytics
    const totalCredits = userCertificates.reduce((sum, cert) => 
      sum + (cert.courseCredits || 0), 0
    );
    
    // Group by courseDomain for pie chart
    const domainGroups = userCertificates.reduce((acc, cert) => {
      const domain = cert.courseDomain || 'Uncategorized';
      if (!acc[domain]) {
        acc[domain] = {
          name: domain,
          value: 0,
          credits: 0,
          courses: []
        };
      }
      acc[domain].value += 1;
      acc[domain].credits += (cert.courseCredits || 0);
      acc[domain].courses.push(cert.courseName);
      return acc;
    }, {});
    
    const domainData = Object.values(domainGroups);
    
    return NextResponse.json({
      totalCertificates: userCertificates.length,
      totalCredits,
      domainData,
      certificates: userCertificates
    });
    
  } catch (error) {
    console.error("Error fetching user analytics:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
