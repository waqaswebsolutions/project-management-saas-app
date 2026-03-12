import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/connect';
import Task from '@/models/Task';
import { logActivity } from '@/lib/activity-logger';

export async function GET(request, { params }) {
  try {
    const { userId } = await auth();
    const { id } = await params;

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectToDatabase();

    const task = await Task.findOne({ 
      _id: id, 
      clerkId: userId 
    }).populate('projectId', 'name').lean();

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error('Task fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch task' },
      { status: 500 }
    );
  }
}

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

    const { title, description, status, priority, dueDate, attachments } = body;

    await connectToDatabase();

    // Find the existing task first
    const existingTask = await Task.findOne({ _id: id, clerkId: userId });
    if (!existingTask) {
      console.log('📥 Task not found:', id);
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Prepare update data
    const updateData = {
      title: title || existingTask.title,
      description: description || existingTask.description,
      status: status || existingTask.status,
      priority: priority || existingTask.priority,
    };

    // Handle due date
    if (dueDate) {
      updateData.dueDate = new Date(dueDate);
    }

    // Handle completedAt
    if (status === 'completed' && existingTask.status !== 'completed') {
      updateData.completedAt = new Date();
    } else if (status !== 'completed') {
      updateData.completedAt = null;
    }

    // Handle attachments - MERGE with existing, don't replace
    if (attachments) {
      // If attachments is an array, merge with existing
      if (Array.isArray(attachments)) {
        // Create a map of existing attachment URLs to avoid duplicates
        const existingUrls = new Set(existingTask.attachments?.map(a => a.url) || []);
        const newAttachments = attachments.filter(a => !existingUrls.has(a.url));
        updateData.attachments = [...(existingTask.attachments || []), ...newAttachments];
      } else {
        // If attachments is not an array, keep existing
        updateData.attachments = existingTask.attachments;
      }
    }

    console.log('📥 Update data:', updateData);

    const task = await Task.findOneAndUpdate(
      { _id: id, clerkId: userId },
      updateData,
      { new: true, runValidators: true }
    );

    console.log('📥 Task updated:', task._id);

    // Log activity (with error handling)
    try {
      if (status === 'completed' && existingTask.status !== 'completed') {
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
    } catch (activityError) {
      console.error('Activity logging failed (non-critical):', activityError);
      // Don't fail the request if activity logging fails
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error('📥 PUT Error:', error);
    return NextResponse.json(
      { error: 'Failed to update task', details: error.message },
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

    // Log activity
    try {
      await logActivity({
        clerkId: userId,
        projectId: task.projectId,
        taskId: task._id,
        action: 'task_deleted',
        details: `Deleted task "${task.title}"`,
        metadata: { taskTitle: task.title }
      });
    } catch (activityError) {
      console.error('Activity logging failed (non-critical):', activityError);
    }

    return NextResponse.json(
      { message: 'Task deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('📥 DELETE Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete task', details: error.message },
      { status: 500 }
    );
  }
}