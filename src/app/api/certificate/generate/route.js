import { NextResponse } from "next/server";
import { createCanvas, loadImage } from "canvas";
import cloudinary from "@/utils/cloudinary";
import { computeFileHash, getZeroDataHash, getZeroEncryption } from "@/utils/phash";
import path from "path";
import fs from "fs";



/**
 * Compute SHA-256 hash of identity data object
 * 
 * @param {Object} identityData - The identity data object to hash
 * @returns {Promise<string>} - The SHA-256 hash as a hex string (bytes32 format)
 */
export async function computeDataHash(identityData) {
  try {
    // Convert object to JSON string (deterministic order)
    const jsonString = JSON.stringify(identityData, Object.keys(identityData).sort());
    
    // Convert string to Uint8Array
    const encoder = new TextEncoder();
    const data = encoder.encode(jsonString);
    
    // Compute SHA-256 hash
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    
    // Convert to hex string
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    // Return in bytes32 format
    return '0x' + hashHex;
  } catch (error) {
    console.error('Error computing data hash:', error);
    throw new Error('Failed to compute data hash');
  }
}

// LSB Steganography: Embed data into image
function embedDataInImage(canvas, data) {
  const ctx = canvas.getContext("2d");
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = imageData.data;
  
  // Convert data to binary string
  const jsonString = JSON.stringify(data);
  const dataLength = jsonString.length;
  
  // First 32 pixels store the length of data (4 bytes = 32 bits)
  let lengthBinary = dataLength.toString(2).padStart(32, '0');
  
  for (let i = 0; i < 32; i++) {
    pixels[i * 4] = (pixels[i * 4] & 0xFE) | parseInt(lengthBinary[i]);
  }
  
  // Convert message to binary
  let binaryData = '';
  for (let i = 0; i < dataLength; i++) {
    binaryData += jsonString.charCodeAt(i).toString(2).padStart(8, '0');
  }
  
  // Embed binary data in LSB of red channel
  for (let i = 0; i < binaryData.length; i++) {
    const pixelIndex = (i + 32) * 4; // Start after length encoding
    if (pixelIndex < pixels.length) {
      pixels[pixelIndex] = (pixels[pixelIndex] & 0xFE) | parseInt(binaryData[i]);
    }
  }
  
  ctx.putImageData(imageData, 0, 0);
  return canvas;
}


// Helper function to generate a single certificate
async function generateSingleCertificate(certData, additionalImageBase64 = null) {
  const {
    name,
    courseName,
    year,
    certificateId,
    courseId,
    apaarId,
    organisation,
    nqrCode,
    organisationId,
  } = certData;

  if (!name) throw new Error("Name is required");
  if (!certificateId) throw new Error("Certificate ID is required");

  const templatePath = path.join(process.cwd(), "public", "cert-template.png");
  if (!fs.existsSync(templatePath)) throw new Error("Template not found");

  const template = await loadImage(templatePath);

  // Standardized canvas dimensions
  const CANVAS_WIDTH = 1200;
  const CANVAS_HEIGHT = 900;

  const canvas = createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
  const ctx = canvas.getContext("2d");

  // Fill with white background
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Calculate scaling and positioning to fit template while maintaining aspect ratio
  const templateAspectRatio = template.width / template.height;
  const canvasAspectRatio = CANVAS_WIDTH / CANVAS_HEIGHT;

  let drawWidth, drawHeight, drawX, drawY;

  if (templateAspectRatio > canvasAspectRatio) {
    // Template is wider, fit to width
    drawWidth = CANVAS_WIDTH;
    drawHeight = CANVAS_WIDTH / templateAspectRatio;
    drawX = 0;
    drawY = (CANVAS_HEIGHT - drawHeight) / 2;
  } else {
    // Template is taller, fit to height
    drawHeight = CANVAS_HEIGHT;
    drawWidth = CANVAS_HEIGHT * templateAspectRatio;
    drawX = (CANVAS_WIDTH - drawWidth) / 2;
    drawY = 0;
  }

  // Draw template image centered and scaled
  ctx.drawImage(template, drawX, drawY, drawWidth, drawHeight);

  // REUSABLE TEXT DRAWER
  function drawText(txt, x, y, font = "32px Serif", align = "center") {
    ctx.fillStyle = "#2A2A2A";
    ctx.font = font;
    ctx.textAlign = align;
    ctx.fillText(txt, x, y);
  }

  const centerX = CANVAS_WIDTH / 2;

  // STANDARDIZED POSITIONS FOR 1200x900 CANVAS
  drawText(name, centerX, 310, "38px 'Times New Roman'", "center");
  drawText(courseName || "", centerX, 430);
  drawText(year || "", centerX, 540);

  // LEFT SIDE
  drawText(`${organisation || ""}`, 390, 600, "28px Serif", "left");
  drawText(`${certificateId}`, 390, 680, "28px Serif", "left");

  // RIGHT SIDE
  drawText(`${courseId || nqrCode || ""}`, 800, 600, "28px Serif", "left");
  drawText(`${apaarId || ""}`, 800, 680, "28px Serif", "left");

  // Add additional image if provided
  if (additionalImageBase64) {
    try {
      const imageBuffer = Buffer.from(additionalImageBase64, 'base64');
      const additionalImage = await loadImage(imageBuffer);
      
      // Fixed size and position for the additional image at the bottom center
      const imgWidth = 120;
      const imgHeight = 80;
      const imgX = (CANVAS_WIDTH - imgWidth) / 2; // Center horizontally
      const imgY = CANVAS_HEIGHT - imgHeight - 90; // 30px from bottom
      
      ctx.drawImage(additionalImage, imgX, imgY, imgWidth, imgHeight);
    } catch (error) {
      console.warn("Failed to add additional image:", error.message);
      // Continue certificate generation without the image
    }
  }

  // --- Steganography & Hashing ---
  // 1. Construct Identity Data (Excluding URL)
  const identityData = {
    certificateId,
    name,
    nqrCode: nqrCode || null,
    courseName: courseName || null,
    organisationId: organisationId || null,
    apaarId: apaarId || null,
    year: year || null
  };

  const dataHashFinal = await computeDataHash(identityData);

  // 2. Embed identityData into certificate using steganography
  embedDataInImage(canvas, dataHashFinal);
  
  // 3. Convert to base64 after embedding data
  const base64 = canvas.toDataURL("image/png");
  
  // 4. Save certificate locally before uploading to Cloudinary
  const localStorageDir = path.join(process.cwd(), "certificates_backup");
  if (!fs.existsSync(localStorageDir)) {
    fs.mkdirSync(localStorageDir, { recursive: true });
  }
  
  const timestamp = Date.now();
  const sanitizedCertId = certificateId.replace(/[^a-zA-Z0-9-_]/g, '_');
  const localFileName = `${sanitizedCertId}_${timestamp}.png`;
  const localFilePath = path.join(localStorageDir, localFileName);
  
  // Save base64 to local file
  const base64Data = base64.split(',')[1];
  fs.writeFileSync(localFilePath, Buffer.from(base64Data, 'base64'));
  console.log(`Certificate saved locally: ${localFilePath}`);
  
  // 5. Compute file hash from base64 data
  const fileHash = await computeFileHash(base64Data);
  
  // 6. Prepare blockchain-ready hashes (for contract upload)
  const dataHash = dataHashFinal; // Using computed data hash
  const encryptedData = getZeroEncryption(); // Using zero encryption as placeholder
  
  // 7. Upload to Cloudinary
  const upload = await cloudinary.uploader.upload(base64, {
    folder: "certificates",
    unique_filename: true,
  });

  return {
    ...certData,
    url: upload.secure_url,
    publicId: upload.public_id,
    fileHash: fileHash,
    dataHash: dataHash,
    encryptedData: encryptedData,
    // Blockchain-ready data for contract call
    blockchainData: {
      certID: certificateId,
      filePhash: fileHash, // Already in bytes32 format (0x...)
      dataHash: dataHash,
      encryptedData: encryptedData
    }
  };
}

export async function POST(req) {
  try {
    const body = await req.json();

    // Check if it's a batch request (array of certificates) or single certificate
    const { certificates, additionalImage } = body;

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
            organisation: certData.Organisation || certData.organisation || certData['Organisation'] || null,
            organisationId: certData.OrganisationId || certData.organisationId || certData['Organisation ID'] || null,
            nqrCode: certData.NqrCode || certData.nqrCode || certData['NQR Code'] || null,
          }, additionalImage); // Pass additional image to generation function

          // Append URL and Hashes to original certificate data
          processedCertificates.push({
            ...certData,
            url: result.url,
            publicId: result.publicId,
            fileHash: result.fileHash,
            dataHash: result.dataHash,
            encryptedData: result.encryptedData,
            blockchainData: result.blockchainData
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
    const { name, courseName, year, certificateId, courseId, apaarId, organisation, organisationId, nqrCode } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    if (!certificateId) {
      return NextResponse.json({ error: "Certificate ID is required" }, { status: 400 });
    }

    const result = await generateSingleCertificate({ name, courseName, year, certificateId, courseId, apaarId, organisation, organisationId, nqrCode }, additionalImage);

    return NextResponse.json(
      {
        success: true,
        url: result.url,
        publicId: result.publicId,
        fileHash: result.fileHash,
        dataHash: result.dataHash,
        encryptedData: result.encryptedData,
        blockchainData: result.blockchainData,
        pHash: result.pHash,
        certificateHash: result.certificateHash,
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
