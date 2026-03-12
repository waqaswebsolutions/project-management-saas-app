import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/connect';
import Project from '@/models/Project';
import Task from '@/models/Task';

export async function GET(request) {
  try {
    const { userId } = await auth();
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!query || query.length < 2) {
      return NextResponse.json({ projects: [], tasks: [] });
    }

    await connectToDatabase();

    // Search projects
    const projects = await Project.find({
      clerkId: userId,
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } }
      ]
    })
    .select('name description _id')
    .limit(5)
    .lean();

    // Search tasks
    const tasks = await Task.find({
      clerkId: userId,
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } }
      ]
    })
    .populate('projectId', 'name')
    .select('title description dueDate priority projectId')
    .limit(5)
    .lean();

    // Format tasks for response
    const formattedTasks = tasks.map(task => ({
      _id: task._id,
      title: task.title,
      description: task.description,
      dueDate: task.dueDate,
      priority: task.priority,
      projectId: task.projectId?._id,
      projectName: task.projectId?.name
    }));

    return NextResponse.json({
      projects,
      tasks: formattedTasks
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    );
  }
}