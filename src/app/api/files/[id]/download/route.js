import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import connectToMongoDB from '../../../../../lib/mongodb';
import { PdfFile } from '../../../../../models';

export async function GET(request, { params }) {
  try {
    await connectToMongoDB();

    // Find the file (public files only for downloads)
    const file = await PdfFile.findOne({
      _id: params.id,
      isPublic: true
    });

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'File not found or not public' },
        { status: 404 }
      );
    }

    // Increment download count
    await PdfFile.findByIdAndUpdate(params.id, {
      $inc: { downloadCount: 1 }
    });

    // Get file path
    const filePath = path.join(process.cwd(), 'public', file.filePath);

    try {
      // Check if file exists
      await fs.access(filePath);
      
      // Read file
      const fileBuffer = await fs.readFile(filePath);

      // Create response with file
      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${file.originalName}"`,
          'Content-Length': fileBuffer.length.toString(),
        },
      });

    } catch (err) {
      console.error('File read error:', err);
      return NextResponse.json(
        { success: false, error: 'File not accessible' },
        { status: 404 }
      );
    }

  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to download file' },
      { status: 500 }
    );
  }
}