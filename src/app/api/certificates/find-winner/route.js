import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request) {
  try {
    const body = await request.json();
    const { extractedFields } = body;

    if (!extractedFields) {
      return NextResponse.json(
        { success: false, error: "Extracted fields are required" },
        { status: 400 }
      );
    }

    const { certificateId } = extractedFields;

    // Only check if certificate ID matches
    if (!certificateId) {
      return NextResponse.json(
        {
          success: false,
          error: "Certificate ID is required",
        },
        { status: 400 }
      );
    }

    // Try to find by certificate ID (exact match)
    const certById = await prisma.certificate.findFirst({
      where: {
        certificateId: certificateId,
      },
      select: {
        url: true,
        certificateId: true,
      },
    });

    if (certById) {
      console.log("✅ Winner found by certificate ID:", certById.certificateId);
      return NextResponse.json({
        success: true,
        url: certById.url,
      });
    }

    // No match found - return error
    return NextResponse.json(
      {
        success: false,
        error: "No certificate found with the given certificate ID",
      },
      { status: 404 }
    );
  } catch (error) {
    console.error("Error finding winner certificate:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to find winner certificate",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
