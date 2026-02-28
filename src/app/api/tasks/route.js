import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/connect';
import Task from '@/models/Task';
import Project from '@/models/Project';

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    await connectToDatabase();

    const tasks = await Task.find({ clerkId: userId })
      .populate('projectId', 'name')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(tasks);
  } catch (error) {
    console.error('Tasks fetch error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    const { title, description, projectId, status, priority, dueDate } = body;

    // Validate required fields
    if (!title || !description || !projectId || !dueDate) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    await connectToDatabase();

    // Verify project belongs to user
    const project = await Project.findOne({ 
      _id: projectId, 
      clerkId: userId 
    });

    if (!project) {
      return new NextResponse('Project not found', { status: 404 });
    }

    const task = await Task.create({
      title,
      description,
      projectId,
      clerkId: userId,
      status: status || 'pending',
      priority: priority || 'medium',
      dueDate,
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error('Task creation error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}