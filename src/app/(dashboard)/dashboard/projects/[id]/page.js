'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Edit, Trash2, CheckCircle, Clock, Paperclip, Download, FileText, Image } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate, getStatusColor, formatDueText } from '@/lib/utils';
import { TaskModal } from '@/components/tasks/task-modal';
import { DeleteConfirmDialog } from '@/components/shared/delete-confirm-dialog';

async function fetchProject(id) {
  console.log('Fetching project:', id);
  const response = await fetch(`/api/projects/${id}`);
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Failed to fetch project');
  }
  return response.json();
}

async function deleteTask(id) {
  console.log('Deleting task:', id);
  const response = await fetch(`/api/tasks/${id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  let data;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }
  
  if (!response.ok) {
    console.error('Delete task error response:', data);
    throw new Error(data.error || data || 'Failed to delete task');
  }
  
  return data;
}

async function updateTaskStatus({ id, status }) {
  console.log('Updating task status:', id, status);
  const response = await fetch(`/api/tasks/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  
  let data;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }
  
  if (!response.ok) {
    console.error('Update task error response:', data);
    throw new Error(data.error || data || 'Failed to update task');
  }
  
  return data;
}

function getFileIcon(fileType) {
  if (fileType?.startsWith('image/')) {
    return <Image className="w-4 h-4 text-blue-500" />;
  }
  return <FileText className="w-4 h-4 text-gray-500" />;
}

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id;
  const queryClient = useQueryClient();

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => fetchProject(projectId),
    retry: 1,
  });

  const deleteTaskMutation = useMutation({
    mutationFn: deleteTask,
    onSuccess: (data) => {
      console.log('Task deleted successfully:', data);
      queryClient.invalidateQueries(['project', projectId]);
      queryClient.invalidateQueries(['tasks']);
      queryClient.invalidateQueries(['dashboard']);
      toast.success('Task deleted successfully');
      setDeleteDialogOpen(false);
      setTaskToDelete(null);
    },
    onError: (error) => {
      console.error('Delete task mutation error:', error);
      toast.error(error.message || 'Failed to delete task');
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: updateTaskStatus,
    onSuccess: (data) => {
      console.log('Task status updated successfully:', data);
      queryClient.invalidateQueries(['project', projectId]);
      queryClient.invalidateQueries(['tasks']);
      queryClient.invalidateQueries(['dashboard']);
      toast.success('Task status updated');
    },
    onError: (error) => {
      console.error('Update task status error:', error);
      toast.error(error.message || 'Failed to update task status');
    },
  });

  const handleCreateTask = () => {
    console.log('Create new task clicked');
    setSelectedTask(null);
    setIsTaskModalOpen(true);
  };

  const handleEditTask = (task) => {
    console.log('Edit task clicked:', task);
    setSelectedTask(task);
    setIsTaskModalOpen(true);
  };

  const handleDeleteTask = (task) => {
    console.log('Delete task clicked:', task);
    setTaskToDelete(task);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteTask = () => {
    if (taskToDelete) {
      console.log('Confirming delete for task:', taskToDelete._id);
      deleteTaskMutation.mutate(taskToDelete._id);
    }
  };

  const toggleTaskStatus = (task) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    console.log('Toggling task status:', task._id, 'from', task.status, 'to', newStatus);
    updateStatusMutation.mutate({ id: task._id, status: newStatus });
  };

  const handleModalClose = () => {
    console.log('Task modal closing');
    setIsTaskModalOpen(false);
    setSelectedTask(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="w-24 h-10" />
        </div>
        <Skeleton className="w-full h-32" />
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="w-32 h-8" />
            <Skeleton className="w-24 h-10" />
          </div>
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="w-full h-20" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="max-w-md text-center">
          <h3 className="mb-2 text-lg font-semibold text-gray-900">
            Error Loading Project
          </h3>
          <p className="mb-4 text-gray-600">
            {error?.message || 'Failed to load project. Please try again.'}
          </p>
          <div className="flex justify-center gap-3">
            <Button onClick={() => refetch()} variant="default">
              Try Again
            </Button>
            <Button onClick={() => router.push('/dashboard/projects')} variant="outline">
              Back to Projects
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const project = data;
  const tasks = data.tasks || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.push('/dashboard/projects')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Projects
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">{project.name}</CardTitle>
              <p className="mt-1 text-sm text-gray-500">
                Created on {formatDate(project.createdAt)}
              </p>
            </div>
            <div className="flex gap-2">
              <span className={`rounded-full px-3 py-1 text-sm ${getStatusColor(project.status)}`}>
                {project.status}
              </span>
              <span className={`rounded-full px-3 py-1 text-sm ${getStatusColor(project.priority)}`}>
                {project.priority}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700 whitespace-pre-wrap">{project.description}</p>
          {project.endDate && (
            <p className="mt-4 text-sm text-gray-500">
              End Date: {formatDate(project.endDate)}
            </p>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">Tasks</h3>
        <Button onClick={handleCreateTask}>
          <Plus className="w-4 h-4 mr-2" />
          Add Task
        </Button>
      </div>

      {tasks.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Clock className="w-12 h-12 mx-auto text-gray-400" />
            <h3 className="mt-4 text-lg font-medium">No tasks yet</h3>
            <p className="mb-4 text-gray-500">
              Create your first task for this project
            </p>
            <Button onClick={handleCreateTask}>
              Create Task
            </Button>
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
                        disabled={updateStatusMutation.isLoading}
                        className={`rounded-full p-1 transition-colors ${
                          task.status === 'completed' 
                            ? 'text-green-600 hover:text-green-700' 
                            : 'text-gray-400 hover:text-gray-500'
                        } ${updateStatusMutation.isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <CheckCircle className="w-5 h-5" />
                      </button>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className={`font-medium ${
                            task.status === 'completed' ? 'line-through text-gray-500' : ''
                          }`}>
                            {task.title}
                          </h4>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(task.priority)}`}>
                            {task.priority}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-gray-600">
                          {task.description}
                        </p>
                        
                        {/* File Attachments Display */}
                        {task.attachments?.length > 0 && (
                          <div className="mt-3 space-y-2">
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Paperclip className="w-3 h-3" />
                              <span>Attachments ({task.attachments.length})</span>
                            </div>
                            <div className="space-y-1">
                              {task.attachments.map((file, idx) => (
                                <a
                                  key={idx}
                                  href={file.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 p-2 text-xs transition-colors rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 group"
                                >
                                  {getFileIcon(file.type)}
                                  <span className="flex-1 font-medium text-gray-700 truncate dark:text-gray-300">
                                    {file.name}
                                  </span>
                                  <span className="text-gray-400 text-[10px]">
                                    {formatFileSize(file.size)}
                                  </span>
                                  <Download className="w-3 h-3 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300" />
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-3 mt-2 text-xs">
                          <span className={`rounded-full px-2 py-0.5 ${getStatusColor(task.status)}`}>
                            {task.status}
                          </span>
                          <span className="text-gray-500">
                            {formatDueText(task.dueDate)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditTask(task)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteTask(task)}
                      disabled={deleteTaskMutation.isLoading}
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

      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={handleModalClose}
        projectId={projectId}
        task={selectedTask}
      />

      <DeleteConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setTaskToDelete(null);
        }}
        onConfirm={confirmDeleteTask}
        title="Delete Task"
        description="Are you sure you want to delete this task? This action cannot be undone."
        isDeleting={deleteTaskMutation.isLoading}
      />
    </div>
  );
}