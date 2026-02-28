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

    if (!user) {
      // Create user if doesn't exist with default notifications
      user = await User.create({
        clerkId: userId,
        email: 'user@example.com', // This would come from Clerk webhook
        name: 'User',
        notifications: {
          emailNotifications: true,
          taskAssignments: true,
          dueDateReminders: true,
          projectUpdates: false,
        },
      });
    }

    return NextResponse.json(user.notifications || {
      emailNotifications: true,
      taskAssignments: true,
      dueDateReminders: true,
      projectUpdates: false,
    });
    
  } catch (error) {
    console.error('Notifications fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notification preferences' },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { emailNotifications, taskAssignments, dueDateReminders, projectUpdates } = body;

    await connectToDatabase();

    // Find user and update notification preferences
    const user = await User.findOneAndUpdate(
      { clerkId: userId },
      { 
        notifications: {
          emailNotifications,
          taskAssignments,
          dueDateReminders,
          projectUpdates,
        } 
      },
      { new: true, upsert: true }
    );

    return NextResponse.json(user.notifications);
    
  } catch (error) {
    console.error('Notifications update error:', error);
    return NextResponse.json(
      { error: 'Failed to update notification preferences' },
      { status: 500 }
    );
  }
}