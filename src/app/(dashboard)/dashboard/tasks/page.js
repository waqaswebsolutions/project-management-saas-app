'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Edit, Trash2, CheckCircle, Clock, Filter, X } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate, getStatusColor, formatDueText } from '@/lib/utils';

// Filter options
const FILTERS = {
  ALL: 'all',
  PENDING: 'pending',
  IN_PROGRESS: 'in-progress',
  COMPLETED: 'completed',
  TODAY: 'today',
  WEEK: 'week'
};

const filterLabels = {
  [FILTERS.ALL]: 'All Tasks',
  [FILTERS.PENDING]: 'Pending',
  [FILTERS.IN_PROGRESS]: 'In Progress',
  [FILTERS.COMPLETED]: 'Completed',
  [FILTERS.TODAY]: 'Due Today',
  [FILTERS.WEEK]: 'Due This Week'
};

async function fetchTasks(activeFilter) {
  let url = '/api/tasks';
  
  if (activeFilter !== FILTERS.ALL) {
    url += `?filter=${activeFilter}`;
  }
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch tasks');
  }
  return response.json();
}

async function deleteTask(id) {
  const response = await fetch(`/api/tasks/${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Failed to delete task');
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
    const error = await response.text();
    throw new Error(error || 'Failed to update task');
  }
  return response.json();
}

export default function TasksPage() {
  const [activeFilter, setActiveFilter] = useState(FILTERS.ALL);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const queryClient = useQueryClient();

  const { data: tasks, isLoading, error } = useQuery({
    queryKey: ['tasks', activeFilter],
    queryFn: () => fetchTasks(activeFilter),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTask,
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks']);
      queryClient.invalidateQueries(['dashboard']);
      toast.success('Task deleted successfully');
      setDeleteDialogOpen(false);
      setTaskToDelete(null);
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

  const getFilterCount = (filterType) => {
    if (!tasks) return 0;
    
    switch(filterType) {
      case FILTERS.PENDING:
        return tasks.filter(t => t.status === 'pending').length;
      case FILTERS.IN_PROGRESS:
        return tasks.filter(t => t.status === 'in-progress').length;
      case FILTERS.COMPLETED:
        return tasks.filter(t => t.status === 'completed').length;
      case FILTERS.TODAY:
        const today = new Date().toDateString();
        return tasks.filter(t => new Date(t.dueDate).toDateString() === today).length;
      case FILTERS.WEEK:
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        return tasks.filter(t => new Date(t.dueDate) <= nextWeek).length;
      default:
        return tasks.length;
    }
  };

  if (isLoading) {
    return (
      <div className="px-4 mx-auto space-y-6 max-w-7xl sm:px-6 lg:px-8">
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
      <div className="px-4 py-12 text-center">
        <p className="text-red-500">Error loading tasks</p>
        <Button onClick={() => window.location.reload()} className="mt-4">
          Try Again
        </Button>
      </div>
    );
  }

  const filteredTasks = tasks?.filter(task => {
    switch(activeFilter) {
      case FILTERS.PENDING:
        return task.status === 'pending';
      case FILTERS.IN_PROGRESS:
        return task.status === 'in-progress';
      case FILTERS.COMPLETED:
        return task.status === 'completed';
      case FILTERS.TODAY:
        const today = new Date().toDateString();
        return new Date(task.dueDate).toDateString() === today;
      case FILTERS.WEEK:
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        return new Date(task.dueDate) <= nextWeek;
      default:
        return true;
    }
  }) || [];

  return (
    <div className="px-4 mx-auto space-y-6 max-w-7xl sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Tasks
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            {filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'} found
          </p>
        </div>
        
        {/* Mobile Filter Button */}
        <Button
          variant="outline"
          className="sm:hidden"
          onClick={() => setShowMobileFilters(!showMobileFilters)}
        >
          <Filter className="w-4 h-4 mr-2" />
          Filters
          {activeFilter !== FILTERS.ALL && (
            <span className="w-2 h-2 ml-2 rounded-full bg-primary-500"></span>
          )}
        </Button>
      </div>

      {/* Filter Chips - Desktop */}
      <div className="hidden sm:flex sm:flex-wrap sm:gap-2">
        {Object.values(FILTERS).map((filter) => (
          <Button
            key={filter}
            variant={activeFilter === filter ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveFilter(filter)}
            className="relative"
          >
            {filterLabels[filter]}
            {getFilterCount(filter) > 0 && activeFilter !== filter && (
              <span className="absolute flex items-center justify-center w-4 h-4 text-xs text-white rounded-full -top-1 -right-1 bg-primary-500">
                {getFilterCount(filter)}
              </span>
            )}
          </Button>
        ))}
      </div>

      {/* Filter Chips - Mobile */}
      {showMobileFilters && (
        <div className="flex flex-wrap gap-2 p-4 border border-gray-200 rounded-lg sm:hidden dark:border-gray-800">
          {Object.values(FILTERS).map((filter) => (
            <Button
              key={filter}
              variant={activeFilter === filter ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setActiveFilter(filter);
                setShowMobileFilters(false);
              }}
              className="flex-1 min-w-[120px]"
            >
              {filterLabels[filter]}
              {getFilterCount(filter) > 0 && (
                <span className="ml-2 text-xs">({getFilterCount(filter)})</span>
              )}
            </Button>
          ))}
        </div>
      )}

      {/* Active Filter Indicator */}
      {activeFilter !== FILTERS.ALL && (
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <span>Active filter: <span className="font-medium text-gray-700 dark:text-gray-300">{filterLabels[activeFilter]}</span></span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActiveFilter(FILTERS.ALL)}
            className="h-6 px-2 text-xs"
          >
            <X className="w-3 h-3 mr-1" />
            Clear
          </Button>
        </div>
      )}

      {/* Tasks List */}
      {filteredTasks.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Clock className="w-12 h-12 mx-auto text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
              No tasks found
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {activeFilter === FILTERS.ALL 
                ? 'Create your first task to get started'
                : `No ${filterLabels[activeFilter].toLowerCase()} tasks`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => (
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
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
                          <h4 className={`font-medium ${
                            task.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-900 dark:text-white'
                          }`}>
                            {task.title}
                          </h4>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(task.priority)}`}>
                              {task.priority}
                            </span>
                            <Link 
                              href={`/dashboard/projects/${task.projectId?._id || task.projectId}`}
                              className="text-xs text-primary-600 hover:underline dark:text-primary-400"
                            >
                              {task.projectId?.name || 'Project'}
                            </Link>
                          </div>
                        </div>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                          {task.description}
                        </p>
                        <div className="flex flex-wrap items-center gap-3 mt-2 text-xs">
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
                      onClick={() => handleDelete(task)}
                      disabled={deleteMutation.isLoading}
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

      {/* Delete Confirmation Dialog */}
      {deleteDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <Card className="w-full max-w-md">
            <CardContent className="p-6">
              <h3 className="mb-2 text-lg font-semibold">Delete Task</h3>
              <p className="mb-4 text-gray-600 dark:text-gray-300">
                Are you sure you want to delete this task? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={confirmDelete}
                  disabled={deleteMutation.isLoading}
                >
                  {deleteMutation.isLoading ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}