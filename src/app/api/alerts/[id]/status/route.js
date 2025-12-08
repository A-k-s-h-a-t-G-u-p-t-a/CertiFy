import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "organisation") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const { status } = await req.json();

    if (!status || !["pending", "completed"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be 'pending' or 'completed'" },
        { status: 400 }
      );
    }

    // Verify the alert belongs to the logged-in organization
    const alert = await prisma.alert.findUnique({
      where: { id },
      include: {
        organisation: true,
      },
    });

    if (!alert) {
      return NextResponse.json({ error: "Alert not found" }, { status: 404 });
    }

    if (alert.organisation.name !== session.user.name) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Update the alert status
    const updatedAlert = await prisma.alert.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({
      success: true,
      alert: updatedAlert,
    });
  } catch (error) {
    console.error("Error updating alert status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
