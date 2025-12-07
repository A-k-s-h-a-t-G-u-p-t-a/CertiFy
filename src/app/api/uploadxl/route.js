import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

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
    // Receive Excel file as base64 string in JSON body
    const { excelBase64 } = await request.json();

    console.log(" Processing Excel file upload...");

    // Send Excel file to Python OCR server
    const ocrResponse = await fetch("http://localhost:5001/upload/excel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filename: `${name}/certificates.xlsx`,
        b64: excelBase64,
      }),
    }).catch(err => {
      console.error("Failed to connect to Python OCR service:", err);
      throw new Error("OCR service unavailable. Please ensure Python service is running on port 5001.");
    });

    console.log(`OCR Response Status: ${ocrResponse.status}`);

    if (!ocrResponse.ok) {
      const errorText = await ocrResponse.text();
      console.error("Excel processing failed:", ocrResponse.status, errorText);
      return new Response(JSON.stringify({ 
        error: `Excel processing failed: ${errorText || 'Unknown error'}` 
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const excelData = await ocrResponse.json();
    console.log(" Excel Data received:", excelData);

    // Check if we got valid data
    if (!excelData.success || !excelData.data) {
      console.error("Invalid Excel data structure:", excelData);
      return new Response(JSON.stringify({ error: "Invalid Excel data" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    let certificatesData = excelData.data; // Array of certificate objects

    const json_certificates_data={
      certificates:certificatesData
    };
    
    const finalResponse=await fetch("http://localhost:3000/api/certificate/generate", {
      method:"POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(json_certificates_data),
    }).catch(err => {
      console.error("Failed to call certificate generation API:", err);
      throw new Error("Certificate generation service unavailable.");
    });
    
    if (!finalResponse.ok) {
      const errorText = await finalResponse.text();
      console.error("Certificate generation failed:", finalResponse.status, errorText);
      throw new Error(`Certificate generation failed: ${errorText}`);
    }
    
    const finalResponseData = await finalResponse.json();

    console.log(" Final Certificate Generation Response:", finalResponseData);

    if (!finalResponseData.success) {
      throw new Error(finalResponseData.error || "Certificate generation failed");
    }

    certificatesData = finalResponseData.certificates;

    const createdCertificates = [];

    console.log(`Processing ${certificatesData.length} certificates from Excel...`);

    // Process each certificate record from Excel
    for (let i = 0; i < certificatesData.length; i++) {
      const certData = certificatesData[i];
      console.log(`Processing certificate ${i + 1}:`, certData);

      try {
        // Validate required fields
        const name = String(certData.Name || certData.name || "").trim();
        if (!name) {
          console.error(`Certificate ${i + 1}: Missing name`);
          continue;
        }

        // Generate certificateId if not provided
        let certificateId = String(certData.CertificateId || certData.certificateId || certData['Certificate ID'] || "").trim();
        if (!certificateId) {
          certificateId = `CERT_${Date.now()}_${i + 1}`; // Generate unique ID
        }

        // Map Excel columns to your certificate schema
        const finalFields = {
          name: name,
          certificateId: certificateId,
          courseName: String(certData.CourseName || certData.courseName || certData['Course Name'] || null),
          nqrCode: String(certData.CourseId || certData.courseId || certData['Course ID'] || null),
          year: String(certData.Year || certData.year || null),
          url: String(certData.URL || certData.url || null),
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
        });

        console.log(` Certificate ${i + 1} created successfully`);

      } catch (error) {
        console.error(` Error creating certificate ${i + 1}:`, error);
        // Continue with next certificate instead of failing completely
        continue;
      }
    }

    console.log(` Successfully processed ${createdCertificates.length} certificates`);

    return new Response(JSON.stringify({ 
      success: true,
      message: `Successfully processed ${createdCertificates.length} certificates`,
      totalRows: certificatesData.length,
      successfulCreations: createdCertificates.length,
      certificates: createdCertificates,
      excelColumns: excelData.columns
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error(" Upload Excel error:", error);
    return new Response(JSON.stringify({ 
      error: error.message || "Upload failed",
      details: error.stack 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}