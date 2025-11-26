import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Check if the user is actually a "user" role (not admin or organisation)
    if (session.user.role !== "user") {
      return NextResponse.json({ error: "Access denied. User role required." }, { status: 403 });
    }
    
    const userApaarId = session.user.username; // For users, username contains apaarId
    
    // Fetch all certificates for this user
    const userCertificates = await prisma.certificate.findMany({
      where: {
        apaarId: userApaarId
      },
      include: {
        organisation: {
          select: {
            name: true,
            id: true
          }
        }
      },
      orderBy: {
        name: 'asc' // Order by certificate name alphabetically
      }
    });
    
    // Also get user details
    const userDetails = await prisma.user.findUnique({
      where: {
        apaarId: userApaarId
      },
      select: {
        id: true,
        apaarId: true,
        createdAt: true
      }
    });
    
    return NextResponse.json({
      user: userDetails,
      certificates: userCertificates,
      totalCertificates: userCertificates.length
    });
    
  } catch (error) {
    console.error("Error fetching user certificates:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}