const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// Simple demo SVG images as base64 (small placeholder images)
const demoTamperedImage = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjVmNWY1Ii8+PHJlY3QgeD0iNTAiIHk9IjUwIiB3aWR0aD0iMTAwIiBoZWlnaHQ9IjUwIiBmaWxsPSJub25lIiBzdHJva2U9IiNlZjQ0NDQiIHN0cm9rZS13aWR0aD0iMyIgc3Ryb2tlLWRhc2hhcnJheT0iNSw1Ii8+PHJlY3QgeD0iMjAwIiB5PSIxMjAiIHdpZHRoPSIxNTAiIGhlaWdodD0iNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2VmNDQ0NCIgc3Ryb2tlLXdpZHRoPSIzIiBzdHJva2UtZGFzaGFycmF5PSI1LDUiLz48dGV4dCB4PSIyMDAiIHk9IjI1MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSIjNjY2Ij5EZXRlY3RlZCBUYW1wZXJlZCBSZWdpb25zPC90ZXh0Pjwvc3ZnPg==";

const demoHeatmapImage = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImhlYXQiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiMwMGZmMDA7c3RvcC1vcGFjaXR5OjAuMyIvPjxzdG9wIG9mZnNldD0iNTAlIiBzdHlsZT0ic3RvcC1jb2xvcjojZmZmZjAwO3N0b3Atb3BhY2l0eTowLjUiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiNmZjAwMDA7c3RvcC1vcGFjaXR5OjAuNyIvPjwvbGluZWFyR3JhZGllbnQ+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiNmNWY1ZjUiLz48cmVjdCB4PSI0MCIgeT0iNDAiIHdpZHRoPSIzMjAiIGhlaWdodD0iMjIwIiBmaWxsPSJ1cmwoI2hlYXQpIiByeD0iMTAiLz48dGV4dCB4PSIyMDAiIHk9IjI4MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSIjNjY2IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5EaWZmZXJlbmNlIEhlYXRtYXA8L3RleHQ+PC9zdmc+";

async function seedDemoAlert() {
  try {
    console.log("🔍 Finding organisation 'Delhi University'...");
    
    // Find the organisation
    const organisation = await prisma.organisation.findUnique({
      where: { name: "Delhi University" },
    });

    if (!organisation) {
      console.error("❌ Organisation 'Delhi University' not found!");
      console.log("Available organisations:");
      const orgs = await prisma.organisation.findMany({ select: { name: true } });
      orgs.forEach(org => console.log(`  - ${org.name}`));
      return;
    }

    console.log("✅ Found organisation:", organisation.name);

    // Find a certificate for Ananya Sharma
    console.log("🔍 Finding certificate for 'Ananya Sharma'...");
    
    const certificate = await prisma.certificate.findFirst({
      where: {
        name: { contains: "Ananya", mode: "insensitive" },
      },
    });

    if (!certificate) {
      console.error("❌ Certificate for 'Ananya Sharma' not found!");
      console.log("Available certificates:");
      const certs = await prisma.certificate.findMany({ 
        take: 10,
        select: { id: true, name: true, certificateId: true } 
      });
      certs.forEach(cert => console.log(`  - ${cert.name} (${cert.certificateId})`));
      return;
    }

    console.log("✅ Found certificate:", certificate.name, "-", certificate.certificateId);

    // Create demo alert
    console.log("📝 Creating demo alert...");
    
    const alert = await prisma.alert.create({
      data: {
        certificateId: certificate.id,
        organisationId: organisation.id,
        message: "Demo Alert: Certificate verification request. Similarity: 100.00%, Tampering Score: 0.00%",
        status: "pending",
        similarityScore: 1.0,
        tamperingScore: 0.0,
        tamperedImage: demoTamperedImage,
        heatmapImage: demoHeatmapImage,
        extractedFields: JSON.stringify({
          certificateId: certificate.certificateId,
          name: certificate.name,
          courseName: certificate.courseName,
          nqrCode: certificate.nqrCode || "CSE-150",
          apaarId: certificate.apaarId || "3",
          year: certificate.year || "2025",
        }),
      },
      include: {
        certificate: true,
        organisation: true,
      },
    });

    console.log("\n✅ Demo Alert Created Successfully!");
    console.log("=====================================");
    console.log("Alert ID:", alert.id);
    console.log("Certificate:", alert.certificate.name);
    console.log("Organisation:", alert.organisation.name);
    console.log("Similarity Score:", (alert.similarityScore * 100).toFixed(1) + "%");
    console.log("Tampering Score:", (alert.tamperingScore * 100).toFixed(1) + "%");
    console.log("Has Tampered Image:", !!alert.tamperedImage);
    console.log("Has Heatmap Image:", !!alert.heatmapImage);
    console.log("Status:", alert.status);
    console.log("=====================================");
    console.log("\n🎉 Go to /organizations page to see the alert!");

  } catch (error) {
    console.error("❌ Error creating demo alert:", error);
  } finally {
    await prisma.$disconnect();
  }
}

seedDemoAlert();
