import { NextResponse } from "next/server";
import { createCanvas, loadImage } from "canvas";
import cloudinary from "@/utils/cloudinary";
import path from "path";
import fs from "fs";
import crypto from "crypto";

// Configuration
const ALGORITHM = 'aes-256-cbc';
const ENCRYPTION_KEY = process.env.CERTIFICATE_ENCRYPTION_KEY || 'default_secret_key_32_bytes_long!!'; // Ensure this matches env
const IV_LENGTH = 16;

// Helper: Generate SHA-256 Hash
function generateDataHash(data) {
  return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
}

// Helper: Encrypt Data
function encryptData(text) {
  // Ensure key is 32 bytes (using scrypt to derive/expand if needed or just Buffer if exact)
  // For safety, let's derive a 32-byte key from the provided string to be robust
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

// Helper: Embed Steganography (LSB)
function embedSteganography(ctx, width, height, message) {
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  // Protocol: Length (32-bit binary) + Message (Binary)
  const binaryMessage = message.split('').map(char =>
    char.charCodeAt(0).toString(2).padStart(8, '0')
  ).join('');

  const lengthBinary = message.length.toString(2).padStart(32, '0');
  const fullBinary = lengthBinary + binaryMessage;

  if (fullBinary.length > data.length * 0.75) {
    console.warn("Message too long for steganography capacity");
  }

  let dataIdx = 0;
  for (let i = 0; i < fullBinary.length; i++) {
    if (dataIdx >= data.length) break;

    // Skip Alpha channel (Every 4th byte: R, G, B, [A])
    if ((dataIdx + 1) % 4 === 0) dataIdx++;

    const bit = parseInt(fullBinary[i], 10);
    data[dataIdx] = (data[dataIdx] & ~1) | bit; // Modify LSB
    dataIdx++;
  }

  ctx.putImageData(imgData, 0, 0);
}

// Helper: dHash (Difference Hash) - A robust perceptual hash
function computeDHash(sourceCanvas) {
  // 1. Resize to 9x8 (72 pixels)
  // We need 8 rows and 8 comparisons per row
  const width = 9;
  const height = 8;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // High quality resize usually better, but for hash simple drawImage is standard
  ctx.drawImage(sourceCanvas, 0, 0, width, height);
  const data = ctx.getImageData(0, 0, width, height).data;

  let hashBits = '';
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width - 1; x++) {
      const leftIdx = (y * width + x) * 4;
      const rightIdx = (y * width + x + 1) * 4;

      // Grayscale conversion (Luminance)
      const left = data[leftIdx] * 0.299 + data[leftIdx + 1] * 0.587 + data[leftIdx + 2] * 0.114;
      const right = data[rightIdx] * 0.299 + data[rightIdx + 1] * 0.587 + data[rightIdx + 2] * 0.114;

      hashBits += (left > right ? '1' : '0');
    }
  }

  // Convert binary string to Hex
  // 64 bits matches 16 hex chars
  const hex = BigInt('0b' + hashBits).toString(16).padStart(16, '0');
  return hex;
}

// Helper function to generate a single certificate
async function generateSingleCertificate(certData) {
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
  drawText(name, centerX, 350, "38px 'Times New Roman'", "center");
  drawText(courseName || "", centerX, 450);
  drawText(year || "", centerX, 565);

  // LEFT SIDE
  drawText(`${organisation || ""}`, 200, 700, "28px Serif", "left");
  drawText(`${certificateId}`, 200, 800, "28px Serif", "left");

  // RIGHT SIDE
  drawText(`${courseId || nqrCode || ""}`, 800, 700, "28px Serif", "left");
  drawText(`${apaarId || ""}`, 800, 800, "28px Serif", "left");

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

  // 2. Generate Hash
  const certificateHash = generateDataHash(identityData);

  // 3. Encrypt Hash
  const encryptedHash = encryptData(certificateHash);

  // 4. Embed in Image
  embedSteganography(ctx, CANVAS_WIDTH, CANVAS_HEIGHT, encryptedHash);

  // 5. Generate pHash (from modified buffer/canvas)
  // We pass the canvas directly to our custom function
  const pHash = computeDHash(canvas);

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
    pHash,
    certificateHash,
    encryptedHash, // Optional: return if needed for debug/verification
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
            organisation: certData.Organisation || certData.organisation || certData['Organisation'] || null,
            organisationId: certData.OrganisationId || certData.organisationId || certData['Organisation ID'] || null,
            nqrCode: certData.NqrCode || certData.nqrCode || certData['NQR Code'] || null,
          });

          // Append URL and Hashes to original certificate data
          processedCertificates.push({
            ...certData,
            url: result.url,
            publicId: result.publicId,
            pHash: result.pHash,
            certificateHash: result.certificateHash,
            encryptedHash: result.encryptedHash,
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

    const result = await generateSingleCertificate({ name, courseName, year, certificateId, courseId, apaarId, organisation, organisationId, nqrCode });

    return NextResponse.json(
      {
        success: true,
        url: result.url,
        publicId: result.publicId,
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
