'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FileAttachment } from './file-attachment';

const taskSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200),
  description: z.string().min(5, 'Description must be at least 5 characters').max(2000),
  status: z.enum(['pending', 'in-progress', 'completed']),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  dueDate: z.string().min(1, 'Due date is required'),
});

async function createTask(data) {
  console.log('🟡 API CALL STARTED to /api/tasks');
  console.log('🟡 Request payload:', JSON.stringify(data, null, 2));
  
  try {
    const response = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    
    console.log('🟡 Response status:', response.status);
    
    if (!response.ok) {
      const error = await response.text();
      console.log('🔴 API ERROR RESPONSE:', error);
      throw new Error(error);
    }
    
    const result = await response.json();
    console.log('🟢 API SUCCESS:', JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.log('🔴 API CATCH ERROR:', error);
    throw error;
  }
}

async function updateTask({ id, data }) {
  console.log('🟡 UPDATE API CALL STARTED to /api/tasks/' + id);
  console.log('🟡 Request payload:', JSON.stringify(data, null, 2));
  
  const response = await fetch(`/api/tasks/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }
  return response.json();
}

export function TaskModal({ isOpen, onClose, projectId, task }) {
  const queryClient = useQueryClient();
  const isEditing = !!task;
  const [attachments, setAttachments] = useState([]);

  console.log('🟣 TaskModal Render - isOpen:', isOpen, 'isEditing:', isEditing, 'projectId:', projectId);
  console.log('🟣 Current attachments:', attachments);

  const {
    register,
    handleSubmit,
    reset,
    trigger,
    formState: { errors, isValid },
  } = useForm({
    resolver: zodResolver(taskSchema),
    mode: 'onChange',
    defaultValues: {
      title: '',
      description: '',
      status: 'pending',
      priority: 'medium',
      dueDate: '',
    },
  });

  // Reset form when modal opens/closes or task changes
  useEffect(() => {
    console.log('🟢 useEffect triggered - isOpen:', isOpen, 'task:', task);
    if (isOpen) {
      if (task) {
        console.log('Editing task:', task);
        console.log('Task attachments from database:', task.attachments);
        reset({
          title: task.title || '',
          description: task.description || '',
          status: task.status || 'pending',
          priority: task.priority || 'medium',
          dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
        });
        setAttachments(task.attachments || []);
        setTimeout(() => {
          trigger();
        }, 100);
      } else {
        console.log('Creating new task');
        reset({
          title: '',
          description: '',
          status: 'pending',
          priority: 'medium',
          dueDate: '',
        });
        setAttachments([]);
      }
    }
  }, [isOpen, task, reset, trigger]);

  const mutation = useMutation({
    mutationFn: isEditing 
      ? (data) => {
          console.log('🟡 Calling updateTask with:', { id: task._id, data });
          return updateTask({ id: task._id, data });
        }
      : (data) => {
          console.log('🟡 Calling createTask with:', data);
          return createTask({ ...data, projectId });
        },
    onSuccess: (data) => {
      console.log('🟢 MUTATION SUCCESS:', data);
      queryClient.invalidateQueries(['project', projectId]);
      queryClient.invalidateQueries(['tasks']);
      queryClient.invalidateQueries(['dashboard']);
      toast.success(isEditing ? 'Task updated successfully' : 'Task created successfully');
      onClose();
    },
    onError: (error) => {
      console.log('🔴 MUTATION ERROR:', error);
      toast.error(error.message || `Failed to ${isEditing ? 'update' : 'create'} task`);
    },
  });

  const onSubmit = (data) => {
    console.log('🔵 FORM SUBMISSION STARTED');
    console.log('🔵 Form data:', data);
    console.log('🔵 Attachments being sent:', JSON.stringify(attachments, null, 2));
    
    // Check if attachments array has items
    if (attachments.length > 0) {
      console.log('✅ Attachments present! Count:', attachments.length);
      console.log('✅ First attachment sample:', attachments[0]);
    } else {
      console.log('❌ No attachments to save');
    }
    
    // Include attachments in the submission
    const taskData = {
      ...data,
      attachments: attachments,
    };
    
    console.log('🔵 Final task data being sent:', JSON.stringify(taskData, null, 2));
    
    if (!isValid) {
      console.log('🔴 Form is invalid, not submitting');
      toast.error('Please fix validation errors first');
      return;
    }
    
    console.log('🟢 Form is valid, calling mutation...');
    mutation.mutate(taskData);
  };

  const handleUploadComplete = (newAttachments) => {
    console.log('📎 Upload complete, new attachments:', newAttachments);
    setAttachments(prev => {
      const updated = [...prev, ...newAttachments];
      console.log('📎 Updated attachments array:', updated);
      return updated;
    });
    toast.success('File attached successfully!');
  };

  const handleRemoveAttachment = (index) => {
    console.log('📎 Removing attachment at index:', index);
    setAttachments(prev => {
      const updated = prev.filter((_, i) => i !== index);
      console.log('📎 Updated attachments after removal:', updated);
      return updated;
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Task' : 'Create New Task'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Task Title</Label>
            <Input
              id="title"
              placeholder="Enter task title"
              {...register('title')}
              className={errors.title ? 'border-red-500' : ''}
            />
            {errors.title && (
              <p className="text-sm text-red-500">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Enter task description"
              rows={3}
              {...register('description')}
              className={errors.description ? 'border-red-500' : ''}
            />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-900 dark:border-gray-700"
                {...register('status')}
              >
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <select
                id="priority"
                className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-900 dark:border-gray-700"
                {...register('priority')}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date</Label>
            <Input
              id="dueDate"
              type="date"
              {...register('dueDate')}
              className={errors.dueDate ? 'border-red-500' : ''}
            />
            {errors.dueDate && (
              <p className="text-sm text-red-500">{errors.dueDate.message}</p>
            )}
          </div>

          {/* File Attachments Section */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Attachments ({attachments.length})
            </div>
            <FileAttachment
              attachments={attachments}
              onUploadComplete={handleUploadComplete}
              onRemove={handleRemoveAttachment}
              readOnly={false}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={mutation.isLoading || !isValid}
            >
              {mutation.isLoading 
                ? (isEditing ? 'Updating...' : 'Creating...') 
                : (isEditing ? 'Update Task' : 'Create Task')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}