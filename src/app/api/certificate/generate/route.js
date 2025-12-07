import { NextResponse } from "next/server";
import { createCanvas, loadImage } from "canvas";
import cloudinary from "@/utils/cloudinary";
import path from "path";
import fs from "fs";

// Helper function to generate a single certificate
async function generateSingleCertificate(certData) {
  const { name, courseName, year, certificateId, courseId, apaarId } = certData;

  if (!name) {
    throw new Error("Name is required");
  }

  if (!certificateId) {
    throw new Error("Certificate ID is required");
  }

  const templatePath = path.join(process.cwd(), "public", "cert.png");

  if (!fs.existsSync(templatePath)) {
    throw new Error("Template not found");
  }

  const template = await loadImage(templatePath);

  const canvas = createCanvas(template.width, template.height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(template, 0, 0);

  ctx.fillStyle = "#000";
  ctx.textAlign = "center";
  ctx.font = "32px Serif";

  // Build the certificate sentence
  let sentence = `This is to certify that ${name}`;
  if (certificateId) sentence += `, bearing certificate ID ${certificateId}`;
  if (courseId) sentence += ` (Course Code: ${courseId})`;
  if (courseName) sentence += `, has successfully completed the ${courseName} course`;
  if (year) sentence += ` in the year ${year}`;
  if (apaarId) sentence += `. APAAR ID: ${apaarId}`;
  sentence += ".";

  // --- TEXT WRAPPING FUNCTION ---
  function wrapText(text, x, y, maxWidth, lineHeight) {
    const words = text.split(" ");
    let line = "";

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + " ";
      const testWidth = ctx.measureText(testLine).width;

      if (testWidth > maxWidth) {
        ctx.fillText(line, x, y);
        line = words[n] + " ";
        y += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, y);
    return y;
  }

  // DRAW MULTI-LINE TEXT
  const centerX = template.width / 2;
  const startY = 450;
  const maxTextWidth = template.width * 0.75; // 75% width area
  const lineHeight = 40;

  wrapText(sentence, centerX, startY, maxTextWidth, lineHeight);

  // Upload to Cloudinary
  const base64 = canvas.toDataURL("image/png");

  const upload = await cloudinary.uploader.upload(base64, {
    folder: "certificates",
    unique_filename: true,
  });

  return {
    ...certData,
    url: upload.secure_url,
    publicId: upload.public_id,
  };
}

export async function POST(req) {
  try {
    const body = await req.json();
    
    // Check if it's a batch request (array of certificates) or single certificate
    const { certificates } = body;

    // Batch processing: array of certificates
    if (certificates && Array.isArray(certificates)) {
      console.log(`Processing ${certificates.length} certificates...`);
      
      const processedCertificates = [];
      const errors = [];

      // Process each certificate one at a time
      for (let i = 0; i < certificates.length; i++) {
        const certData = certificates[i];
        console.log(`Processing certificate ${i + 1}/${certificates.length}:`, certData.name || certData.Name);

        try {
          const result = await generateSingleCertificate({
            name: certData.Name || certData.name || "",
            certificateId: certData.CertificateId || certData.certificateId || certData['Certificate ID'] || "",
            courseName: certData.CourseName || certData.courseName || certData['Course Name'] || null,
            courseId: certData.CourseId || certData.courseId || certData['Course ID'] || certData['Course Code'] || null,
            year: certData.Year || certData.year || null,
            apaarId: certData.ApaarId || certData.apaarId || certData['APAAR ID'] || null,
          });

          // Append URL to original certificate data
          processedCertificates.push({
            ...certData,
            url: result.url,
            publicId: result.publicId,
          });

          console.log(` Certificate ${i + 1} generated successfully`);

        } catch (error) {
          console.error(` Error generating certificate ${i + 1}:`, error.message);
          errors.push({
            index: i,
            name: certData.Name || certData.name,
            error: error.message,
          });
          // Continue processing remaining certificates
          continue;
        }
      }

      console.log(` Completed: ${processedCertificates.length}/${certificates.length} certificates generated`);

      return NextResponse.json(
        {
          success: true,
          message: `Generated ${processedCertificates.length} out of ${certificates.length} certificates`,
          totalRequested: certificates.length,
          successfulCount: processedCertificates.length,
          certificates: processedCertificates,
          errors: errors.length > 0 ? errors : undefined,
        },
        { status: 200 }
      );
    }

    // Single certificate processing (backward compatibility)
    const { name, courseName, year, certificateId, courseId, apaarId } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    if (!certificateId) {
      return NextResponse.json({ error: "Certificate ID is required" }, { status: 400 });
    }

    const result = await generateSingleCertificate({ name, courseName, year, certificateId, courseId, apaarId });

    return NextResponse.json(
      {
        success: true,
        url: result.url,
        publicId: result.publicId,
      },
      { status: 200 }
    );

  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Error generating certificate" },
      { status: 500 }
    );
  }
}
