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

  const org = await prisma.organisation.findUnique({
    where: { id: id }
  });

  try {
    // Receive Excel file as base64 string in JSON body
    const { excelBase64 } = await request.json();

    console.log(" Processing Excel file upload...");

    // Send Excel file to Python OCR server
    const ocrResponse = await fetch("http://localhost:5001/upload/excel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filename: `${name}/certificates.xlsx`, // You can make this dynamic
        b64: excelBase64,
      }),
    });

    console.log(`OCR Response Status: ${ocrResponse.status}`);

    if (!ocrResponse.ok) {
      console.error("Excel processing failed:", ocrResponse.status);
      return new Response(JSON.stringify({ error: "Excel processing failed" }), {
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

    const certificatesData = excelData.data; // Array of certificate objects

    const json_certificates_data={
      certificates:certificatesData
    };
    
    const finalResponse=await fetch("http://localhost:3000/certificate/generate", {
      method:"POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(json_certificates_data),
    });
    
    const finalResponseData=await finalResponse.json();

    console.log(" Final Certificate Generation Response:", finalResponseData);

    certificatesData=finalResponseData.certificates;

    const createdCertificates = [];

    console.log(`Processing ${certificatesData.length} certificates from Excel...`);

    // Process each certificate record from Excel
    for (let i = 0; i < certificatesData.length; i++) {
      const certData = certificatesData[i];
      console.log(`Processing certificate ${i + 1}:`, certData);

      try {
        // Map Excel columns to your certificate schema
        // Adjust these field names based on your Excel columns
        const finalFields = {
          name: String(certData.Name || certData.name || ""),
          degree: String(certData.Degree || certData.degree || null),
          certificateId: String(certData.CertificateId || certData.certificateId || certData['Certificate ID'] || null),
          rollNo: String(certData.RollNo || certData.rollNo || certData['Roll Number'] || null),
          year: String(certData.Year || certData.year || null),
          honors: String(certData.Honors || certData.honors || certData.Honours || null),
          grade: String(certData.Grade || certData.grade || null),
          url: String(certData.URL || certData.url || null), // If Excel contains URLs
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
          degree: createdCert.degree,
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
    return new Response(JSON.stringify({ error: "Upload failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}