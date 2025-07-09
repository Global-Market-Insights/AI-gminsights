import { NextRequest, NextResponse } from 'next/server';
import { AuthStorage } from '@/utils/authStorage';
import { LoginCredentials, LoginResponse } from '@/types/index';

export async function POST(request: NextRequest) {
  try {
    const body: LoginCredentials = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json({
        success: false,
        message: 'Username and password are required'
      } as LoginResponse, { status: 400 });
    }

    // Validate credentials
    const user = AuthStorage.validateCredentials(username, password);
    
    if (!user) {
      return NextResponse.json({
        success: false,
        message: 'Invalid username or password'
      } as LoginResponse, { status: 401 });
    }

    // Update last login
    AuthStorage.updateUserLastLogin(user.id);

    // Create session
    const { password: _, ...userWithoutPassword } = user;
    const session = AuthStorage.createSession(userWithoutPassword);

    // Clean expired sessions
    AuthStorage.cleanExpiredSessions();

    const response = NextResponse.json({
      success: true,
      user: userWithoutPassword,
      token: session.token
    } as LoginResponse);

    // Set HTTP-only cookie for authentication
    response.cookies.set('auth-token', session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 // 24 hours
    });

    return response;

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    } as LoginResponse, { status: 500 });
  }
}
