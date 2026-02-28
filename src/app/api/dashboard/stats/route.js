import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/connect';
import Project from '@/models/Project';
import Task from '@/models/Task';

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    await connectToDatabase();

    // Get total projects
    const totalProjects = await Project.countDocuments({ clerkId: userId });

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

    return NextResponse.json({
      totalProjects,
      totalTasks,
      completedTasks,
      pendingTasks,
      recentProjects,
      recentTasks,
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}