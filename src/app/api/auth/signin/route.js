import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { User } from '@/models/index';
import connectToMongoDB from '@/lib/mongodb';
import { createToken } from '@/lib/jwt';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Your existing validation code...
    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, message: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    await connectToMongoDB();
    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // CREATE SESSION TOKEN - This is what was missing!
    const token = createToken(user);

    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt
    };

    // Create response with session cookie
    const response = NextResponse.json(
      {
        success: true,
        message: 'Login successful',
        user: userResponse
      },
      { status: 200 }
    );

    // Set session cookie
    response.cookies.set('session-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/'
    });

    return response;

  } catch (error) {
    console.error('Signin error:', error);

    if (error.name === 'MongoNetworkError' || error.name === 'MongooseServerSelectionError') {
      return NextResponse.json(
        { success: false, message: 'Database connection error. Please try again later.' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { success: false, message: 'Internal server error. Please try again later.' },
      { status: 500 }
    );
  }
}
