import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createCanvas, loadImage } from "canvas";
import cloudinary from "@/utils/cloudinary";
import { computeFileHash, getZeroDataHash, getZeroEncryption } from "@/utils/phash";
import path from "path";
import fs from "fs";

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
    // Receive certificate data and base64 image from frontend
    const { certificateData, certificateUrl, certificateBase64 } = await request.json();

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

    let finalUrl = certificateUrl || "";
    let fileHash = null;
    let dataHash = null;
    let encryptedData = null;
    let blockchainData = null;

    // If base64 image is provided, process it with steganography and upload to Cloudinary
    if (certificateBase64) {
      try {
        console.log("Processing base64 certificate image...");
        
        // Load image from base64
        const base64Data = certificateBase64.includes('base64,') 
          ? certificateBase64.split('base64,')[1] 
          : certificateBase64;
        
        const imageBuffer = Buffer.from(base64Data, 'base64');
        const image = await loadImage(imageBuffer);
        
        // Create canvas with image dimensions
        const canvas = createCanvas(image.width, image.height);
        const ctx = canvas.getContext("2d");
        ctx.drawImage(image, 0, 0);
        
        // Construct Identity Data
        const identityData = {
          certificateId,
          name,
          nqrCode: fields.nqrCode || null,
          courseName: fields.courseName || null,
          organisationId: org.id,
          apaarId: fields.apaarId || null,
          year: fields.year || null
        };

        // Embed identityData into certificate using steganography
        console.log("Embedding identity data:", identityData);
        embedDataInImage(canvas, identityData);
        
        // Convert to base64 after embedding data
        const processedBase64 = canvas.toDataURL("image/png");
        
        // Save certificate locally before uploading to Cloudinary
        const localStorageDir = path.join(process.cwd(), "certificates_backup");
        if (!fs.existsSync(localStorageDir)) {
          fs.mkdirSync(localStorageDir, { recursive: true });
        }
        
        const timestamp = Date.now();
        const sanitizedCertId = certificateId.replace(/[^a-zA-Z0-9-_]/g, '_');
        const localFileName = `${sanitizedCertId}_${timestamp}.png`;
        const localFilePath = path.join(localStorageDir, localFileName);
        
        // Save base64 to local file
        const processedBase64Data = processedBase64.split(',')[1];
        fs.writeFileSync(localFilePath, Buffer.from(processedBase64Data, 'base64'));
        console.log(`Certificate saved locally: ${localFilePath}`);
        
        // Compute file hash from base64 data
        fileHash = await computeFileHash(processedBase64Data);
        
        // Prepare blockchain-ready hashes
        dataHash = getZeroDataHash();
        encryptedData = getZeroEncryption();
        
        // Upload to Cloudinary
        const upload = await cloudinary.uploader.upload(processedBase64, {
          folder: "certificates",
          unique_filename: true,
        });
        
        finalUrl = upload.secure_url;
        
        // Prepare blockchain data
        blockchainData = {
          certID: certificateId,
          filePhash: fileHash,
          dataHash: dataHash,
          encryptedData: encryptedData
        };
        
        console.log("Certificate processed and uploaded to Cloudinary:", finalUrl);
        
      } catch (imageError) {
        console.error("Error processing certificate image:", imageError);
        // Continue with database save even if image processing fails
      }
    }

    // Prepare certificate data
    const finalFields = {
      name: name,
      certificateId: certificateId,
      courseName: String(fields.courseName || null),
      nqrCode: String(fields.nqrCode || null),
      year: String(fields.year || null),
      apaarId: String(fields.apaarId || null),
      url: finalUrl,
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
        fileHash: fileHash,
        dataHash: dataHash,
        encryptedData: encryptedData,
        blockchainData: blockchainData
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
