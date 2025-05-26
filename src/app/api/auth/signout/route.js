// src/app/api/auth/signout/route.js
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    const cookieStore = cookies();
    
    // Clear the session cookie
    cookieStore.set('session-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: new Date(0), // Expire immediately
      path: '/',
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Signed out successfully'
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Sign out error:', error);
    return NextResponse.json(
      { success: false, message: 'Sign out failed' },
      { status: 500 }
    );
  }
}