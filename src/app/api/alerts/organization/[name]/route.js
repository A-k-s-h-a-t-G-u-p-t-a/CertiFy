import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "organisation") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name } = params;

    // Verify the session user matches the requested organization
    if (session.user.name !== name) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Find the organization
    const organisation = await prisma.organisation.findUnique({
      where: { name },
    });

    if (!organisation) {
      return NextResponse.json(
        { error: "Organisation not found" },
        { status: 404 }
      );
    }

    // Fetch all pending alerts for this organization
    const alerts = await prisma.alert.findMany({
      where: {
        organisationId: organisation.id,
        status: "pending",
      },
      include: {
        certificate: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Parse JSON strings back to objects for easier frontend usage
    const alertsWithParsedData = alerts.map((alert) => ({
      ...alert,
      comparisonData: alert.comparisonData
        ? JSON.parse(alert.comparisonData)
        : null,
      extractedFields: alert.extractedFields
        ? JSON.parse(alert.extractedFields)
        : null,
    }));

    return NextResponse.json({
      success: true,
      alerts: alertsWithParsedData,
    });
  } catch (error) {
    console.error("Error fetching alerts:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
