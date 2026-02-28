import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/connect';
import User from '@/models/User';

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectToDatabase();

    let user = await User.findOne({ clerkId: userId });

    // If user doesn't exist in MongoDB, create one with Clerk data
    if (!user) {
      // You might want to fetch user details from Clerk here
      // For now, create a basic user
      user = await User.create({
        clerkId: userId,
        email: 'user@example.com', // This should come from Clerk
        name: 'User',
      });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const { userId } = await auth();
    const body = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { name, email } = body;

    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Update user in MongoDB
    const updatedUser = await User.findOneAndUpdate(
      { clerkId: userId },
      { 
        name: name,
        email: email,
      },
      { 
        new: true,  // Return updated document
        upsert: true, // Create if doesn't exist
        runValidators: true, // Run schema validators
      }
    );

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}