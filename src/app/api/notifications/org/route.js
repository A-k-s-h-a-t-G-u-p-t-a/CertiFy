import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/notifications/org?name=OrganizationName&limit=20
 * Returns notifications for a specific organization with image comparison data
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const orgName = searchParams.get('name');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!orgName) {
      return NextResponse.json(
        { success: false, error: "Organization name is required" },
        { status: 400 }
      );
    }

    // Get notifications for this organization
    const notifications = await prisma.notification.findMany({
      where: {
        organisationName: orgName
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    });

    // Filter notifications that have image comparison data
    const notificationsWithImages = notifications.filter(
      n => n.tamperedImageUrl || n.heatmapImageUrl
    );

    // Get summary stats
    const totalNotifications = notifications.length;
    const withTamperEvidence = notificationsWithImages.length;
    const tamperedCount = notifications.filter(
      n => !n.isFileHashMatch || !n.isDataHashMatch
    ).length;
    const verifiedCount = notifications.filter(
      n => n.isFileHashMatch && n.isDataHashMatch
    ).length;

    return NextResponse.json({
      success: true,
      orgName,
      stats: {
        total: totalNotifications,
        withTamperEvidence,
        tamperedCount,
        verifiedCount
      },
      notifications: notifications.map(n => ({
        id: n.id,
        isFileHashMatch: n.isFileHashMatch,
        isDataHashMatch: n.isDataHashMatch,
        hasTamperedImage: !!n.tamperedImageUrl,
        hasHeatmap: !!n.heatmapImageUrl,
        tamperedImageUrl: n.tamperedImageUrl,
        heatmapImageUrl: n.heatmapImageUrl,
        createdAt: n.createdAt,
        status: n.isFileHashMatch && n.isDataHashMatch 
          ? 'verified' 
          : !n.isFileHashMatch && !n.isDataHashMatch 
            ? 'tampered' 
            : 'partial'
      }))
    });

  } catch (error) {
    console.error("Error fetching org notifications:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}
