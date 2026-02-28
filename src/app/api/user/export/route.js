import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/connect';
import Project from '@/models/Project';
import Task from '@/models/Task';

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectToDatabase();

    // Fetch all projects and tasks for the user
    const projects = await Project.find({ clerkId: userId }).lean();
    const tasks = await Task.find({ clerkId: userId })
      .populate('projectId', 'name')
      .lean();

    // Create CSV content
    let csvContent = 'Data Export - Projects and Tasks\n\n';
    
    // Projects section
    csvContent += 'PROJECTS\n';
    csvContent += 'Name,Description,Status,Priority,Start Date,End Date,Created At\n';
    
    projects.forEach(project => {
      csvContent += `"${project.name || ''}","${project.description || ''}",${project.status || ''},${project.priority || ''},${project.startDate ? new Date(project.startDate).toLocaleDateString() : ''},${project.endDate ? new Date(project.endDate).toLocaleDateString() : ''},${new Date(project.createdAt).toLocaleDateString()}\n`;
    });
    
    csvContent += '\n\nTASKS\n';
    csvContent += 'Title,Description,Project,Status,Priority,Due Date,Completed At,Created At\n';
    
    tasks.forEach(task => {
      csvContent += `"${task.title || ''}","${task.description || ''}","${task.projectId?.name || ''}",${task.status || ''},${task.priority || ''},${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : ''},${task.completedAt ? new Date(task.completedAt).toLocaleDateString() : ''},${new Date(task.createdAt).toLocaleDateString()}\n`;
    });

    // Return CSV file
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="project-export-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
    
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    );
  }
}