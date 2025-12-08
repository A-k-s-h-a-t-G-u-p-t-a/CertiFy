import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request) {
  try {
    const body = await request.json();
    const { 
      certificateId, 
      organisationName, 
      message, 
      comparisonData, 
      extractedFields,
      fullComparisonResult 
    } = body;

    // Validate required fields
    if (!certificateId || !organisationName) {
      return NextResponse.json(
        {
          success: false,
          error: "Certificate ID and organisation name are required",
        },
        { status: 400 }
      );
    }

    // Find the organisation by name (name is unique)
    const organisation = await prisma.organisation.findUnique({
      where: {
        name: organisationName,
      },
    });

    if (!organisation) {
      return NextResponse.json(
        {
          success: false,
          error: `Organisation not found: ${organisationName}`,
        },
        { status: 404 }
      );
    }

    // Verify the certificate exists
    const certificate = await prisma.certificate.findUnique({
      where: {
        id: certificateId,
      },
    });

    if (!certificate) {
      return NextResponse.json(
        {
          success: false,
          error: `Certificate not found: ${certificateId}`,
        },
        { status: 404 }
      );
    }

    // Create the alert with all comparison data
    const alert = await prisma.alert.create({
      data: {
        certificateId: certificateId,
        organisationId: organisation.id,
        message: message || "Certificate verification alert",
        status: "pending",
        
        // Store individual scores for easy querying
        similarityScore: comparisonData?.similarityScore || null,
        tamperingScore: comparisonData?.tamperingScore || null,
        cvTamperingScore: comparisonData?.cvTamperingScore || null,
        nlpTamperingScore: comparisonData?.nlpTamperingScore || null,
        ssimScore: comparisonData?.ssimScore || null,
        
        // Store full comparison result as JSON string
        comparisonData: fullComparisonResult ? JSON.stringify(fullComparisonResult) : null,
        
        // Store extracted fields as JSON string
        extractedFields: extractedFields ? JSON.stringify(extractedFields) : null,
      },
      include: {
        certificate: true,
        organisation: true,
      },
    });

    console.log("🚨 Alert created:", {
      id: alert.id,
      certificateId: alert.certificateId,
      organisationId: alert.organisationId,
      status: alert.status,
    });

    return NextResponse.json({
      success: true,
      alert: {
        id: alert.id,
        certificateId: alert.certificateId,
        organisationId: alert.organisationId,
        message: alert.message,
        status: alert.status,
        similarityScore: alert.similarityScore,
        tamperingScore: alert.tamperingScore,
        cvTamperingScore: alert.cvTamperingScore,
        nlpTamperingScore: alert.nlpTamperingScore,
        ssimScore: alert.ssimScore,
        comparisonData: alert.comparisonData,
        extractedFields: alert.extractedFields,
        createdAt: alert.createdAt,
        certificate: {
          id: alert.certificate.id,
          certificateId: alert.certificate.certificateId,
          name: alert.certificate.name,
        },
        organisation: {
          id: alert.organisation.id,
          name: alert.organisation.name,
        },
      },
    });
  } catch (error) {
    console.error("Error creating alert:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create alert",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
