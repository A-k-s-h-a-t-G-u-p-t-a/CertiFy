import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get("wallet");

    if (!walletAddress) {
      return NextResponse.json(
        {
          success: false,
          error: "Wallet address is required",
        },
        { status: 400 }
      );
    }

    // Find organization by wallet address (case-insensitive)
    const organization = await prisma.organisation.findUnique({
      where: {
        walletAddress: walletAddress.toLowerCase(),
      },
      select: {
        id: true,
        name: true,
        walletAddress: true,
        contractAddress: true,
        metadata: true,
        isActive: true,
        isFlagged: true,
        issuedCertCount: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!organization) {
      return NextResponse.json(
        {
          success: false,
          error: "Organization not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      organization,
    });
  } catch (error) {
    console.error("Error fetching organization:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// Optional: GET all organizations
export async function POST(request) {
  try {
    const organizations = await prisma.organisation.findMany({
      select: {
        id: true,
        name: true,
        walletAddress: true,
        contractAddress: true,
        isActive: true,
        isFlagged: true,
        issuedCertCount: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      organizations,
      total: organizations.length,
    });
  } catch (error) {
    console.error("Error fetching organizations:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
