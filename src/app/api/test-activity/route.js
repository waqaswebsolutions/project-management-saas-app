import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { logActivity } from '@/lib/activity-logger';

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    await logActivity({
      clerkId: userId,
      action: 'test_activity',
      details: 'This is a test activity',
      metadata: { test: true }
    });
    
    return NextResponse.json({ success: true, message: 'Test activity logged' });
  } catch (error) {
    console.error('Test activity error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}