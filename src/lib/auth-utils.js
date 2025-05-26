// src/lib/auth-utils.js
import { cookies } from 'next/headers';
import { verifyToken } from './jwt';

/**
 * Server-side authentication check for API routes
 * Returns user data if authenticated, null if not
 */
export async function getAuthenticatedUser() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('session-token')?.value;

    if (!token) {
      return null;
    }

    const userData = verifyToken(token);
    return userData || null;
  } catch (error) {
    console.error('Auth check error:', error);
    return null;
  }
}

/**
 * Middleware helper for API routes that require authentication
 * Returns user data or throws with appropriate response
 */
export async function requireAuth() {
  const user = await getAuthenticatedUser();
  
  if (!user) {
    throw new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Authentication required' 
      }),
      { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
  
  return user;
}

/**
 * Client-side session check
 */
export async function checkClientSession() {
  try {
    const response = await fetch('/api/auth/session', {
      method: 'GET',
      credentials: 'include',
    });

    const data = await response.json();
    
    if (response.ok && data.success) {
      return { user: data.user, authenticated: true };
    } else {
      return { user: null, authenticated: false };
    }
  } catch (error) {
    console.error('Session check failed:', error);
    return { user: null, authenticated: false, error: error.message };
  }
}