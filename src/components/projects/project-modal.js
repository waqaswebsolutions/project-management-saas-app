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

const projectSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').max(100),
  description: z.string().min(10, 'Description must be at least 10 characters').max(1000),
  status: z.enum(['active', 'archived', 'completed']),
  priority: z.enum(['low', 'medium', 'high']),
  endDate: z.string().optional(),
});

async function createProject(data) {
  const response = await fetch('/api/projects', {
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

async function updateProject({ id, data }) {
  const response = await fetch(`/api/projects/${id}`, {
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

export function ProjectModal({ isOpen, onClose, project }) {
  const queryClient = useQueryClient();
  const isEditing = !!project;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(projectSchema),
    mode: 'onChange', // This makes validation run on every keystroke
    reValidateMode: 'onChange',
    defaultValues: {
      name: '',
      description: '',
      status: 'active',
      priority: 'medium',
      endDate: '',
    },
  });

  // Watch form values for debugging (optional)
  const watchName = watch('name');
  const watchDescription = watch('description');

  useEffect(() => {
    if (isOpen) {
      if (project) {
        reset({
          name: project.name || '',
          description: project.description || '',
          status: project.status || 'active',
          priority: project.priority || 'medium',
          endDate: project.endDate ? new Date(project.endDate).toISOString().split('T')[0] : '',
        });
      } else {
        reset({
          name: '',
          description: '',
          status: 'active',
          priority: 'medium',
          endDate: '',
        });
      }
    }
  }, [isOpen, project, reset]);

  const mutation = useMutation({
    mutationFn: isEditing 
      ? (data) => updateProject({ id: project._id, data })
      : createProject,
    onSuccess: () => {
      queryClient.invalidateQueries(['projects']);
      queryClient.invalidateQueries(['dashboard']);
      toast.success(isEditing ? 'Project updated successfully' : 'Project created successfully');
      onClose();
    },
    onError: (error) => {
      toast.error(error.message || `Failed to ${isEditing ? 'update' : 'create'} project`);
    },
  });

  const onSubmit = (data) => {
    mutation.mutate(data);
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Project' : 'Create New Project'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Project Name</Label>
            <Input
              id="name"
              placeholder="Enter project name"
              {...register('name', { onChange: (e) => e.target.value })}
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
            {/* Optional: Show character count */}
            <p className="text-xs text-gray-500">
              {watchName?.length || 0}/100 characters
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Enter project description"
              rows={4}
              {...register('description', { onChange: (e) => e.target.value })}
              className={errors.description ? 'border-red-500' : ''}
            />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description.message}</p>
            )}
            {/* Optional: Show character count */}
            <p className="text-xs text-gray-500">
              {watchDescription?.length || 0}/1000 characters (min 10)
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                className="w-full p-2 text-gray-900 bg-white border border-gray-300 rounded-md dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                {...register('status')}
              >
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <select
                id="priority"
                className="w-full p-2 text-gray-900 bg-white border border-gray-300 rounded-md dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                {...register('priority')}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="endDate">End Date (Optional)</Label>
            <Input
              id="endDate"
              type="date"
              {...register('endDate')}
              className="text-gray-900 dark:text-gray-100"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={mutation.isLoading || Object.keys(errors).length > 0}
            >
              {mutation.isLoading 
                ? (isEditing ? 'Updating...' : 'Creating...') 
                : (isEditing ? 'Update Project' : 'Create Project')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
