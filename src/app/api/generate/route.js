import { NextResponse } from "next/server"
import { spawn } from "child_process"
import path from "path"

// Certificate generation using Python script
export async function POST(req) {
  try {
    const { prompt } = await req.json()

    if (!prompt || prompt.trim() === '') {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    // Call the Python script
    const result = await generateWithPythonScript(prompt)
    
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }
    
    return NextResponse.json({ url: result.url })
    
  } catch (error) {
    console.error("Certificate generation error:", error)
    return NextResponse.json({ 
      error: "Failed to generate certificate image" 
    }, { status: 500 })
  }
}

async function generateWithPythonScript(prompt) {
  return new Promise((resolve, reject) => {
    // Path to the Python script
    const scriptPath = path.join(process.cwd(), 'PythonAPI', 'generate.py')
    
    // Spawn Python process
    const pythonProcess = spawn('python', [scriptPath, prompt], {
      cwd: path.join(process.cwd(), 'PythonAPI'),
      stdio: ['pipe', 'pipe', 'pipe']
    })

    let stdout = ''
    let stderr = ''

    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString()
    })

    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString()
    })

    pythonProcess.on('close', (code) => {
      if (code === 0) {
        try {
          const result = JSON.parse(stdout.trim())
          resolve(result)
        } catch (parseError) {
          reject(new Error(`Failed to parse Python output: ${parseError.message}`))
        }
      } else {
        reject(new Error(`Python script failed with code ${code}: ${stderr}`))
      }
    })

    pythonProcess.on('error', (error) => {
      reject(new Error(`Failed to start Python process: ${error.message}`))
    })

    // Timeout after 60 seconds
    setTimeout(() => {
      pythonProcess.kill()
      reject(new Error('Python script timed out'))
    }, 60000)
  })
}
