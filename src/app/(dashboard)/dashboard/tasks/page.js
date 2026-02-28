'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Edit, Trash2, CheckCircle, Clock } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate, getStatusColor } from '@/lib/utils';
import { DeleteConfirmDialog } from '@/components/shared/delete-confirm-dialog';

async function fetchTasks() {
  const response = await fetch('/api/tasks');
  if (!response.ok) {
    throw new Error('Failed to fetch tasks');
  }
  return response.json();
}

async function deleteTask(id) {
  const response = await fetch(`/api/tasks/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete task');
  }
  return response.json();
}

async function updateTaskStatus({ id, status }) {
  const response = await fetch(`/api/tasks/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  if (!response.ok) {
    throw new Error('Failed to update task');
  }
  return response.json();
}

export default function TasksPage() {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);

  const queryClient = useQueryClient();

  const { data: tasks, isLoading, error } = useQuery({
    queryKey: ['tasks'],
    queryFn: fetchTasks,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTask,
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks']);
      queryClient.invalidateQueries(['dashboard']);
      toast.success('Task deleted successfully');
      setDeleteDialogOpen(false);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete task');
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: updateTaskStatus,
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks']);
      queryClient.invalidateQueries(['dashboard']);
      toast.success('Task status updated');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update task');
    },
  });

  const handleDelete = (task) => {
    setTaskToDelete(task);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (taskToDelete) {
      deleteMutation.mutate(taskToDelete._id);
    }
  };

  const toggleTaskStatus = (task) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    updateStatusMutation.mutate({ id: task._id, status: newStatus });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="w-48 h-8" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="w-full h-24" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12 text-center">
        <p className="text-red-500">Error loading tasks</p>
        <Button onClick={() => window.location.reload()} className="mt-4">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">All Tasks</h2>
        <p className="text-muted-foreground">
          Manage and track all your tasks across projects
        </p>
      </div>

      {tasks?.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Clock className="w-12 h-12 mx-auto text-gray-400" />
            <h3 className="mt-4 text-lg font-medium">No tasks yet</h3>
            <p className="mb-4 text-gray-500">
              Tasks you create will appear here
            </p>
            <Link href="/dashboard/projects">
              <Button>Go to Projects</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <Card key={task._id} className="transition-shadow hover:shadow-md">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleTaskStatus(task)}
                        className={`rounded-full p-1 ${
                          task.status === 'completed' 
                            ? 'text-green-600 hover:text-green-700' 
                            : 'text-gray-400 hover:text-gray-500'
                        }`}
                      >
                        <CheckCircle className="w-5 h-5" />
                      </button>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className={`font-medium ${
                            task.status === 'completed' ? 'line-through text-gray-500' : ''
                          }`}>
                            {task.title}
                          </h4>
                          <span className="text-xs text-gray-400">
                            in{' '}
                            <Link 
                              href={`/dashboard/projects/${task.projectId?._id || task.projectId}`}
                              className="text-primary-600 hover:underline"
                            >
                              {task.projectId?.name || 'Project'}
                            </Link>
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-gray-600">
                          {task.description}
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-xs">
                          <span className={`rounded-full px-2 py-0.5 ${getStatusColor(task.priority)}`}>
                            {task.priority}
                          </span>
                          <span className={`rounded-full px-2 py-0.5 ${getStatusColor(task.status)}`}>
                            {task.status}
                          </span>
                          <span className="text-gray-500">
                            Due: {formatDate(task.dueDate)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Link href={`/dashboard/projects/${task.projectId?._id || task.projectId}`}>
                      <Button variant="ghost" size="sm">
                        View Project
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(task)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <DeleteConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Task"
        description="Are you sure you want to delete this task? This action cannot be undone."
      />
    </div>
  );
}