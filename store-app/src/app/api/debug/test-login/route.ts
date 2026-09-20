import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    
    const db = await connectDB();
    const user = await db.users.findOne({ 
      email: email,
      role: 'admin'
    });

    if (!user) {
      return NextResponse.json({
        success: false,
        message: 'User not found',
        email: email
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    return NextResponse.json({
      success: true,
      userExists: !!user,
      isActive: user.isActive,
      isVerified: user.isVerified,
      role: user.role,
      passwordValid: isPasswordValid,
      email: user.email,
      name: user.name
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
