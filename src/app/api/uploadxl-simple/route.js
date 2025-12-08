import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  // Access user data securely
  const { id, username, role, name } = session.user;

  // Validate user role
  if (role !== 'organisation') {
    return new Response(JSON.stringify({ error: "Only organizations can upload certificates" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  const org = await prisma.organisation.findUnique({
    where: { id: id }
  });

  if (!org) {
    return new Response(JSON.stringify({ error: "Organization not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // Receive certificates array directly from frontend
    const { certificates } = await request.json();

    console.log("Processing certificates from frontend...");

    if (!certificates || !Array.isArray(certificates)) {
      return new Response(JSON.stringify({ error: "Invalid certificates data. Expected array of certificates." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // First, let's generate certificate images using the certificate generation API
    const json_certificates_data = {
      certificates: certificates
    };

    // Get the base URL for the API call
    const baseUrl = process.env.NEXTAUTH_URL || `${request.headers.get('x-forwarded-proto') || 'http'}://${request.headers.get('host') || 'localhost:3000'}`;

    let certificatesWithUrls = certificates; // Default fallback

    try {
      const finalResponse = await fetch(`${baseUrl}/api/certificate/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(json_certificates_data),
      });

      if (finalResponse.ok) {
        const finalResponseData = await finalResponse.json();
        console.log("Certificate Generation Response:", finalResponseData);

        if (finalResponseData.success && finalResponseData.certificates) {
          certificatesWithUrls = finalResponseData.certificates;
        }
      } else {
        console.warn("Certificate generation failed, proceeding without URLs");
      }
    } catch (genError) {
      console.warn("Certificate generation service unavailable, proceeding without URLs:", genError);
    }

    const createdCertificates = [];
    const errors = [];

    console.log(`Processing ${certificatesWithUrls.length} certificates...`);

    // Process each certificate record
    for (let i = 0; i < certificatesWithUrls.length; i++) {
      const certData = certificatesWithUrls[i];
      console.log(`Processing certificate ${i + 1}:`, certData);

      try {
        // Validate required fields
        const name = String(certData.Name || certData.name || "").trim();
        if (!name) {
          errors.push({
            row: i + 1,
            error: "Missing name",
            data: certData
          });
          continue;
        }

        // Generate certificateId if not provided
        let certificateId = String(certData.CertificateId || certData.certificateId || certData['Certificate ID'] || "").trim();
        if (!certificateId) {
          certificateId = `CERT_${Date.now()}_${i + 1}`;
        }

        // Map Excel columns to your certificate schema
        const finalFields = {
          name: name,
          certificateId: certificateId,
          courseName: String(certData.CourseName || certData.courseName || certData['Course Name'] || null),
          nqrCode: String(certData.CourseId || certData.courseId || certData['Course ID'] || certData['NQR Code'] || null),
          year: String(certData.Year || certData.year || null),
          apaarId: String(certData.ApaarId || certData.apaarId || certData['APAAR ID'] || null),
          url: String(certData.url || ""), // URL from certificate generation
          organisation: {
            connect: { id: org.id }
          }
        };

        // Create certificate in database
        const createdCert = await prisma.certificate.create({
          data: finalFields,
        });

        createdCertificates.push({
          id: createdCert.id,
          name: createdCert.name,
          courseName: createdCert.courseName,
          certificateId: createdCert.certificateId,
          // Pass hashes to frontend for blockchain
          pHash: certData.pHash,
          certificateHash: certData.certificateHash,
          encryptedHash: certData.encryptedHash,
        });

        console.log(`Certificate ${i + 1} created successfully`);

      } catch (error) {
        console.error(`Error creating certificate ${i + 1}:`, error);
        errors.push({
          row: i + 1,
          error: error.message,
          data: certData
        });
        continue;
      }
    }

    console.log(`Successfully processed ${createdCertificates.length} certificates`);

    return new Response(JSON.stringify({
      success: true,
      message: `Successfully processed ${createdCertificates.length} certificates`,
      totalRows: certificatesWithUrls.length,
      successfulCreations: createdCertificates.length,
      certificates: createdCertificates,
      errors: errors.length > 0 ? errors : undefined,
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Upload certificates error:", error);
    return new Response(JSON.stringify({
      error: error.message || "Upload failed",
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}