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
      contents: `
        From the certificate text below, extract the following fields:
        - Name of the recipient
        - Degree name
        
        - Honors or distinction if mentioned
        - Roll number
        - Grade
        

        Return the result as a valid JSON object only, JSON object ONLY, without any explanations, comments, or extra text.
        Important:
        - Always include all keys in the JSON.
        - If a field is not present in the text, set its value to null.                                               
        Keys: "name", "degree", "honors", "roll_number", "grade", "organisation", "organisation_id".

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
