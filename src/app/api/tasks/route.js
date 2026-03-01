import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/connect';
import Task from '@/models/Task';
import Project from '@/models/Project';

export async function GET() {
  console.log('📥 GET /api/tasks - Started');
  try {
    const { userId } = await auth();
    console.log('📥 User ID:', userId);

    if (!userId) {
      console.log('📥 Unauthorized - No userId');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    console.log('📥 Database connected');

    const tasks = await Task.find({ clerkId: userId })
      .populate('projectId', 'name')
      .sort({ createdAt: -1 })
      .lean();

    console.log(`📥 Found ${tasks.length} tasks`);
    return NextResponse.json(tasks);
  } catch (error) {
    console.error('📥 GET Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tasks', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  console.log('📥 POST /api/tasks - Started');
  try {
    const { userId } = await auth();
    console.log('📥 User ID:', userId);

    if (!userId) {
      console.log('📥 Unauthorized - No userId');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    console.log('📥 Request body:', body);

    const { title, description, projectId, status, priority, dueDate } = body;

    // Validate required fields
    if (!title || !description || !projectId || !dueDate) {
      console.log('📥 Missing required fields:', { title, description, projectId, dueDate });
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    await connectToDatabase();
    console.log('📥 Database connected');

    // Verify project belongs to user
    const project = await Project.findOne({ 
      _id: projectId, 
      clerkId: userId 
    });

    if (!project) {
      console.log('📥 Project not found:', projectId);
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    console.log('📥 Project found:', project._id);

    const task = await Task.create({
      title,
      description,
      projectId,
      clerkId: userId,
      status: status || 'pending',
      priority: priority || 'medium',
      dueDate,
    });

    console.log('📥 Task created:', task._id);
    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error('📥 POST Error:', error);
    return NextResponse.json(
      { error: 'Failed to create task', details: error.message },
      { status: 500 }
    );
  }
}