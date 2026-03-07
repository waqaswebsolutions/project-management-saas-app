import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/connect';
import Project from '@/models/Project';
import Task from '@/models/Task';

export async function GET() {
  console.log('📊 Dashboard stats API called');
  
  try {
    // CORRECTED: For Clerk v6+, auth() returns a promise that needs await
    const { userId } = await auth();
    
    console.log('📊 User ID:', userId);

    if (!userId) {
      console.log('📊 No user ID found');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('📊 Connecting to database...');
    await connectToDatabase();

    // Get total projects
    const totalProjects = await Project.countDocuments({ clerkId: userId });
    console.log('📊 Total projects:', totalProjects);

    // Get task statistics
    const totalTasks = await Task.countDocuments({ clerkId: userId });
    const completedTasks = await Task.countDocuments({ 
      clerkId: userId, 
      status: 'completed' 
    });
    const pendingTasks = await Task.countDocuments({ 
      clerkId: userId, 
      status: { $in: ['pending', 'in-progress'] } 
    });

    console.log('📊 Task stats:', { totalTasks, completedTasks, pendingTasks });

    // Get recent projects (last 5)
    const recentProjects = await Project.find({ clerkId: userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    // Get recent tasks (last 5)
    const recentTasks = await Task.find({ clerkId: userId })
      .populate('projectId', 'name')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    const responseData = {
      totalProjects,
      totalTasks,
      completedTasks,
      pendingTasks,
      recentProjects,
      recentTasks,
    };

    console.log('📊 Sending response:', responseData);
    return NextResponse.json(responseData);
    
  } catch (error) {
    console.error('📊 Dashboard stats error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 }
    );
  }
}