import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request) {
  try {
    const body = await request.json();
    const { nqrCode } = body;

    if (!nqrCode) {
      return NextResponse.json(
        { error: "NQR Code is required" },
        { status: 400 }
      );
    }

    // Optimized query:
    // 1. Uses 'select' to fetch only necessary fields (reduces payload)
    // 2. Relies on @@index([nqrCode]) in schema for fast lookup
    const certificates = await prisma.certificate.findMany({
      where: {
        nqrCode: nqrCode,
      },
      select: {
        id: true,
        certificateId: true,
        name: true,
        courseName: true,
        url: true,
        createdAt: true,
        organisation: {
          select: {
            name: true,
            // id: true // Only select if needed by client
          },
        },
      },
      // Optional: Add pagination if expecting large result sets
      // take: 50,
    });

    return NextResponse.json({ 
      success: true,
      count: certificates.length,
      certificates 
    });
  } catch (error) {
    console.error("Error fetching certificates by NQR code:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
