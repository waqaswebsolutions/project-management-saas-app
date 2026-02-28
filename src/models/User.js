import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    clerkId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    avatar: {
      type: String,
      default: '',
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    notifications: {
      emailNotifications: { type: Boolean, default: true },
      taskAssignments: { type: Boolean, default: true },
      dueDateReminders: { type: Boolean, default: true },
      projectUpdates: { type: Boolean, default: false },
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes
userSchema.index({ clerkId: 1 });
userSchema.index({ email: 1 });

// Check if model exists before creating a new one
export default mongoose.models.User || mongoose.model('User', userSchema);