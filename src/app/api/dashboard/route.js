// src/app/api/dashboard/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Fetch the first organization
    const org = await prisma.Organisation.findFirst();

    // Fetch all certificates with their related organisation
    // const certificates = await prisma.certificate.findMany({
    //   include: {
    //     organisation: true,
    //   },
    //   orderBy: { year: "desc" },
    // });

    const certificates = await prisma.Certificate.findMany({
  include: {
    Organisation: {
      select: { name: true } // include only org name
    },
  },
  orderBy: { year: "desc" },
});


    // Group certificates by year directly in DB
    const chartData = await prisma.certificate.groupBy({
      by: ["year"],
      _count: { year: true },
      orderBy: { year: "asc" },
    });

    // Format chart data for Recharts
    const formattedChartData = chartData.map(item => ({
      year: item.year,
      count: item._count.year,
    }));

    return NextResponse.json({ org, certificates, chartData: formattedChartData }, { status: 200 });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}


