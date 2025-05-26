// src/app/api/share/[token]/info/route.js
import { NextResponse } from 'next/server';
import connectToMongoDB from '../../../../../lib/mongodb';
import { PdfFile } from '../../../../../models';

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

    // Find the file by share token and populate uploader info
    const file = await PdfFile.findOne({ shareToken: token })
      .populate('uploadedBy', 'name email')
      .select('originalName fileSize createdAt uploadedBy shareToken');

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'File not found or share link expired' },
        { status: 404 }
      );
    }

    // Return file metadata (without sensitive information)
    return NextResponse.json({
      success: true,
      file: {
        id: file._id,
        name: file.originalName,
        size: file.fileSize,
        createdAt: file.createdAt,
        sharedBy: {
          name: file.uploadedBy.name,
          email: file.uploadedBy.email
        }
      }
    });

  } catch (error) {
    console.error('Share file info error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load file information' },
      { status: 500 }
    );
  }
}