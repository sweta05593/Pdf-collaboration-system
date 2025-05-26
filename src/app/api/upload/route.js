// src/app/api/upload/route.js
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/jwt';
import connectToMongoDB from '@/lib/mongodb';
import { PdfFile } from '@/models';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import crypto from 'crypto';

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(request) {
  try {
    // Check authentication
    const cookieStore = cookies();
    const token = cookieStore.get('session-token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userData = verifyToken(token);
    if (!userData) {
      return NextResponse.json(
        { success: false, error: 'Invalid session' },
        { status: 401 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { success: false, error: 'File must be a PDF' },
        { status: 400 }
      );
    }

    if (file.size > 10485760) { // 10MB
      return NextResponse.json(
        { success: false, error: 'File size must be less than 10MB' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const fileExtension = '.pdf';
    const uniqueName = `${Date.now()}-${crypto.randomBytes(16).toString('hex')}${fileExtension}`;
    
    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Write file to disk
    const filePath = join(uploadsDir, uniqueName);
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Generate share token
    const shareToken = crypto.randomBytes(32).toString('hex');

    // Save to database
    await connectToMongoDB();
    
    const pdfFile = new PdfFile({
      originalName: file.name,
      filename: uniqueName,
      filePath: `uploads/${uniqueName}`,
      fileSize: file.size,
      uploadedBy: userData.id,
      shareToken: shareToken
    });

    await pdfFile.save();

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'File uploaded successfully',
      file: {
        id: pdfFile._id,
        originalName: pdfFile.originalName,
        filename: pdfFile.filename,
        fileSize: pdfFile.fileSize,
        shareToken: pdfFile.shareToken,
        createdAt: pdfFile.createdAt
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    
    // Handle specific errors
    if (error.code === 'ENOSPC') {
      return NextResponse.json(
        { success: false, error: 'Not enough storage space' },
        { status: 507 }
      );
    }
    
    if (error.code === 'EACCES') {
      return NextResponse.json(
        { success: false, error: 'Permission denied' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Upload failed. Please try again.' },
      { status: 500 }
    );
  }
}