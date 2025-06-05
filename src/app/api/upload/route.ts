import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided.' }, { status: 400 })
    }

    // In a real application, you would upload the file to a storage service (S3, Cloudinary, etc.)
    // and get a permanent URL.
    // For this simulation, we'll just use the filename and a placeholder path.
    // You might also generate a unique ID for the filename to avoid collisions.
    const filename = encodeURIComponent(file.name)
    const mockFileUrl = `/uploads/mock/${Date.now()}_${filename}`

    // Simulate some processing delay
    await new Promise(resolve => setTimeout(resolve, 1000))

    return NextResponse.json({ success: true, url: mockFileUrl }, { status: 200 })
  } catch (error) {
    console.error('Upload error:', error)
    let errorMessage = 'An unknown error occurred during file upload.'
    if (error instanceof Error) {
        errorMessage = error.message
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
