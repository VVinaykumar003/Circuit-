import dbConnect from '@/lib/mongodb';
import User from '@/app/models/User';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  try {
    await dbConnect();

    const { email } = params;

    // Validate the email parameter
    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email parameter is required' },
        { status: 400 },
      );
    }

    // Find user by email (excluding password)
    const user = await User.findOne({ email }).select('-password');

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error('Failed to fetch user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch user' },
      { status: 500 },
    );
  }
}
