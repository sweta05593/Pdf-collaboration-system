// src/app/api/files/[id]/route.js
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/jwt';
import connectToMongoDB from '../../../../lib/mongodb';
import { PdfFile } from '../../../../models';

export async function GET(request, { params }) {
  try {
    // Get session token from cookies
    const cookieStore = cookies();
    const token = cookieStore.get('session-token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify token and get user data
    const userData = verifyToken(token);
    if (!userData) {
      return NextResponse.json(
        { success: false, error: 'Invalid session' },
        { status: 401 }
      );
    }

    await connectToMongoDB();

    const file = await PdfFile.findOne({
      _id: params.id,
      uploadedBy: userData.id
    }).populate('uploadedBy', 'name email');

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'File not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true,
      file 
    });

  } catch (error) {
    console.error('File fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch file' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    // Get session token from cookies
    const cookieStore = cookies();
    const token = cookieStore.get('session-token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify token and get user data
    const userData = verifyToken(token);
    if (!userData) {
      return NextResponse.json(
        { success: false, error: 'Invalid session' },
        { status: 401 }
      );
    }

    await connectToMongoDB();

    const file = await PdfFile.findOneAndDelete({
      _id: params.id,
      uploadedBy: userData.id
    });

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'File not found' },
        { status: 404 }
      );
    }

    // Delete the physical file
    try {
      const fs = require('fs').promises;
      const path = require('path');
      const filePath = path.join(process.cwd(), 'public', file.filePath);
      await fs.unlink(filePath);
    } catch (err) {
      console.warn('Could not delete physical file:', err);
      // Don't fail the request if file deletion fails
    }

    return NextResponse.json({ 
      success: true,
      message: 'File deleted successfully' 
    });

  } catch (error) {
    console.error('File delete error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete file' },
      { status: 500 }
    );
  }
}