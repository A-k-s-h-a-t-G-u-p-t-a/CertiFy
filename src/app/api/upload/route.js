import { v2 as cloudinary } from "cloudinary";
import AdmZip from "adm-zip";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request) {
  try {
    // Receive zip file as base64 string in JSON body
    const { zipBase64 } = await request.json();

    // Convert base64 to buffer
    const zipBuffer = Buffer.from(zipBase64, "base64");

    // Extract PDFs from zip
    const zip = new AdmZip(zipBuffer);
    const pdfEntries = zip.getEntries().filter((entry) => entry.entryName.endsWith(".pdf"));

    const uploadResults = [];

    for (const entry of pdfEntries) {
      const pdfBuffer = entry.getData();
      // Upload PDF buffer to Cloudinary
      const publicId = `pdfs/${entry.entryName.replace(/\.pdf$/, "")}`;

      // Check if file exists
      let exists = false;
      try {
        await cloudinary.api.resource(publicId, { resource_type: "raw" });
        exists = true;
      } catch (err) {
        // If not found, Cloudinary throws an error with http_code 404
        if (err.error && err.error.http_code !== 404) throw err;
      }
      
      if (exists) {
        console.log(`File ${publicId} already exists. Skipping upload.`);
        const resource = await cloudinary.api.resource(publicId, { resource_type: "raw" });
        uploadResults.push({
          fileName: entry.entryName,
          url: resource.secure_url,
        });
        continue;
      }

      const uploadResult = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          {
            resource_type: "raw", // For non-image files like PDFs
            folder: "pdfs",
            public_id: entry.entryName.replace(/\.pdf$/, ""),
            unique_filename: "false",
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        ).end(pdfBuffer);
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