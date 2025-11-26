import { NextResponse } from "next/server";
import { createCanvas, loadImage } from "canvas";
import cloudinary from "@/utils/cloudinary";
import path from "path";
import fs from "fs";

export async function POST(req) {
  try {
    const body = await req.json();
    const { name, degree, year, honors, rollNo, grade } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const templatePath = path.join(process.cwd(), "public", "cert.png");

    if (!fs.existsSync(templatePath)) {
      return NextResponse.json({ error: "Template not found" }, { status: 500 });
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
    if (rollNo) sentence += `, bearing roll number ${rollNo}`;
    if (degree) sentence += `, has successfully completed the ${degree} degree`;
    if (honors) sentence += ` with ${honors}`;
    if (year) sentence += ` in the year ${year}`;
    if (grade) sentence += `, achieving a grade of ${grade}`;
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

    return NextResponse.json(
      {
        success: true,
        url: upload.secure_url,
        publicId: upload.public_id,
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
