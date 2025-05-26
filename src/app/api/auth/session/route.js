import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/jwt';

export async function GET() {
  try {
    const cookieStore = await  cookies();
    const token =cookieStore.get('session-token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'No session found' },
        { status: 401 }
      );
    }

    const userData = verifyToken(token);
    
    if (!userData) {
      return NextResponse.json(
        { success: false, message: 'Invalid session' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Session valid',
        user: userData
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Session error:', error);
    return NextResponse.json(
      { success: false, message: 'Session check failed' },
      { status: 500 }
    );
  }
}