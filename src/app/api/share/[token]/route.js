// src/app/api/share/[token]/route.js
import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import connectToMongoDB from '../../../../lib/mongodb';
import { PdfFile } from '../../../../models';

export async function GET(request, { params }) {
  try {
    const { token } = params;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Share token required' },
        { status: 400 }
      );
    }

    await connectToMongoDB();

    // Find the file by share token
    const file = await PdfFile.findOne({ shareToken: token })
      .populate('uploadedBy', 'name email');

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'File not found or share link expired' },
        { status: 404 }
      );
    }

    // Check if file exists on disk
    const filePath = join(process.cwd(), 'public', file.filePath);
    
    try {
      const fileBuffer = await readFile(filePath);
      
      // Return the PDF file with appropriate headers
      return new NextResponse(fileBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `inline; filename="${file.originalName}"`,
          'Content-Length': fileBuffer.length.toString(),
          'Cache-Control': 'private, no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
    } catch (fileError) {
      console.error('File read error:', fileError);
      return NextResponse.json(
        { success: false, error: 'File not accessible' },
        { status: 404 }
      );
    }

  } catch (error) {
    console.error('Share file error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load shared file' },
      { status: 500 }
    );
  }
}

// Optional: GET file metadata without downloading
export async function HEAD(request, { params }) {
  try {
    const { token } = params;

    if (!token) {
      return new NextResponse(null, { status: 400 });
    }

    await connectToMongoDB();

    const file = await PdfFile.findOne({ shareToken: token });

    if (!file) {
      return new NextResponse(null, { status: 404 });
    }

    // Check if file exists on disk
    const filePath = join(process.cwd(), 'public', file.filePath);
    
    try {
      const stats = await require('fs/promises').stat(filePath);
      
      return new NextResponse(null, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Length': stats.size.toString(),
          'Last-Modified': stats.mtime.toUTCString()
        }
      });
    } catch (fileError) {
      return new NextResponse(null, { status: 404 });
    }

  } catch (error) {
    console.error('Head request error:', error);
    return new NextResponse(null, { status: 500 });
  }
}