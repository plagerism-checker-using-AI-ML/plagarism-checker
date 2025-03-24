import { NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Create a unique filename to avoid conflicts
    const timestamp = Date.now()
    const filename = `${timestamp}-${file.name}`
    
    // Ensure the uploads directory exists
    const uploadsDir = join(process.cwd(), "public", "uploads")
    if (!existsSync(uploadsDir)) {
      console.log("Creating uploads directory:", uploadsDir)
      await mkdir(uploadsDir, { recursive: true })
    }
    
    const filePath = join(uploadsDir, filename)
    console.log("Saving file to:", filePath)

    // Save the file to public/uploads directory
    await writeFile(filePath, buffer)

    // Return the relative path that can be used to access the file
    return NextResponse.json({
      filePath: `/uploads/${filename}`,
    })
  } catch (error) {
    console.error("Error uploading file:", error)
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    )
  }
} 