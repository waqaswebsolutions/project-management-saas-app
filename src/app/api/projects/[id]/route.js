import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/connect';
import Project from '@/models/Project';
import Task from '@/models/Task';

export async function DELETE(request, { params }) {
  try {
    const { userId } = await auth();
    const { id } = await params;

    console.log('Delete project request:', { projectId: id, userId });

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!id) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Find and delete the project, ensuring it belongs to the user
    const project = await Project.findOneAndDelete({ 
      _id: id, 
      clerkId: userId 
    });

    if (!project) {
      console.log('Project not found or unauthorized:', id);
      return NextResponse.json(
        { error: 'Project not found or you do not have permission to delete it' },
        { status: 404 }
      );
    }

    // Delete all tasks associated with this project
    const deleteTasksResult = await Task.deleteMany({ 
      projectId: id, 
      clerkId: userId 
    });

    console.log('Project deleted successfully:', id);
    console.log(`Deleted ${deleteTasksResult.deletedCount} associated tasks`);

    // Return success response
    return NextResponse.json(
      { 
        message: 'Project deleted successfully', 
        project,
        deletedTasksCount: deleteTasksResult.deletedCount 
      },
      { status: 200 }
    );
    
  } catch (error) {
    console.error('Project delete error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to delete project',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// Keep your existing GET and PUT methods
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

    const project = await Project.findOne({ 
      _id: id, 
      clerkId: userId 
    }).lean();

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Get tasks for this project
    const tasks = await Task.find({ 
      projectId: id,
      clerkId: userId 
    }).sort({ createdAt: -1 }).lean();

    return NextResponse.json({ ...project, tasks });
  } catch (error) {
    console.error('Project fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project' },
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
    const { name, description, status, priority, endDate } = body;

    await connectToDatabase();

    const project = await Project.findOneAndUpdate(
      { _id: id, clerkId: userId },
      { 
        name, 
        description, 
        status, 
        priority, 
        endDate: endDate ? new Date(endDate) : null 
      },
      { new: true, runValidators: true }
    );

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error('Project update error:', error);
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    );
  }
}