import { v2 as cloudinary } from "cloudinary";
import { PrismaClient } from "@prisma/client";
import { getSession } from "next-auth/react";
import AdmZip from "adm-zip";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request) {
  const session=await getSession();
  const id=session.user.id;
  const name=session.user.name;
  const prisma = new PrismaClient();

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
      const res=await fetch("http://localhost:5001/extract", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              filename: entry.entryName,
                              b64: base64Data,
                            }),
                          });
      const fields=res.results[0].fields;
      fields.organisation_id=org.id;

      const finalFields={};
      finalFields.name=fields.name;
      finalFields.degree=fields.degree;
      finalFields.certificateId=fields.certificate_id||null;
      finalFields.rollNo=fields.roll_no||null;
      finalFields.year=fields.year||null;
      finalFields.honor=fields.honor||null;
      finalFields.grade=fields.grade||null;


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
            folder: "pdfs",
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