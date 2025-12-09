import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

/**
 * GET /api/organizations/list
 * Returns all active organizations with their name and contract address
 * Used by verifier pages to populate organization dropdown
 */
export async function GET() {
  try {
    // Find all active organizations with contract addresses
    const organizations = await prisma.organisation.findMany({
      where: {
        isActive: true,
        contractAddress: {
          not: null,
        },
      },
      select: {
        id: true,
        name: true,
        contractAddress: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json({
      success: true,
      organizations: organizations.map(org => ({
        id: org.id,
        name: org.name,
        address: org.contractAddress,
      })),
    });
  } catch (error) {
    console.error("Error fetching organizations:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch organizations",
      },
      { status: 500 }
    );
  }
}
