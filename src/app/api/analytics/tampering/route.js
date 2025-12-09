import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/analytics/tampering
 * Returns tampering analytics data from Notifications table grouped by organization
 */
export async function GET() {
  try {
    // Get all notifications with aggregation
    const notifications = await prisma.notification.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Get all organizations for reference
    const organizations = await prisma.organisation.findMany({
      select: {
        id: true,
        name: true,
        issuedCertCount: true,
        isActive: true,
        isFlagged: true,
      }
    });

    // Aggregate notifications by organization
    const orgAnalytics = {};
    
    notifications.forEach(notification => {
      const orgName = notification.organisationName;
      
      if (!orgAnalytics[orgName]) {
        orgAnalytics[orgName] = {
          name: orgName,
          totalVerifications: 0,
          fileHashMatches: 0,
          fileHashMismatches: 0,
          dataHashMatches: 0,
          dataHashMismatches: 0,
          bothMatch: 0,
          bothMismatch: 0,
          partialMatch: 0,
          verificationHistory: []
        };
      }
      
      orgAnalytics[orgName].totalVerifications++;
      
      if (notification.isFileHashMatch) {
        orgAnalytics[orgName].fileHashMatches++;
      } else {
        orgAnalytics[orgName].fileHashMismatches++;
      }
      
      if (notification.isDataHashMatch) {
        orgAnalytics[orgName].dataHashMatches++;
      } else {
        orgAnalytics[orgName].dataHashMismatches++;
      }
      
      if (notification.isFileHashMatch && notification.isDataHashMatch) {
        orgAnalytics[orgName].bothMatch++;
      } else if (!notification.isFileHashMatch && !notification.isDataHashMatch) {
        orgAnalytics[orgName].bothMismatch++;
      } else {
        orgAnalytics[orgName].partialMatch++;
      }

      // Add to history (last 50 per org)
      if (orgAnalytics[orgName].verificationHistory.length < 50) {
        orgAnalytics[orgName].verificationHistory.push({
          date: notification.createdAt,
          isFileHashMatch: notification.isFileHashMatch,
          isDataHashMatch: notification.isDataHashMatch
        });
      }
    });

    // Calculate global stats
    const globalStats = {
      totalVerifications: notifications.length,
      totalFileHashMatches: notifications.filter(n => n.isFileHashMatch).length,
      totalFileHashMismatches: notifications.filter(n => !n.isFileHashMatch).length,
      totalDataHashMatches: notifications.filter(n => n.isDataHashMatch).length,
      totalDataHashMismatches: notifications.filter(n => !n.isDataHashMatch).length,
      totalBothMatch: notifications.filter(n => n.isFileHashMatch && n.isDataHashMatch).length,
      totalBothMismatch: notifications.filter(n => !n.isFileHashMatch && !n.isDataHashMatch).length,
      totalPartialMatch: notifications.filter(n => (n.isFileHashMatch && !n.isDataHashMatch) || (!n.isFileHashMatch && n.isDataHashMatch)).length,
      organizationsWithVerifications: Object.keys(orgAnalytics).length,
    };

    // Calculate tampering rate
    globalStats.tamperingRate = globalStats.totalVerifications > 0 
      ? ((globalStats.totalFileHashMismatches + globalStats.totalDataHashMismatches) / (globalStats.totalVerifications * 2) * 100).toFixed(2)
      : 0;

    globalStats.successRate = globalStats.totalVerifications > 0
      ? ((globalStats.totalBothMatch / globalStats.totalVerifications) * 100).toFixed(2)
      : 0;

    // Get verification trend (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentNotifications = notifications.filter(n => new Date(n.createdAt) >= thirtyDaysAgo);
    
    // Group by date
    const dailyTrend = {};
    recentNotifications.forEach(n => {
      const dateKey = new Date(n.createdAt).toISOString().split('T')[0];
      if (!dailyTrend[dateKey]) {
        dailyTrend[dateKey] = {
          date: dateKey,
          total: 0,
          matches: 0,
          mismatches: 0
        };
      }
      dailyTrend[dateKey].total++;
      if (n.isFileHashMatch && n.isDataHashMatch) {
        dailyTrend[dateKey].matches++;
      } else {
        dailyTrend[dateKey].mismatches++;
      }
    });

    const trendData = Object.values(dailyTrend).sort((a, b) => new Date(a.date) - new Date(b.date));

    // Convert org analytics to array and calculate rates
    const organizationData = Object.values(orgAnalytics).map(org => ({
      ...org,
      fileHashMatchRate: org.totalVerifications > 0 
        ? ((org.fileHashMatches / org.totalVerifications) * 100).toFixed(1)
        : 0,
      dataHashMatchRate: org.totalVerifications > 0 
        ? ((org.dataHashMatches / org.totalVerifications) * 100).toFixed(1)
        : 0,
      overallSuccessRate: org.totalVerifications > 0 
        ? ((org.bothMatch / org.totalVerifications) * 100).toFixed(1)
        : 0,
      tamperingRate: org.totalVerifications > 0 
        ? ((org.bothMismatch / org.totalVerifications) * 100).toFixed(1)
        : 0,
    })).sort((a, b) => b.totalVerifications - a.totalVerifications);

    // Merge with organization info from DB
    const enrichedOrgData = organizationData.map(org => {
      const dbOrg = organizations.find(o => o.name === org.name);
      return {
        ...org,
        issuedCertCount: dbOrg?.issuedCertCount || 0,
        isActive: dbOrg?.isActive ?? true,
        isFlagged: dbOrg?.isFlagged ?? false,
      };
    });

    return NextResponse.json({
      success: true,
      globalStats,
      organizationData: enrichedOrgData,
      trendData,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error fetching tampering analytics:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch analytics data" },
      { status: 500 }
    );
  }
}
