import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request) {
  try {
    // Get the session to identify the logged-in organization
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized. Please log in.",
        },
        { status: 401 }
      );
    }

    // Check if the user is an organization
    if (session.user.role !== "organisation") {
      return NextResponse.json(
        {
          success: false,
          error: "Access denied. This endpoint is for organizations only.",
        },
        { status: 403 }
      );
    }

    const orgName = session.user.name;

    if (!orgName) {
      return NextResponse.json(
        {
          success: false,
          error: "Organization name not found in session.",
        },
        { status: 400 }
      );
    }

    // Find organization by name with related data
    const organization = await prisma.organisation.findUnique({
      where: {
        name: orgName,
      },
      include: {
        certificates: {
          orderBy: {
            createdAt: "desc",
          },
        },
        courses: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!organization) {
      return NextResponse.json(
        {
          success: false,
          error: "Organization not found in database.",
        },
        { status: 404 }
      );
    }

    // Calculate statistics
    const totalCertificates = organization.certificates.length;
    const totalCourses = organization.courses.length;

    // Group certificates by year for chart data
    const certificatesByYear = organization.certificates.reduce((acc, cert) => {
      const year = cert.year || new Date(cert.createdAt).getFullYear().toString();
      acc[year] = (acc[year] || 0) + 1;
      return acc;
    }, {});

    const chartData = Object.entries(certificatesByYear)
      .map(([year, count]) => ({ year, count }))
      .sort((a, b) => a.year.localeCompare(b.year));

    // Get establishment year from creation date
    const establishedYear = organization.createdAt 
      ? new Date(organization.createdAt).getFullYear() 
      : null;

    // Format the response
    const responseData = {
      success: true,
      organization: {
        id: organization.id,
        name: organization.name,
        username: organization.username,
        walletAddress: organization.walletAddress,
        contractAddress: organization.contractAddress,
        metadata: organization.metadata,
        isActive: organization.isActive,
        isFlagged: organization.isFlagged,
        issuedCertCount: organization.issuedCertCount,
        established: establishedYear,
        createdAt: organization.createdAt,
        updatedAt: organization.updatedAt,
      },
      statistics: {
        totalCertificates,
        totalCourses,
        issuedCertCount: organization.issuedCertCount,
      },
      certificates: organization.certificates.map(cert => ({
        id: cert.id,
        certificateId: cert.certificateId,
        name: cert.name,
        nqrCode: cert.nqrCode,
        courseName: cert.courseName,
        apaarId: cert.apaarId,
        year: cert.year,
        url: cert.url,
        createdAt: cert.createdAt,
        status: "Verified", // All certificates in DB are verified
        issueDate: cert.createdAt,
      })),
      courses: organization.courses.map(course => ({
        id: course.id,
        nqrCode: course.nqrCode,
        name: course.name,
        duration: course.duration,
        credits: course.credits,
        createdAt: course.createdAt,
      })),
      chartData,
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Error fetching organization details:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error. Please try again later.",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
