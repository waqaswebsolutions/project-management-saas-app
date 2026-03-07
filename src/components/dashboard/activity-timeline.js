'use client';

import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { 
  FolderKanban, 
  CheckSquare, 
  Edit, 
  Trash2, 
  CheckCircle,
  Clock,
  PlusCircle,
  AlertCircle 
} from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

const actionIcons = {
  project_created: { icon: PlusCircle, color: 'text-blue-500', bg: 'bg-blue-100' },
  project_updated: { icon: Edit, color: 'text-yellow-500', bg: 'bg-yellow-100' },
  project_deleted: { icon: Trash2, color: 'text-red-500', bg: 'bg-red-100' },
  task_created: { icon: PlusCircle, color: 'text-green-500', bg: 'bg-green-100' },
  task_updated: { icon: Edit, color: 'text-yellow-500', bg: 'bg-yellow-100' },
  task_deleted: { icon: Trash2, color: 'text-red-500', bg: 'bg-red-100' },
  task_completed: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-100' },
  task_status_changed: { icon: Clock, color: 'text-purple-500', bg: 'bg-purple-100' },
};

async function fetchActivities(limit = 20) {
  const response = await fetch(`/api/activities?limit=${limit}`);
  if (!response.ok) {
    throw new Error('Failed to fetch activities');
  }
  return response.json();
}

export function ActivityTimeline({ projectId = null, limit = 20 }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadActivities();
  }, [projectId, limit]);

  const loadActivities = async () => {
    try {
      setLoading(true);
      const url = projectId 
        ? `/api/activities?limit=${limit}&projectId=${projectId}`
        : `/api/activities?limit=${limit}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch activities');
      }
      const data = await response.json();
      setActivities(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getActionText = (activity) => {
    const timeAgo = formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true });
    
    switch (activity.action) {
      case 'project_created':
        return (
          <span>
            Created project{' '}
            <Link href={`/dashboard/projects/${activity.projectId?._id}`} className="font-medium text-primary-600 hover:underline">
              {activity.metadata?.projectName || activity.projectId?.name}
            </Link>{' '}
            <span className="text-gray-500">{timeAgo}</span>
          </span>
        );
      case 'task_created':
        return (
          <span>
            Created task{' '}
            <Link href={`/dashboard/projects/${activity.projectId?._id}`} className="font-medium text-primary-600 hover:underline">
              {activity.metadata?.taskTitle || activity.taskId?.title}
            </Link>{' '}
            in project{' '}
            <Link href={`/dashboard/projects/${activity.projectId?._id}`} className="font-medium text-primary-600 hover:underline">
              {activity.projectId?.name}
            </Link>{' '}
            <span className="text-gray-500">{timeAgo}</span>
          </span>
        );
      case 'task_completed':
        return (
          <span>
            Completed task{' '}
            <Link href={`/dashboard/projects/${activity.projectId?._id}`} className="font-medium text-primary-600 hover:underline">
              {activity.metadata?.taskTitle || activity.taskId?.title}
            </Link>{' '}
            in project{' '}
            <Link href={`/dashboard/projects/${activity.projectId?._id}`} className="font-medium text-primary-600 hover:underline">
              {activity.projectId?.name}
            </Link>{' '}
            <span className="text-gray-500">{timeAgo}</span>
          </span>
        );
      case 'task_updated':
        return (
          <span>
            Updated task{' '}
            <Link href={`/dashboard/projects/${activity.projectId?._id}`} className="font-medium text-primary-600 hover:underline">
              {activity.metadata?.taskTitle || activity.taskId?.title}
            </Link>{' '}
            in project{' '}
            <Link href={`/dashboard/projects/${activity.projectId?._id}`} className="font-medium text-primary-600 hover:underline">
              {activity.projectId?.name}
            </Link>{' '}
            <span className="text-gray-500">{timeAgo}</span>
          </span>
        );
      default:
        return (
          <span>
            {activity.details} <span className="text-gray-500">{timeAgo}</span>
          </span>
        );
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Activity Timeline</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="w-8 h-8 rounded-full" />
              <div className="flex-1">
                <Skeleton className="w-full h-4 mb-2" />
                <Skeleton className="w-2/3 h-3" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Activity Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center">
            <AlertCircle className="w-12 h-12 mx-auto text-red-500" />
            <p className="mt-2 text-gray-500">Failed to load activities</p>
            <Button onClick={loadActivities} variant="outline" size="sm" className="mt-4">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Activity Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center">
            <Clock className="w-12 h-12 mx-auto text-gray-400" />
            <p className="mt-2 text-gray-500">No activity yet</p>
            <p className="text-sm text-gray-400">
              Actions will appear here as you create and update projects and tasks
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => {
            const Icon = actionIcons[activity.action]?.icon || Clock;
            const colorClass = actionIcons[activity.action]?.color || 'text-gray-500';
            const bgClass = actionIcons[activity.action]?.bg || 'bg-gray-100';

            return (
              <div key={activity._id} className="flex gap-3">
                <div className={`flex-shrink-0 w-8 h-8 rounded-full ${bgClass} flex items-center justify-center`}>
                  <Icon className={`w-4 h-4 ${colorClass}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 dark:text-white">
                    {getActionText(activity)}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    {activity.details}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}