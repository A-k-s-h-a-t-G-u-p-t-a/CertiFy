import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/analytics/org?name=OrganizationName
 * Returns tampering analytics data for a specific organization
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const orgName = searchParams.get('name');

    if (!orgName) {
      return NextResponse.json(
        { success: false, error: "Organization name is required" },
        { status: 400 }
      );
    }

    // Get all notifications for this organization
    const notifications = await prisma.notification.findMany({
      where: {
        organisationName: orgName
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Calculate statistics
    const totalVerifications = notifications.length;
    const fileHashMatches = notifications.filter(n => n.isFileHashMatch).length;
    const fileHashMismatches = notifications.filter(n => !n.isFileHashMatch).length;
    const dataHashMatches = notifications.filter(n => n.isDataHashMatch).length;
    const dataHashMismatches = notifications.filter(n => !n.isDataHashMatch).length;
    const bothMatch = notifications.filter(n => n.isFileHashMatch && n.isDataHashMatch).length;
    const bothMismatch = notifications.filter(n => !n.isFileHashMatch && !n.isDataHashMatch).length;
    const partialMatch = notifications.filter(n => 
      (n.isFileHashMatch && !n.isDataHashMatch) || (!n.isFileHashMatch && n.isDataHashMatch)
    ).length;

    // Calculate rates
    const tamperingRate = totalVerifications > 0 
      ? ((fileHashMismatches + dataHashMismatches) / (totalVerifications * 2) * 100).toFixed(2)
      : 0;
    
    const successRate = totalVerifications > 0
      ? ((bothMatch / totalVerifications) * 100).toFixed(2)
      : 0;

    // Get daily trend for last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentNotifications = notifications.filter(
      n => new Date(n.createdAt) >= thirtyDaysAgo
    );

    // Group by day
    const dailyTrend = {};
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      dailyTrend[dateKey] = {
        date: dateKey,
        verifications: 0,
        successful: 0,
        tampered: 0,
        partial: 0
      };
    }

    recentNotifications.forEach(notification => {
      const dateKey = new Date(notification.createdAt).toISOString().split('T')[0];
      if (dailyTrend[dateKey]) {
        dailyTrend[dateKey].verifications++;
        if (notification.isFileHashMatch && notification.isDataHashMatch) {
          dailyTrend[dateKey].successful++;
        } else if (!notification.isFileHashMatch && !notification.isDataHashMatch) {
          dailyTrend[dateKey].tampered++;
        } else {
          dailyTrend[dateKey].partial++;
        }
      }
    });

    // Convert to array and sort by date
    const trendData = Object.values(dailyTrend)
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    // Pie chart data for verification results - using subtle professional colors
    const pieChartData = [
      { name: 'Verified', value: bothMatch, color: '#4F9D8E' },
      { name: 'Partial Match', value: partialMatch, color: '#E8B86D' },
      { name: 'Tampered', value: bothMismatch, color: '#D4847C' },
    ].filter(item => item.value > 0);

    // Bar chart data for hash comparison
    const barChartData = [
      { 
        name: 'File Hash (pHash)', 
        matches: fileHashMatches, 
        mismatches: fileHashMismatches 
      },
      { 
        name: 'Data Hash', 
        matches: dataHashMatches, 
        mismatches: dataHashMismatches 
      },
    ];

    // Recent verification history (last 20)
    const recentVerifications = notifications.slice(0, 20).map(n => ({
      id: n.id,
      date: n.createdAt,
      isFileHashMatch: n.isFileHashMatch,
      isDataHashMatch: n.isDataHashMatch,
      status: n.isFileHashMatch && n.isDataHashMatch 
        ? 'verified' 
        : !n.isFileHashMatch && !n.isDataHashMatch 
          ? 'tampered' 
          : 'partial'
    }));

    // Hourly distribution for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayNotifications = notifications.filter(
      n => new Date(n.createdAt) >= today
    );

    const hourlyDistribution = Array.from({ length: 24 }, (_, hour) => ({
      hour: `${hour.toString().padStart(2, '0')}:00`,
      count: todayNotifications.filter(
        n => new Date(n.createdAt).getHours() === hour
      ).length
    }));

    return NextResponse.json({
      success: true,
      orgName,
      stats: {
        totalVerifications,
        fileHashMatches,
        fileHashMismatches,
        dataHashMatches,
        dataHashMismatches,
        bothMatch,
        bothMismatch,
        partialMatch,
        tamperingRate: parseFloat(tamperingRate),
        successRate: parseFloat(successRate),
        todayVerifications: todayNotifications.length,
        last30DaysVerifications: recentNotifications.length,
      },
      pieChartData,
      barChartData,
      trendData,
      recentVerifications,
      hourlyDistribution,
    });

  } catch (error) {
    console.error("Error fetching org analytics:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
