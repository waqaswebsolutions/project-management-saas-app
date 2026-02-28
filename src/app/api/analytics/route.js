import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/connect';
import Project from '@/models/Project';
import Task from '@/models/Task';

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

    // Get project statistics
    const totalProjects = await Project.countDocuments({ clerkId: userId });
    const activeProjects = await Project.countDocuments({ clerkId: userId, status: 'active' });
    const completedProjects = await Project.countDocuments({ clerkId: userId, status: 'completed' });
    const archivedProjects = await Project.countDocuments({ clerkId: userId, status: 'archived' });

    // Get task statistics
    const totalTasks = await Task.countDocuments({ clerkId: userId });
    const pendingTasks = await Task.countDocuments({ clerkId: userId, status: 'pending' });
    const inProgressTasks = await Task.countDocuments({ clerkId: userId, status: 'in-progress' });
    const completedTasks = await Task.countDocuments({ clerkId: userId, status: 'completed' });

    // Get tasks by priority
    const lowPriorityTasks = await Task.countDocuments({ clerkId: userId, priority: 'low' });
    const mediumPriorityTasks = await Task.countDocuments({ clerkId: userId, priority: 'medium' });
    const highPriorityTasks = await Task.countDocuments({ clerkId: userId, priority: 'high' });
    const criticalPriorityTasks = await Task.countDocuments({ clerkId: userId, priority: 'critical' });

    return NextResponse.json({
      totalProjects,
      activeProjects,
      completedProjects,
      archivedProjects,
      totalTasks,
      pendingTasks,
      inProgressTasks,
      completedTasks,
      lowPriorityTasks,
      mediumPriorityTasks,
      highPriorityTasks,
      criticalPriorityTasks,
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}