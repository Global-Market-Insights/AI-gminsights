import { NextRequest, NextResponse } from 'next/server';
import { AuthStorage } from '@/utils/authStorage';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json({
        success: false,
        message: 'No authentication token found'
      }, { status: 401 });
    }

    const session = AuthStorage.findSessionByToken(token);
    
    if (!session) {
      return NextResponse.json({
        success: false,
        message: 'Invalid or expired session'
      }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      user: session.user
    });

  } catch (error) {
    console.error('Session check error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}
