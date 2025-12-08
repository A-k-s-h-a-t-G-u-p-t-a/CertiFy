import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { 
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Access user data securely
  const { id, username, role, name } = session.user;

  // Validate user role
  if (role !== 'organisation') {
    return new Response(JSON.stringify({ error: "Only organizations can save certificates" }), {
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
    // Receive certificate data from frontend
    const { certificateData, certificateUrl } = await request.json();

    console.log("Saving certificate to database...", certificateData);

    if (!certificateData) {
      return new Response(JSON.stringify({ error: "No certificate data provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Extract fields from OCR result
    const fields = certificateData.fields || {};
    
    // Validate required fields
    const name = String(fields.name || "").trim();
    if (!name) {
      return new Response(JSON.stringify({ error: "Certificate must have a name" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Generate certificateId if not provided
    let certificateId = String(fields.certificateId || "").trim();
    if (!certificateId) {
      certificateId = `CERT_${Date.now()}`;
    }

    // Prepare certificate data
    const finalFields = {
      name: name,
      certificateId: certificateId,
      courseName: String(fields.courseName || null),
      nqrCode: String(fields.nqrCode || null),
      year: String(fields.year || null),
      apaarId: String(fields.apaarId || null),
      url: String(certificateUrl || ""),
      organisation: {
        connect: { id: org.id }
      }
    };

    // Create certificate in database
    const createdCert = await prisma.certificate.create({
      data: finalFields,
    });

    console.log("Certificate saved successfully:", createdCert);

    return new Response(JSON.stringify({
      success: true,
      message: "Certificate saved successfully",
      certificate: {
        id: createdCert.id,
        name: createdCert.name,
        courseName: createdCert.courseName,
        certificateId: createdCert.certificateId,
        nqrCode: createdCert.nqrCode,
        year: createdCert.year,
        apaarId: createdCert.apaarId,
        url: createdCert.url,
      }
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Save certificate error:", error);
    return new Response(JSON.stringify({
      error: error.message || "Failed to save certificate",
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
