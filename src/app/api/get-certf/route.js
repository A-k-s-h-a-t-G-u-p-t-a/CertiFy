import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Initialize Prisma dynamically
    
    // Fetch all certificates with organisation info
    const certificates = await prisma.certificate.findMany({
      include: { organisation: true }, // optional
    });

    // Determine file type from URL extension
    const certificatesWithType = certificates.map(cert => {
      const ext = cert.url.split(".").pop().toLowerCase();
      let type = "unknown";

      if (["pdf"].includes(ext)) type = "pdf";
      else if (["jpg", "jpeg", "png"].includes(ext)) type = "image";

      return { ...cert, type };
    });

    return new Response(JSON.stringify(certificatesWithType), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching certificates:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch certificates", details: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
