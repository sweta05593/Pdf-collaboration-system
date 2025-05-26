import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/jwt';
import connectToMongoDB from '../../../../lib/mongodb';
import mongoose from 'mongoose';

// Like Schema
const likeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PdfFile',
    required: true
  }
}, {
  timestamps: true
});

likeSchema.index({ userId: 1, fileId: 1 }, { unique: true });

const Like = mongoose.models.Like || mongoose.model('Like', likeSchema);

export async function POST(request) {
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

    const { fileId } = await request.json();

    if (!fileId) {
      return NextResponse.json(
        { success: false, error: 'File ID is required' },
        { status: 400 }
      );
    }

    await connectToMongoDB();

    // Check if like already exists
    const existingLike = await Like.findOne({
      userId: userData.id,
      fileId
    });

    let isLiked;
    if (existingLike) {
      // Unlike
      await Like.deleteOne({ _id: existingLike._id });
      isLiked = false;
    } else {
      // Like
      await Like.create({
        userId: userData.id,
        fileId
      });
      isLiked = true;
    }

    // Get total likes count
    const likesCount = await Like.countDocuments({ fileId });

    return NextResponse.json({
      success: true,
      isLiked,
      likes: likesCount
    });

  } catch (error) {
    console.error('Like toggle error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to toggle like' },
      { status: 500 }
    );
  }
}