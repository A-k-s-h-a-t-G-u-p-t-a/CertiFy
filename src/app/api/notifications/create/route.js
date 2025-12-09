import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request) {
  try {
    const body = await request.json();
    const { organisationName } = body;

    if (!organisationName) {
      return NextResponse.json(
        { success: false, error: "Organisation name is required" },
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

    // Create the notification using organization name
    const notification = await prisma.notification.create({
      data: {
        organisationName: organisationName,
      },
    });

    console.log("🔔 Notification created:", {
      id: notification.id,
      organisationName: notification.organisationName,
    });

    return NextResponse.json({
      success: true,
      notification: {
        id: notification.id,
        organisationName: notification.organisationName,
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
