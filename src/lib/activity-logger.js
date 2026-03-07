import { connectToDatabase } from './db/connect';
import Activity from '@/models/Activity';

export async function logActivity({
  clerkId,
  projectId = null,
  taskId = null,
  action,
  details,
  metadata = {},
}) {
  try {
    await connectToDatabase();
    
    const activity = await Activity.create({
      clerkId,
      projectId,
      taskId,
      action,
      details,
      metadata,
    });
    
    console.log(`✅ Activity logged: ${action}`);
    return activity;
  } catch (error) {
    console.error('❌ Failed to log activity:', error);
    // Don't throw - activity logging should not break the main flow
  }
}