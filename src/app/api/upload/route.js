import { v2 as cloudinary } from "cloudinary";
import {prisma} from "@/lib/prisma";
import { getSession } from "next-auth/react";
import AdmZip from "adm-zip";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connect } from "http2";

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


  const org=await prisma.organisation.findUnique({
    where:{id:id}
  });

  try {
    // Receive zip file as base64 string in JSON body
    const { zipBase64 } = await request.json();

    // Convert base64 to buffer
    const zipBuffer = Buffer.from(zipBase64, "base64");

    // Extract PDFs, JPGs, and PNGs from zip
    const zip = new AdmZip(zipBuffer);
    const allowedExtensions = [".pdf", ".jpg", ".jpeg", ".png"];
    const entries = zip.getEntries().filter((entry) =>
      allowedExtensions.some(ext => entry.entryName.toLowerCase().endsWith(ext))
    );

    const uploadResults = [];

    for (const entry of entries) {
      const fileBuffer = entry.getData();
      const base64Data = fileBuffer.toString("base64");
      console.log(`Processing file: ${entry.entryName}`);
      
      const ocrResponse = await fetch("http://localhost:5001/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: entry.entryName,
          b64: base64Data,
        }),
      });

      console.log(`OCR Response Status: ${ocrResponse.status}`);

      if (!ocrResponse.ok) {
        console.error(`OCR request failed for ${entry.entryName}:`, ocrResponse.status);
        continue;
      }

      const res = await ocrResponse.json();
      console.log(`OCR Response:`, res);

      if (!res.results || !res.results[0] || !res.results[0].fields) {
        console.error(`Invalid OCR response structure:`, res);
        continue;
      }

      const fields = res.results[0].fields;
      fields.organisation_id = org.id;

      const finalFields = {
        name: String(fields.name || ""),                  // required
        degree: fields.degree ? String(fields.degree) : null,
        certificateId: fields.certificate_id ? String(fields.certificate_id) : null,
        rollNo: fields.roll_no ? String(fields.roll_no) : null,
        year: fields.year ? String(fields.year) : null,
        honors: fields.honors ? String(fields.honors) : null,
        grade: fields.grade ? String(fields.grade) : null,
        organisation: {
          connect: { id: org.id }  // keep as is
        }
      };


      const ext = entry.entryName.split('.').pop().toLowerCase();
      let resourceType = "raw";
      if (["jpg", "jpeg", "png"].includes(ext)) {
        resourceType = "image";
      }

      const publicId = `${name}/${entry.entryName.replace(/\.(pdf|jpg|jpeg|png)$/i, "")}`;

      // Check if file exists
      let exists = false;
      try {
        await cloudinary.api.resource(publicId, { resource_type: resourceType });
        exists = true;
      } catch (err) {
        if (err.error && err.error.http_code !== 404) throw err;
      }

      if (exists) {
        console.log(`File ${publicId} already exists. Skipping upload.`);
        const resource = await cloudinary.api.resource(publicId, { resource_type: resourceType });
        uploadResults.push({
          fileName: entry.entryName,
          url: resource.secure_url,
        });
        continue;
      }

      const uploadResult = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          {
            resource_type: resourceType,
            folder:name,
            public_id: entry.entryName.replace(/\.(pdf|jpg|jpeg|png)$/i, ""),
            unique_filename: "false",
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        ).end(fileBuffer);
      });

      finalFields.url=uploadResult.secure_url;

      await prisma.certificate.create({
        data:finalFields,
      });

      uploadResults.push({
        fileName: entry.entryName,
        url: uploadResult.secure_url,
      });
    }

    return new Response(JSON.stringify({ files: uploadResults }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.log(error);
    return new Response(JSON.stringify({ error: "Upload failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}