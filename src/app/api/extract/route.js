import { GoogleGenAI } from "@google/genai"; 

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req) {
  try {
    const body = await req.json();
    const { rawText } = body;

    if (!rawText) {
      return new Response(
        JSON.stringify({ message: "Missing rawText in request body" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Ask Gemini
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `From the certificate text below, extract the following fields:

- Name of the recipient: the full name of the person who received the certificate.
- Degree name: the official degree or certification awarded (e.g., "Bachelor of Science in Computer Science", "Diploma in Data Analytics").
- Honors or distinction: any honors, awards, or special mentions like "First Class", "Summa Cum Laude", "With Distinction". If not present, set as null.
- Roll number: the unique ID of the student, usually numeric or alphanumeric, **not more than 8 characters**, and **never a long hexadecimal string**. Only provide if you are very confident it fits this format; otherwise set it as null. If more than 6-7 characters , then dont limit it to 8 characters. Rather set it as null
- Grade: any letter grade, percentage, or CGPA mentioned on the certificate. If not present, set as null.
- Organisation: the name of the issuing institution or organization.
- Certificate ID: a unique identifier for the certificate, usually **a long hexadecimal string** (always extract if present). This is **different from roll number**.

Return the result as a valid JSON object **only**, without any explanations, comments, or extra text.

Important:
- Always include all keys in the JSON.
- If a field is not present in the text, set its value to null.
- For roll number, only include it if you are confident it is a short ID (≤8 characters) and is **not a long hexadecimal string**.
- For certificateId, always extract it if it exists; it is usually a long hexadecimal string and may include letters and numbers.

Keys: "name", "degree", "honors", "rollNo", "grade", "organisation", "certificateId".

Examples:

Input text: "This is to certify that John Doe has successfully completed Bachelor of Science in Computer Science, Roll No: 12345, with First Class Honors. Certificate ID: 4a7f3c9e8b6d4f12. Issued by MIT."

Output JSON:
{
  "name": "John Doe",
  "degree": "Bachelor of Science in Computer Science",
  "honors": "First Class",
  "rollNo": "12345",
  "grade": null,
  "organisation": "MIT",
  "certificateId": "4a7f3c9e8b6d4f12"
}

Input text: "Certificate awarded to Jane Smith for completing Diploma in Data Analytics. Certificate ID: ab12cd34ef56. Issued by Stanford University."

Output JSON:
{
  "name": "Jane Smith",
  "degree": "Diploma in Data Analytics",
  "honors": null,
  "rollNo": null,
  "grade": null,
  "organisation": "Stanford University",
  "certificateId": "ab12cd34ef56"
}

Now process the input:

Input text: """${rawText}"""

`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            name: { type: "string" },
            degree: { type: "string" },
            
            honors: { type: "string" },
            roll_number: { type: "string" },
            grade: { type: "string" },
            
          },
          required: [],
          additionalProperties: false,
        },
      },
    });

    const text = response.text;

    // Parse JSON safely
    let fields;
    try {
      fields = JSON.parse(text);
    } catch (err) {
      console.error("Failed to parse Gemini response:", text);
      return new Response(
        JSON.stringify({ message: "Invalid AI response format" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ fields }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in /api/extract:", error);
    return new Response(
      JSON.stringify({ message: "Server error", error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
