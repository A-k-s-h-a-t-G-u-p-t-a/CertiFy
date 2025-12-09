export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendWarningMail } from "@/lib/mailer";

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

    console.log('📋 Organisation details:', {
      name: organisation.name,
      username: organisation.username,
      hasValidEmail: organisation.username?.includes('@') || false,
    });

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

    // Check for 3 consecutive mismatches (async, don't wait for it)
    (async () => {
      try {
        // Get the last 3 notifications for this organization (including the one just created)
        const recentNotifications = await prisma.notification.findMany({
          where: {
            organisationName: organisationName,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 3,
        });

        console.log(`📊 Checking last ${recentNotifications.length} notifications for ${organisationName}`);

        // Check if we have at least 3 notifications
        if (recentNotifications.length === 3) {
          // Check if all 3 have mismatches (either file hash or data hash mismatch)
          const allHaveMismatches = recentNotifications.every(
            notif => !notif.isFileHashMatch || !notif.isDataHashMatch
          );

          if (allHaveMismatches) {
            console.log(`🚨 ALERT: 3 consecutive mismatches detected for ${organisationName}`);
            
            // Prepare email recipients list
            const recipients = [];
            
            // Add organization email if valid
            if (organisation.username && organisation.username.includes('@')) {
              recipients.push({
                email: organisation.username,
                name: organisation.name,
                type: 'organization'
              });
            } else {
              console.warn(`⚠️ Organisation ${organisationName} has invalid email: ${organisation.username}`);
            }
            
            // Add admin email if configured
            if (process.env.ADMIN_EMAIL && process.env.ADMIN_EMAIL.includes('@')) {
              recipients.push({
                email: process.env.ADMIN_EMAIL,
                name: 'Admin',
                type: 'admin'
              });
            }
            
            // Send emails to all valid recipients
            if (recipients.length > 0) {
              console.log(`📧 Sending critical alerts to ${recipients.length} recipient(s)...`);
              
              for (const recipient of recipients) {
                try {
                  await sendWarningMail(recipient.email, {
                    organisationName: organisation.name,
                    isFileHashMatch: notification.isFileHashMatch,
                    isDataHashMatch: notification.isDataHashMatch,
                    notificationId: notification.id,
                    createdAt: notification.createdAt,
                    isCriticalAlert: true,
                    consecutiveMismatches: 3,
                  });
                  console.log(`✅ Critical alert email sent to ${recipient.type}: ${recipient.email}`);
                } catch (emailError) {
                  console.error(`❌ Failed to send email to ${recipient.type} (${recipient.email}):`, emailError.message);
                }
              }
            } else {
              console.warn(`⚠️ No valid email recipients found for critical alert. Organisation email: ${organisation.username}, Admin email: ${process.env.ADMIN_EMAIL}`);
            }
          } else {
            console.log(`✓ No consecutive mismatch pattern detected`);
          }
        } else {
          console.log(`ℹ️ Only ${recentNotifications.length} notification(s) so far, need 3 to check pattern`);
        }
      } catch (err) {
        console.error('❌ Error checking consecutive mismatches:', err);
        // Don't fail the notification creation if this check fails
      }
    })();

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
