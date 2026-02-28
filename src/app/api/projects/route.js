import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/connect';
import Project from '@/models/Project';

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    console.log('Fetching projects for user:', userId);
    
    await connectToDatabase();

    const projects = await Project.find({ clerkId: userId })
      .sort({ createdAt: -1 })
      .lean();

    console.log(`Found ${projects.length} projects`);
    
    // Always return an array, even if empty
    return NextResponse.json(projects || []);
    
  } catch (error) {
    console.error('Projects fetch error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch projects',
        details: error.message 
      },
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

    // Validate required fields
    if (!name?.trim()) {
      return NextResponse.json(
        { error: 'Project name is required' },
        { status: 400 }
      );
    }

    if (!description?.trim()) {
      return NextResponse.json(
        { error: 'Project description is required' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const projectData = {
      name: name.trim(),
      description: description.trim(),
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