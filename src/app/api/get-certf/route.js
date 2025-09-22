
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req) {
  try {
    const body = await req.json();
    const { organisation } = body;

    if (!organisation) {
      return NextResponse.json(
        { error: "Organisation name is required in 'organisation' field" },
        { status: 400 }
      );
    }

    // Fetch organisation with certificates
    const org = await prisma.organisation.findUnique({
      where: { name: organisation },
      include: {
        certificates: true,
      },
    });

    if (!org) {
      return NextResponse.json(
        { error: "Organisation not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      organisation: org.name,
      certificates: org.certificates,
    });
  } catch (error) {
    console.error("Error fetching certificates:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
