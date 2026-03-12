import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/connect';
import Task from '@/models/Task';
import Project from '@/models/Project';
import { logActivity } from '@/lib/activity-logger';

export async function GET(request) {
  try {
    const { userId } = await auth();
    const { searchParams } = new URL(request.url);
    
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const projectId = searchParams.get('projectId');
    const sort = searchParams.get('sort') || 'newest';

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    let query = { clerkId: userId };
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status && status !== 'all') {
      query.status = status;
    }
    
    if (priority && priority !== 'all') {
      query.priority = priority;
    }
    
    if (projectId && projectId !== 'all') {
      query.projectId = projectId;
    }

    let sortOptions = {};
    switch(sort) {
      case 'oldest':
        sortOptions = { createdAt: 1 };
        break;
      case 'dueDate':
        sortOptions = { dueDate: 1 };
        break;
      case 'dueDate-desc':
        sortOptions = { dueDate: -1 };
        break;
      default:
        sortOptions = { createdAt: -1 };
    }

    const tasks = await Task.find(query)
      .populate('projectId', 'name')
      .sort(sortOptions)
      .lean();

    return NextResponse.json(tasks);
  } catch (error) {
    console.error('Tasks fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    console.log('📥 POST request body:', body);

    const { title, description, projectId, status, priority, dueDate, attachments } = body;

    if (!title || !description || !projectId || !dueDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Verify project belongs to user
    const project = await Project.findOne({ 
      _id: projectId, 
      clerkId: userId 
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Create task data object
    const taskData = {
      title,
      description,
      projectId,
      clerkId: userId,
      status: status || 'pending',
      priority: priority || 'medium',
      dueDate: new Date(dueDate),
    };

    // IMPORTANT: Add attachments if they exist
    if (attachments && Array.isArray(attachments) && attachments.length > 0) {
      console.log('📥 Adding attachments to task:', attachments);
      taskData.attachments = attachments;
    }

    console.log('📥 Final task data:', taskData);

    const task = await Task.create(taskData);
    console.log('✅ Task created:', task._id);
    console.log('✅ Attachments saved:', task.attachments?.length || 0);

    // Log activity
    try {
      await logActivity({
        clerkId: userId,
        projectId: task.projectId,
        taskId: task._id,
        action: 'task_created',
        details: `Created task "${task.title}"`,
        metadata: { taskTitle: task.title, status: task.status }
      });
    } catch (activityError) {
      console.error('Activity logging failed:', activityError);
    }

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error('❌ Task creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create task', details: error.message },
      { status: 500 }
    );
  }
}