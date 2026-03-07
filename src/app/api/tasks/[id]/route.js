import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/connect';
import Task from '@/models/Task';
import { logActivity } from '@/lib/activity-logger';

export async function PUT(request, { params }) {
  console.log('📥 PUT /api/tasks/[id] - Started');
  try {
    const { userId } = await auth();
    const { id } = await params;

    console.log('📥 Task ID:', id);
    console.log('📥 User ID:', userId);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    console.log('📥 Request body:', body);

    const { title, description, status, priority, dueDate } = body;

    await connectToDatabase();

    const task = await Task.findOneAndUpdate(
      { _id: id, clerkId: userId },
      { 
        title, 
        description, 
        status, 
        priority, 
        dueDate: dueDate ? new Date(dueDate) : undefined,
        ...(status === 'completed' ? { completedAt: new Date() } : {})
      },
      { new: true, runValidators: true }
    );

    if (!task) {
      console.log('📥 Task not found:', id);
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    console.log('📥 Task updated:', task._id);

    // Log the activity based on what changed
    if (status === 'completed') {
      await logActivity({
        clerkId: userId,
        projectId: task.projectId,
        taskId: task._id,
        action: 'task_completed',
        details: `Completed task "${task.title}"`,
        metadata: { taskTitle: task.title }
      });
    } else {
      await logActivity({
        clerkId: userId,
        projectId: task.projectId,
        taskId: task._id,
        action: 'task_updated',
        details: `Updated task "${task.title}"`,
        metadata: { taskTitle: task.title, status }
      });
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error('📥 PUT Error:', error);
    return NextResponse.json(
      { error: 'Failed to update task' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  console.log('📥 DELETE /api/tasks/[id] - Started');
  try {
    const { userId } = await auth();
    const { id } = await params;

    console.log('📥 Task ID:', id);
    console.log('📥 User ID:', userId);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const task = await Task.findOneAndDelete({ 
      _id: id, 
      clerkId: userId 
    });

    if (!task) {
      console.log('📥 Task not found:', id);
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    console.log('📥 Task deleted:', id);

    // Log the activity
    await logActivity({
      clerkId: userId,
      projectId: task.projectId,
      taskId: task._id,
      action: 'task_deleted',
      details: `Deleted task "${task.title}"`,
      metadata: { taskTitle: task.title }
    });

    return NextResponse.json(
      { message: 'Task deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('📥 DELETE Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete task' },
      { status: 500 }
    );
  }
}