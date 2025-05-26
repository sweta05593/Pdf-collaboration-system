// src/app/api/files/[id]/share/route.js
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/jwt';
import connectToMongoDB from '../../../../../lib/mongodb';
import { PdfFile } from '../../../../../models';
import crypto from 'crypto';

// Generate or get existing share token
export async function POST(request, { params }) {
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

    // Find the file and ensure user owns it
    const file = await PdfFile.findOne({
      _id: params.id,
      uploadedBy: userData.id
    });

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'File not found' },
        { status: 404 }
      );
    }

    // Generate new share token if it doesn't exist
    let shareToken = file.shareToken;
    if (!shareToken) {
      shareToken = crypto.randomBytes(32).toString('hex');
      
      // Update the file with the new share token
      await PdfFile.updateOne(
        { _id: params.id },
        { shareToken: shareToken }
      );
    }

    const shareUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/share/${shareToken}`;

    return NextResponse.json({
      success: true,
      shareToken,
      shareUrl
    });

  } catch (error) {
    console.error('Share token generation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate share link' },
      { status: 500 }
    );
  }
}

// Revoke share token
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

    // Find the file and ensure user owns it
    const file = await PdfFile.findOneAndUpdate(
      {
        _id: params.id,
        uploadedBy: userData.id
      },
      {
        $unset: { shareToken: "" }
      },
      { new: true }
    );

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'File not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Share link revoked successfully'
    });

  } catch (error) {
    console.error('Share token revoke error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to revoke share link' },
      { status: 500 }
    );
  }
}