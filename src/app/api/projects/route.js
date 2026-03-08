import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/connect';
import Project from '@/models/Project';
import Task from '@/models/Task'; // Add this import

export async function GET(request) {
  try {
    const { userId } = await auth();
    const { searchParams } = new URL(request.url);
    
    const search = searchParams.get('search') || '';

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    await connectToDatabase();

    let query = { clerkId: userId };
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const projects = await Project.find(query)
      .sort({ createdAt: -1 })
      .lean();

    // Get task counts for each project (for progress bars)
    const projectsWithProgress = await Promise.all(
      projects.map(async (project) => {
        const totalTasks = await Task.countDocuments({ 
          projectId: project._id,
          clerkId: userId 
        });
        
        const completedTasks = await Task.countDocuments({ 
          projectId: project._id,
          clerkId: userId,
          status: 'completed' 
        });

        return {
          ...project,
          taskCounts: {
            total: totalTasks,
            completed: completedTasks
          }
        };
      })
    );

    return NextResponse.json(projectsWithProgress);
    
  } catch (error) {
    console.error('Projects fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}


export async function POST(request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    console.log('Creating project for user:', userId, 'with data:', body);
    
    const { name, description, status, priority, startDate, endDate } = body;

    await connectToDatabase();

    const projectData = {
      name: name?.trim() || 'Untitled Project',
      description: description?.trim() || 'No description provided',
      clerkId: userId,
      status: status || 'active',
      priority: priority || 'medium',
      startDate: startDate ? new Date(startDate) : new Date(),
    };
    
    if (endDate) {
      projectData.endDate = new Date(endDate);
    }

    const project = await Project.create(projectData);
    console.log('Project created successfully:', project._id);

    // Log the activity
    await logActivity({
      clerkId: userId,
      projectId: project._id,
      action: 'project_created',
      details: `Created project "${project.name}"`,
      metadata: { projectName: project.name }
    });

    return NextResponse.json(project, { status: 201 });
    
  } catch (error) {
    console.error('Project creation error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create project',
        details: error.message 
      },
      { status: 500 }
    );
  }
}