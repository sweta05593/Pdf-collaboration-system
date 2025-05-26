import { cookies } from 'next/headers';
import { verifyToken } from './jwt';

export async function getSession() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('auth-token')?.value;
    
    if (!token) {
      return null;
    }

    const payload = verifyToken(token);
    return payload ? { user: payload } : null;
  } catch (error) {
    console.error('Session error:', error);
    return null;
  }
}