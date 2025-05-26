import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/jwt';
import connectToMongoDB from '../../../lib/mongodb';
import { PdfFile } from '../../../models';

export async function GET(request) {
  try {
    // Get session token from cookies
    const cookieStore = await cookies();
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

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    await connectToMongoDB();

    let query = { uploadedBy: userData.id };
    
    if (search) {
      query.originalName = { $regex: search, $options: 'i' };
    }

    const files = await PdfFile.find(query)
      .sort({ createdAt: -1 })
      .select('_id originalName filename fileSize createdAt shareToken');

    return NextResponse.json({ 
      success: true,
      files 
    });

  } catch (error) {
    console.error('Files fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch files' },
      { status: 500 }
    );
  }
}