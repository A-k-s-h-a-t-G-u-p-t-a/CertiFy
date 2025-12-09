import { NextResponse } from "next/server";
import { createCanvas, loadImage } from "canvas";
import cloudinary from "@/utils/cloudinary";
import { computeFileHash, getZeroDataHash, getZeroEncryption } from "@/utils/phash";
import path from "path";
import fs from "fs";

/**
 * Compute SHA-256 hash of identity data object
 */
export async function computeDataHash(identityData) {
  try {
    const jsonString = JSON.stringify(identityData, Object.keys(identityData).sort());
    const encoder = new TextEncoder();
    const data = encoder.encode(jsonString);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashHex = Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");
    return "0x" + hashHex;
  } catch (error) {
    console.error("Error computing data hash:", error);
    throw new Error("Failed to compute data hash");
  }
}

// ------------------------------------------------------
// LSB STEGANOGRAPHY
// ------------------------------------------------------
function embedDataInImage(canvas, data) {
  const ctx = canvas.getContext("2d");
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = imageData.data;

  const dataString = typeof data === "string" ? data : JSON.stringify(data);
  const dataLength = dataString.length;

  let lengthBinary = dataLength.toString(2).padStart(32, "0");

  // Store length
  for (let i = 0; i < 32; i++) {
    pixels[i * 4] = (pixels[i * 4] & 0xfe) | parseInt(lengthBinary[i]);
  }

  let binaryData = "";
  for (let i = 0; i < dataLength; i++) {
    binaryData += dataString.charCodeAt(i).toString(2).padStart(8, "0");
  }

  // Store binary message
  for (let i = 0; i < binaryData.length; i++) {
    const pixelIndex = (32 + i) * 4;
    if (pixelIndex < pixels.length) {
      pixels[pixelIndex] = (pixels[pixelIndex] & 0xfe) | parseInt(binaryData[i]);
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

// ------------------------------------------------------
// GENERATE CERTIFICATE
// ------------------------------------------------------
async function generateSingleCertificate(certData, imagePack = {}) {
  const {
    name,
    courseName,
    certificateId,
    organisation,
    organisationId,
    nqrCode,
    apaarId,
    year,
    degree, // job role per schema

    // NEW FIELDS
    dateOfBirth,
    enrolmentNo,
    district,
    state,
    placeOfIssue,
    dateOfIssue,
    duration,
    grade,
    creditsAtTrainingCentre,
    
    // ADDITIONAL FIELDS
    fatherName,
    assessedBy,
    nsqfLevel,
  } = certData;

  // Extract images from imagePack
  const {
    candidatePhoto,
    organisationLogo,
    qrCodeImage,
    schemeLogo,
    awardingBodyLogo,
    blockchainSeal,
  } = imagePack;

  if (!name) throw new Error("Name is required");
  if (!certificateId) throw new Error("Certificate ID is required");

  const templatePath = path.join(process.cwd(), "public", "cert-template.png");
  if (!fs.existsSync(templatePath)) throw new Error("Template not found");

  const template = await loadImage(templatePath);

  const CANVAS_WIDTH = 1200;
  const CANVAS_HEIGHT = 900;
  const canvas = createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // ------------------------------------------------------
  // DRAW TEMPLATE EXACT FIT
  // ------------------------------------------------------
  ctx.drawImage(template, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // ------------------------------------------------------
  // TEXT UTILITY
  // ------------------------------------------------------
  function drawText(txt, x, y, font = "24px 'Times New Roman'", align = "left") {
    if (!txt) return;
    ctx.fillStyle = "#1A1A1A";
    ctx.font = font;
    ctx.textAlign = align;
    ctx.fillText(txt, x, y);
  }

  // ------------------------------------------------------
  // DATE FORMATTING UTILITY
  // ------------------------------------------------------
  function formatDate(dateValue) {
    if (!dateValue) return "";
    try {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return String(dateValue);
      // Format as DD/MM/YYYY
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch (e) {
      return String(dateValue);
    }
  }

  // ------------------------------------------------------
  // POSITIONS (Mapped to certificate in image)
  // ------------------------------------------------------

  // **Name of Candidate**
  drawText(name, 390, 415);
  
  // **Son/Daughter/Ward of**
  drawText(fatherName, 330, 475);

  // **Date of Birth**
  drawText(formatDate(dateOfBirth), 700, 475);

  // **Enrolment No**
  drawText(enrolmentNo, 1100, 470, "24px 'Times New Roman'", "right");

  // **Assessed by**
  drawText(assessedBy, 330, 530);

  // **Job role qualification (degree)**
  drawText(degree, 330, 590);

  // **NSQF Level**
  drawText(nsqfLevel, 1150, 590, "24px 'Times New Roman'", "right");

  // **Duration**
  drawText(duration, 200, 650);

  // **Credits at Training Centre**
  drawText(creditsAtTrainingCentre, 820, 635);

  // **District**
  drawText(district, 170, 710);

  // **State**
  drawText(state, 370, 710);

  // **Grade / %**
  drawText(grade, 530, 710, "24px 'Times New Roman'", "left");

  // **Place of Issue**
  drawText(placeOfIssue, 250, 755);

  // **Date of Issue**
  drawText(formatDate(dateOfIssue), 480, 755);

  // **Certificate Number**
  drawText(certificateId, 930, 400, "22px 'Times New Roman'", "left");

  // **APAAR ID**
  drawText(apaarId, 1015, 423, "22px 'Times New Roman'", "left");

  // ------------------------------------------------------
  // IMAGE DRAWER
  // ------------------------------------------------------
  async function drawBase64Image(base64, x, y, w, h) {
    if (!base64) return;
    try {
      const buf = Buffer.from(base64, "base64");
      const img = await loadImage(buf);
      ctx.drawImage(img, x, y, w, h);
    } catch (e) {
      console.warn("Image error:", e.message);
    }
  }

  // ------------------------------------------------------
  // IMAGE POSITIONS (Mapped to certificate)
  // ------------------------------------------------------

  // Candidate Photo (top-right box)
  await drawBase64Image(candidatePhoto, 930, 120, 190, 230);

  // Organisation Logo (top-left)
  await drawBase64Image(organisationLogo, 60, 100, 130, 130);

  // Scheme Logo (top-right above photo)
  await drawBase64Image(schemeLogo, 1020, 40, 120, 120);

  // QR Code (bottom-left)
  await drawBase64Image(qrCodeImage, 80, 760, 150, 150);

  // Blockchain Seal (bottom-center)
  await drawBase64Image(blockchainSeal, 550, 760, 140, 140);

  // Awarding Body Logo (bottom-right)
  await drawBase64Image(awardingBodyLogo, 830, 760, 180, 120);


  // ------------------------------------------------------
  //   STEGANOGRAPHY
  // ------------------------------------------------------
  const identityData = {
    certificateId,
    name,
    nqrCode: nqrCode || null,
    courseName: courseName || null,
    organisationId: organisationId || null,
    apaarId: apaarId || null,
    year: year || null,
    degree: degree || null,

    // NEW FIELDS
    dateOfBirth: dateOfBirth || null,
    enrolmentNo: enrolmentNo || null,
    district: district || null,
    state: state || null,
    placeOfIssue: placeOfIssue || null,
    dateOfIssue: dateOfIssue || null,
    duration: duration || null,
    grade: grade || null,
    creditsAtTrainingCentre: creditsAtTrainingCentre || null,
    
    // ADDITIONAL FIELDS
    fatherName: fatherName || null,
    assessedBy: assessedBy || null,
    nsqfLevel: nsqfLevel || null
  };

  embedDataInImage(canvas, identityData);

  // Final PNG
  const base64 = canvas.toDataURL("image/png");
  const base64Data = base64.split(",")[1];

  // Local Backup
  const backupDir = path.join(process.cwd(), "certificates_backup");
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

  const fileName = `${certificateId}_${Date.now()}.png`;
  const filePath = path.join(backupDir, fileName);
  fs.writeFileSync(filePath, Buffer.from(base64Data, "base64"));

  // Hashes
  const fileHash = await computeFileHash(base64Data);
  const dataHash = await computeDataHash(identityData);
  const encryptedData = getZeroEncryption();

  // Upload to Cloudinary
  const upload = await cloudinary.uploader.upload(base64, {
    folder: "certificates",
    unique_filename: true,
  });

  return {
    ...certData,
    url: upload.secure_url,
    publicId: upload.public_id,
    fileHash,
    dataHash,
    encryptedData,
    blockchainData: {
      certID: certificateId,
      filePhash: fileHash,
      dataHash,
      encryptedData
    }
  };
}

// ------------------------------------------------------
// POST HANDLER
// ------------------------------------------------------
export async function POST(req) {
  try {
    const body = await req.json();
    const { certificates, images } = body;

    // -------- BATCH MODE --------
    if (certificates && Array.isArray(certificates)) {
      const results = [];
      const errors = [];

      for (let i = 0; i < certificates.length; i++) {
        try {
          const mergedImagePack = {
            candidatePhoto: images?.candidatePhoto,
            organisationLogo: images?.organisationLogo,
            qrCodeImage: images?.qrCodeImage,
            schemeLogo: images?.schemeLogo,
            awardingBodyLogo: images?.awardingBodyLogo,
            blockchainSeal: images?.blockchainSeal
          };

          const result = await generateSingleCertificate(certificates[i], mergedImagePack);
          results.push(result);
        } catch (err) {
          console.error(`Error generating certificate ${i}:`, err);
          errors.push({
            index: i,
            name: certificates[i]?.name || 'Unknown',
            error: err.message,
            stack: err.stack
          });
        }
      }

      // If all certificates failed, return error
      if (results.length === 0 && errors.length > 0) {
        return NextResponse.json({
          success: false,
          error: "All certificates failed to generate",
          errors
        }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        certificates: results,
        errors
      });
    }

    // -------- SINGLE MODE --------
    const result = await generateSingleCertificate(body, images);

    return NextResponse.json({
      success: true,
      ...result
    });

  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Error generating certificate" }, { status: 500 });
  }
}
