import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/connect';
import Task from '@/models/Task';

export async function DELETE(request, { params }) {
  try {
    const { userId } = await auth();
    const { id } = await params;

    console.log('Delete task request:', { taskId: id, userId });

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!id) {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Find and delete the task, ensuring it belongs to the user
    const task = await Task.findOneAndDelete({ 
      _id: id, 
      clerkId: userId 
    });

    if (!task) {
      console.log('Task not found or unauthorized:', id);
      return NextResponse.json(
        { error: 'Task not found or you do not have permission to delete it' },
        { status: 404 }
      );
    }

    console.log('Task deleted successfully:', id);
    
    // Return success response
    return NextResponse.json(
      { message: 'Task deleted successfully', task },
      { status: 200 }
    );
    
  } catch (error) {
    console.error('Task delete error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to delete task',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// Keep your existing GET, PUT methods here...
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
  try {
    const { userId } = await auth();
    const { id } = await params;

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
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
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error('Task update error:', error);
    return NextResponse.json(
      { error: 'Failed to update task' },
      { status: 500 }
    );
  }
}