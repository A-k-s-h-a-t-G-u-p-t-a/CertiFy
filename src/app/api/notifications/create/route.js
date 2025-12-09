import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request) {
  try {
    const body = await request.json();
    console.log('📥 Received notification request:', {
      organisationName: body.organisationName,
      isFileHashMatch: body.isFileHashMatch,
      isDataHashMatch: body.isDataHashMatch,
      hasTamperedImage: !!body.tamperedImageUrl,
      hasHeatmapImage: !!body.heatmapImageUrl,
    });
    
    const { organisationName, isFileHashMatch, isDataHashMatch, tamperedImageUrl, heatmapImageUrl } = body;

    if (!organisationName) {
      console.error('❌ Missing organisation name');
      return NextResponse.json(
        { success: false, error: "Organisation name is required" },
        { status: 400 }
      );
    }

    if (typeof isFileHashMatch !== 'boolean' || typeof isDataHashMatch !== 'boolean') {
      console.error('❌ Invalid hash match types:', { 
        isFileHashMatch: typeof isFileHashMatch, 
        isDataHashMatch: typeof isDataHashMatch 
      });
      return NextResponse.json(
        { success: false, error: "isFileHashMatch and isDataHashMatch must be boolean values" },
        { status: 400 }
      );
    }

    // Verify the organisation exists
    const organisation = await prisma.organisation.findUnique({
      where: {
        name: organisationName,
      },
    });

    if (!organisation) {
      return NextResponse.json(
        { success: false, error: "Organisation not found" },
        { status: 404 }
      );
    }

    // Create the notification using organization name with image URLs
    const notification = await prisma.notification.create({
      data: {
        organisationName: organisationName,
        isFileHashMatch: isFileHashMatch,
        isDataHashMatch: isDataHashMatch,
        tamperedImageUrl: tamperedImageUrl || null,
        heatmapImageUrl: heatmapImageUrl || null,
      },
    });

    console.log("🔔 Notification created:", {
      id: notification.id,
      organisationName: notification.organisationName,
      isFileHashMatch: notification.isFileHashMatch,
      isDataHashMatch: notification.isDataHashMatch,
      hasTamperedImage: !!notification.tamperedImageUrl,
      hasHeatmapImage: !!notification.heatmapImageUrl,
    });

    return NextResponse.json({
      success: true,
      notification: {
        id: notification.id,
        organisationName: notification.organisationName,
        isFileHashMatch: notification.isFileHashMatch,
        isDataHashMatch: notification.isDataHashMatch,
        tamperedImageUrl: notification.tamperedImageUrl,
        heatmapImageUrl: notification.heatmapImageUrl,
        createdAt: notification.createdAt,
      },
    });
  } catch (error) {
    console.error("Error creating notification:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create notification",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
