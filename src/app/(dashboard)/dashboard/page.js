'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { FolderKanban, CheckSquare, Clock, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { formatDate, getStatusColor } from '@/lib/utils';
import { ProjectModal } from '@/components/projects/project-modal';

async function fetchDashboardData() {
  const response = await fetch('/api/dashboard/stats');
  if (!response.ok) {
    throw new Error('Failed to fetch dashboard data');
  }
  return response.json();
}

export default function DashboardPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user } = useUser();
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['dashboard'],
    queryFn: fetchDashboardData,
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

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 mx-auto text-red-500" />
          <p className="mt-2 text-red-500">Error loading dashboard</p>
          <Button onClick={() => refetch()} className="mt-4">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const stats = [
    {
      title: 'Total Projects',
      value: data?.totalProjects || 0,
      icon: FolderKanban,
      color: 'bg-blue-500',
    },
    {
      title: 'Total Tasks',
      value: data?.totalTasks || 0,
      icon: CheckSquare,
      color: 'bg-green-500',
    },
    {
      title: 'Completed Tasks',
      value: data?.completedTasks || 0,
      icon: CheckSquare,
      color: 'bg-purple-500',
    },
    {
      title: 'Pending Tasks',
      value: data?.pendingTasks || 0,
      icon: Clock,
      color: 'bg-yellow-500',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">
            Welcome back, {user?.fullName || user?.emailAddresses[0]?.emailAddress}!
          </h2>
          <p className="text-muted-foreground">
            Here's what's happening with your projects today.
          </p>
        </div>
        <Button onClick={handleCreateNew}>
          <FolderKanban className="w-4 h-4 mr-2" />
          New Project
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-gray-500">
                {stat.title}
              </CardTitle>
              <div className={`rounded-lg ${stat.color} p-2 text-white`}>
                <stat.icon className="w-4 h-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Projects</CardTitle>
          </CardHeader>
          <CardContent>
            {data?.recentProjects?.length > 0 ? (
              <div className="space-y-4">
                {data.recentProjects.map((project) => (
                  <Link
                    key={project._id}
                    href={`/dashboard/projects/${project._id}`}
                    className="block"
                  >
                    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                      <div>
                        <h3 className="font-medium">{project.name}</h3>
                        <p className="text-sm text-gray-500">
                          {project.description}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`rounded-full px-2 py-1 text-xs ${getStatusColor(project.status)}`}>
                          {project.status}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center">
                <FolderKanban className="w-12 h-12 mx-auto text-gray-400" />
                <p className="mt-2 text-gray-500">No projects yet</p>
                <Button onClick={handleCreateNew} className="mt-4">
                  Create your first project
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            {data?.recentTasks?.length > 0 ? (
              <div className="space-y-4">
                {data.recentTasks.map((task) => (
                  <div
                    key={task._id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <h3 className="font-medium">{task.title}</h3>
                      <p className="text-sm text-gray-500">
                        Due: {formatDate(task.dueDate)}
                      </p>
                    </div>
                    <span className={`rounded-full px-2 py-1 text-xs ${getStatusColor(task.status)}`}>
                      {task.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center">
                <CheckSquare className="w-12 h-12 mx-auto text-gray-400" />
                <p className="mt-2 text-gray-500">No tasks yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <ProjectModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        project={null}
      />
    </div>
  );
}