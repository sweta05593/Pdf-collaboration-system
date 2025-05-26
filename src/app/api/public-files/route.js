import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/jwt';
import connectToMongoDB from '../../../lib/mongodb';
import { PdfFile } from '../../../models';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const skip = (page - 1) * limit;

    // Check if user is authenticated (optional for public feed)
    let currentUserId = null;
    try {
      const cookieStore = await cookies();
      const token = cookieStore.get('session-token')?.value;
      if (token) {
        const userData = verifyToken(token);
        if (userData) {
          currentUserId = userData.id;
        }
      }
    } catch (err) {
      // Ignore auth errors for public feed
    }

    await connectToMongoDB();

    // Fetch public files with aggregation to include like status
    const pipeline = [
      { $match: { isPublic: true } },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit + 1 }, // Get one extra to check if there are more
      {
        $lookup: {
          from: 'users',
          localField: 'uploadedBy',
          foreignField: '_id',
          as: 'uploadedBy',
          pipeline: [{ $project: { name: 1, email: 1 } }]
        }
      },
      { $unwind: '$uploadedBy' },
      {
        $lookup: {
          from: 'likes',
          localField: '_id',
          foreignField: 'fileId',
          as: 'likesData'
        }
      },
      {
        $lookup: {
          from: 'comments',
          localField: '_id',
          foreignField: 'pdfFileId',
          as: 'commentsData'
        }
      },
      {
        $addFields: {
          likes: { $size: '$likesData' },
          commentCount: { $size: '$commentsData' },
          isLiked: currentUserId ? {
            $in: [currentUserId, '$likesData.userId']
          } : false
        }
      },
      {
        $project: {
          likesData: 0,
          commentsData: 0,
          filePath: 0 // Don't expose file path for security
        }
      }
    ];

    const results = await PdfFile.aggregate(pipeline);
    
    const hasMore = results.length > limit;
    const files = hasMore ? results.slice(0, -1) : results;

    return NextResponse.json({
      success: true,
      files,
      hasMore,
      page,
      totalDisplayed: files.length
    });

  } catch (error) {
    console.error('Public files fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch public files' },
      { status: 500 }
    );
  }
}