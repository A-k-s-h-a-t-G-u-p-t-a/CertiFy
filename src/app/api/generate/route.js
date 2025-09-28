import { NextResponse } from "next/server"
import { exec } from "child_process"
import path from "path"

export async function POST(req) {
  try {
    const { prompt } = await req.json()

    if (!prompt || prompt.trim() === '') {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    return new Promise((resolve) => {
      const pythonScriptPath = path.join(process.cwd(), "PythonAPI", "generate.py")
      
      // Set encoding options for Windows
      const options = {
        encoding: 'utf8',
        timeout: 60000, // 60 second timeout
        env: {
          ...process.env,
          PYTHONIOENCODING: 'utf-8',
          PYTHONLEGACYWINDOWSSTDIO: '1'
        }
      }
      
      // Escape quotes properly
      const escapedPrompt = prompt.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
      const command = `python "${pythonScriptPath}" "${escapedPrompt}"`
      
      console.log("Executing:", command)
      
      exec(command, options, (error, stdout, stderr) => {
        if (error) {
          console.error("Python execution error:", error)
          console.error("stderr:", stderr)
          
          // Check if it's a timeout
          if (error.killed && error.signal === 'SIGTERM') {
            resolve(NextResponse.json({ 
              error: "Request timeout. Please try with a simpler prompt." 
            }, { status: 408 }))
            return
          }
          
          resolve(NextResponse.json({ 
            error: `Generation failed: ${stderr || error.message}` 
          }, { status: 500 }))
          return
        }
        
        console.log("Python stdout:", stdout)
        
        try {
          // Look for JSON in the output
          const jsonMatch = stdout.match(/\{.*\}/s)
          if (!jsonMatch) {
            throw new Error("No JSON output found in Python response")
          }
          
          const data = JSON.parse(jsonMatch[0])
          
          if (data.error) {
            resolve(NextResponse.json({ error: data.error }, { status: 500 }))
          } else if (data.url) {
            resolve(NextResponse.json({ url: data.url }))
          } else {
            resolve(NextResponse.json({ error: "Invalid response format" }, { status: 500 }))
          }
        } catch (e) {
          console.error("JSON parse error:", e)
          console.error("Raw stdout:", stdout)
          resolve(NextResponse.json({ 
            error: `Failed to parse response: ${e.message}` 
          }, { status: 500 }))
        }
      })
    })
  } catch (error) {
    console.error("Route error:", error)
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 })
  }
}
