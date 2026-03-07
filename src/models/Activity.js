import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema(
  {
    clerkId: {
      type: String,
      required: true,
      index: true,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
    },
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
    },
    action: {
      type: String,
      required: true,
      enum: [
        'project_created',
        'project_updated',
        'project_deleted',
        'task_created',
        'task_updated',
        'task_deleted',
        'task_completed',
        'task_status_changed'
      ],
    },
    details: {
      type: String,
      required: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
activitySchema.index({ clerkId: 1, createdAt: -1 });
activitySchema.index({ projectId: 1, createdAt: -1 });

export default mongoose.models.Activity || mongoose.model('Activity', activitySchema);