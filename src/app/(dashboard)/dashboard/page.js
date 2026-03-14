'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { FolderKanban, CheckSquare, Clock, AlertCircle, TrendingUp, TrendingDown } from 'lucide-react';
import Link from 'next/link';
import { formatDate, getStatusColor, formatDueText } from '@/lib/utils';
import { ProjectModal } from '@/components/projects/project-modal';
import { ActivityTimeline } from '@/components/dashboard/activity-timeline';

async function fetchDashboardData() {
  try {
    const response = await fetch('/api/dashboard/stats');
    if (!response.ok) {
      console.log('API returned error, using fallback data');
      return {
        totalProjects: 0,
        totalTasks: 0,
        completedTasks: 0,
        pendingTasks: 0,
        recentProjects: [],
        recentTasks: []
      };
    }
    return response.json();
  } catch (error) {
    console.error('Dashboard fetch error:', error);
    return {
      totalProjects: 0,
      totalTasks: 0,
      completedTasks: 0,
      pendingTasks: 0,
      recentProjects: [],
      recentTasks: []
    };
  }
}

export default function DashboardPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user } = useUser();
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['dashboard'],
    queryFn: fetchDashboardData,
    retry: 1,
  });

  const handleCreateNew = () => {
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  const stats = [
    {
      title: 'Total Projects',
      value: data?.totalProjects || 0,
      icon: FolderKanban,
      color: 'bg-blue-500',
      trend: '+12%',
      trendIcon: TrendingUp,
      trendColor: 'text-green-600',
      subtitle: 'from last month'
    },
    {
      title: 'Total Tasks',
      value: data?.totalTasks || 0,
      icon: CheckSquare,
      color: 'bg-green-500',
      trend: '+8%',
      trendIcon: TrendingUp,
      trendColor: 'text-green-600',
      subtitle: 'from yesterday'
    },
    {
      title: 'Completed Tasks',
      value: data?.completedTasks || 0,
      icon: CheckSquare,
      color: 'bg-purple-500',
      trend: '🎉',
      trendIcon: null,
      trendColor: 'text-purple-600',
      subtitle: 'Great progress!'
    },
    {
      title: 'Pending Tasks',
      value: data?.pendingTasks || 0,
      icon: Clock,
      color: 'bg-yellow-500',
      trend: '5',
      trendIcon: Clock,
      trendColor: 'text-orange-600',
      subtitle: 'due today'
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header Section with Welcome Message */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Welcome back, {user?.fullName || user?.emailAddresses[0]?.emailAddress}!
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Here's what's happening with your projects today.
          </p>
        </div>
        <Button 
          onClick={handleCreateNew} 
          size="lg"
          className="transition-all duration-200 shadow-lg hover:shadow-xl bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600"
        >
          <FolderKanban className="w-5 h-5 mr-2" />
          New Project
        </Button>
      </div>

      {/* Stats Cards with Enhanced UI */}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card 
            key={index} 
            className="transition-all duration-200 border-l-4 border-l-primary-600 dark:border-l-primary-500 hover:shadow-xl"
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300">
                {stat.title}
              </CardTitle>
              <div className={`rounded-xl ${stat.color} p-3 text-white shadow-md`}>
                <stat.icon className="w-4 h-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {stat.value}
              </div>
              <div className="flex items-center gap-2 mt-2">
                {stat.trendIcon ? (
                  <stat.trendIcon className={`w-4 h-4 ${stat.trendColor}`} />
                ) : (
                  <span className="text-lg">{stat.trend}</span>
                )}
                <span className={`text-sm font-medium ${stat.trendColor}`}>
                  {stat.trend}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {stat.subtitle}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Activity Timeline - Enhanced */}
      <div className="mt-8">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Recent Activity
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Track all actions across your projects
          </p>
        </div>
        <ActivityTimeline limit={10} />
      </div>

      {/* Recent Projects and Tasks - Enhanced Grid */}
      <div className="grid gap-6 mt-8 md:grid-cols-2 lg:grid-cols-7">
        {/* Recent Projects */}
        <Card className="col-span-4 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-primary-50 to-transparent dark:from-gray-800">
            <CardTitle className="text-xl">Recent Projects</CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Your latest project updates
            </p>
          </CardHeader>
          <CardContent className="pt-6">
            {data?.recentProjects?.length > 0 ? (
              <div className="space-y-4">
                {data.recentProjects.map((project) => (
                  <Link
                    key={project._id}
                    href={`/dashboard/projects/${project._id}`}
                    className="block group"
                  >
                    <div className="flex items-center justify-between p-4 transition-all border rounded-xl hover:shadow-md hover:border-primary-200 dark:hover:border-primary-800">
                      <div className="space-y-1">
                        <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 dark:text-white dark:group-hover:text-primary-400">
                          {project.name}
                        </h3>
                        <p className="text-sm text-gray-500 line-clamp-1">
                          {project.description}
                        </p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(project.status)}`}>
                        {project.status}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center">
                <div className="flex items-center justify-center w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full dark:bg-gray-800">
                  <FolderKanban className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">No projects yet</h3>
                <p className="mb-4 text-gray-500 dark:text-gray-400">
                  Get started by creating your first project
                </p>
                <Button onClick={handleCreateNew} variant="outline">
                  Create Project
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Tasks - WITH RELATIVE TIME DISPLAY */}
        <Card className="col-span-3 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-primary-50 to-transparent dark:from-gray-800">
            <CardTitle className="text-xl">Recent Tasks</CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Tasks that need attention
            </p>
          </CardHeader>
          <CardContent className="pt-6">
            {data?.recentTasks?.length > 0 ? (
              <div className="space-y-4">
                {data.recentTasks.map((task) => (
                  <div
                    key={task._id}
                    className="p-4 transition-all border rounded-xl hover:shadow-md"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {task.title}
                      </h3>
                      <span className={`rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(task.status)}`}>
                        {task.status}
                      </span>
                    </div>
                    <p className="mb-3 text-sm text-gray-500 line-clamp-2">
                      {task.description}
                    </p>
                    <div className="flex items-center justify-between text-xs">
                      {/* CHANGED: Now using formatDueText for relative time display */}
                      <span className="text-gray-500">
                        {formatDueText(task.dueDate)}
                      </span>
                      <span className={`px-2 py-1 rounded-full ${getStatusColor(task.priority)}`}>
                        {task.priority}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center">
                <div className="flex items-center justify-center w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full dark:bg-gray-800">
                  <CheckSquare className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">No tasks yet</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Create tasks in your projects
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Project Modal */}
      <ProjectModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        project={null}
      />
    </div>
  );
}