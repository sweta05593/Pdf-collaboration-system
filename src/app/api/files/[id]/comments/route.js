
// src/app/api/files/[id]/comments/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectToMongoDB from '../../../../../lib/mongodb';
import { Comment, PdfFile } from '../../../../../models';
import { authOptions } from '../../../../../lib/auth';
import { sanitizeInput } from '../../../../../lib/utils';

export async function GET(request, { params }) {
  try {
    await connectToMongoDB();

    // Check if file exists and is accessible
    const file = await PdfFile.findById(params.id);
    if (!file) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    const comments = await Comment.find({ pdfFileId: params.id })
      .populate('authorId', 'name email')
      .sort({ createdAt: -1 });

    // Build nested comment structure
    const commentMap = new Map();
    const rootComments = [];

    comments.forEach(comment => {
      const commentObj = {
        id: comment._id,
        content: comment.content,
        author: comment.authorId ? comment.authorId.name : comment.guestName,
        isGuest: !comment.authorId,
        createdAt: comment.createdAt,
        replies: []
      };

      commentMap.set(comment._id.toString(), commentObj);

      if (comment.parentId) {
        const parent = commentMap.get(comment.parentId.toString());
        if (parent) {
          parent.replies.push(commentObj);
        }
      } else {
        rootComments.push(commentObj);
      }
    });

    return NextResponse.json({ comments: rootComments });

  } catch (error) {
    console.error('Comments fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}

export async function POST(request, { params }) {
  try {
    const body = await request.json();
    const { content, guestName, parentId } = body;

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Comment content is required' },
        { status: 400 }
      );
    }

    const session = await getServerSession(authOptions);

    // For guest users, require a name
    if (!session && (!guestName || guestName.trim().length === 0)) {
      return NextResponse.json(
        { error: 'Guest name is required' },
        { status: 400 }
      );
    }

    await connectToMongoDB();

    // Verify file exists
    const file = await PdfFile.findById(params.id);
    if (!file) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    const comment = new Comment({
      content: sanitizeInput(content),
      pdfFileId: params.id,
      authorId: session?.user?.id || null,
      guestName: session ? null : sanitizeInput(guestName),
      parentId: parentId || null
    });

    await comment.save();
    await comment.populate('authorId', 'name email');

    const responseComment = {
      id: comment._id,
      content: comment.content,
      author: comment.authorId ? comment.authorId.name : comment.guestName,
      isGuest: !comment.authorId,
      createdAt: comment.createdAt,
      replies: []
    };

    return NextResponse.json({ comment: responseComment });

  } catch (error) {
    console.error('Comment creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    );
  }
}