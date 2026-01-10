import { NextRequest, NextResponse } from 'next/server';

// Temporary in-memory storage for demo
// In production, use AWS S3, Cloudinary, or similar
const uploadedFiles = new Map<string, string>();

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const fieldId = formData.get('fieldId') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only PDF, JPG, PNG, DOC, DOCX allowed' },
        { status: 400 }
      );
    }

    // In production, upload to cloud storage
    // For now, store in memory with a fake URL
    const fileId = `${Date.now()}-${file.name}`;
    const fakeUrl = `/uploads/${fileId}`;
    
    // Store file metadata
    uploadedFiles.set(fileId, file.name);

    // TODO: In production, implement actual cloud storage upload
    // Example with Cloudinary:
    // const arrayBuffer = await file.arrayBuffer();
    // const buffer = Buffer.from(arrayBuffer);
    // const result = await cloudinary.uploader.upload_stream(...).end(buffer);
    // return NextResponse.json({ url: result.secure_url });

    return NextResponse.json({ 
      url: fakeUrl,
      filename: file.name,
      size: file.size,
      type: file.type,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}
