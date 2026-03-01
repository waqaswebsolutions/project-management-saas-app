'use client';

import { useEffect } from 'react';
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

const taskSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200),
  description: z.string().min(5, 'Description must be at least 5 characters').max(2000),
  status: z.enum(['pending', 'in-progress', 'completed']),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  dueDate: z.string().min(1, 'Due date is required'),
});

async function createTask(data) {
  const response = await fetch('/api/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }
  return response.json();
}

async function updateTask({ id, data }) {
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

  const {
    register,
    handleSubmit,
    reset,
    watch,
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

  // Watch all fields for debugging
  const watchTitle = watch('title');
  const watchDescription = watch('description');
  const watchDueDate = watch('dueDate');

  // Log validation state whenever it changes
  useEffect(() => {
    console.log('🔍 Form Validation State:', {
      isValid,
      title: { value: watchTitle, length: watchTitle?.length, error: errors.title?.message },
      description: { value: watchDescription, length: watchDescription?.length, error: errors.description?.message },
      dueDate: { value: watchDueDate, error: errors.dueDate?.message },
      allErrors: errors
    });
  }, [isValid, watchTitle, watchDescription, watchDueDate, errors]);

  useEffect(() => {
    if (isOpen) {
      if (task) {
        reset({
          title: task.title || '',
          description: task.description || '',
          status: task.status || 'pending',
          priority: task.priority || 'medium',
          dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
        });
      } else {
        reset({
          title: '',
          description: '',
          status: 'pending',
          priority: 'medium',
          dueDate: '',
        });
      }
    }
  }, [isOpen, task, reset]);

  const mutation = useMutation({
    mutationFn: isEditing 
      ? (data) => updateTask({ id: task._id, data })
      : (data) => createTask({ ...data, projectId }),
    onSuccess: () => {
      queryClient.invalidateQueries(['project', projectId]);
      queryClient.invalidateQueries(['tasks']);
      queryClient.invalidateQueries(['dashboard']);
      toast.success(isEditing ? 'Task updated successfully' : 'Task created successfully');
      onClose();
    },
    onError: (error) => {
      toast.error(error.message || `Failed to ${isEditing ? 'update' : 'create'} task`);
    },
  });

  const onSubmit = (data) => {
    console.log('✅ Form submitted with data:', data);
    mutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
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
              className={errors.title ? 'border-red-500' : 'border-gray-300'}
            />
            {errors.title && (
              <p className="text-sm text-red-500">{errors.title.message}</p>
            )}
            <p className="text-xs text-gray-500">
              Current length: {watchTitle?.length || 0}/3 minimum
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Enter task description"
              rows={3}
              {...register('description')}
              className={errors.description ? 'border-red-500' : 'border-gray-300'}
            />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description.message}</p>
            )}
            <p className="text-xs text-gray-500">
              Current length: {watchDescription?.length || 0}/5 minimum
            </p>
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
              className={errors.dueDate ? 'border-red-500' : 'border-gray-300'}
            />
            {errors.dueDate && (
              <p className="text-sm text-red-500">{errors.dueDate.message}</p>
            )}
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

          {/* Debug info - remove after fixing */}
          <div className="p-2 mt-2 text-xs border border-gray-200 rounded dark:border-gray-700">
            <p>Form Status: {isValid ? '✅ Valid' : '❌ Invalid'}</p>
            <p>Button Enabled: {(!mutation.isLoading && isValid) ? '✅ Yes' : '❌ No'}</p>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}