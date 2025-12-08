import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import redis from "@/lib/redis";

export async function GET(req, { params }) {
  try {
    const apaarId = params.apaarId;

    if (!apaarId) {
      return NextResponse.json(
        { error: "apaarId is required in the URL" },
        { status: 400 }
      );
    }

    const cacheKey = `certificates:${apaarId}`;

    // ✅ Step 1 — Check Redis cache
    const cached = await redis.get(cacheKey);

    if (cached) {
      return NextResponse.json({
        fromCache: true,
        certificates: JSON.parse(cached),
      });
    }

    // ✅ Step 2 — Fetch from MongoDB via Prisma
    const certificates = await prisma.certificate.findMany({
      where: { apaarId },
    });

    // ✅ Step 3 — If no certificates → return 404
    if (!certificates || certificates.length === 0) {
      return NextResponse.json(
        { error: "No certificates found for this apaarId" },
        { status: 404 }
      );
    }

    // ✅ Step 4 — Store in Redis for 1 hour
    await redis.set(cacheKey, JSON.stringify(certificates), "EX", 3600);

    // ✅ Step 5 — Return response
    return NextResponse.json({
      fromCache: false,
      apaarId,
      certificates,
    });

  } catch (error) {
    console.error("Error fetching certificates:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
