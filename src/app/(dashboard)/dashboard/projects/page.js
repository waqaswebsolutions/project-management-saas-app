'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Eye, AlertCircle, Search, X } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { formatDate, getStatusColor, truncateText } from '@/lib/utils';
import { ProjectModal } from '@/components/projects/project-modal';
import { DeleteConfirmDialog } from '@/components/shared/delete-confirm-dialog';

async function fetchProjects(searchTerm) {
  console.log('Fetching projects...');
  
  const url = searchTerm 
    ? `/api/projects?search=${encodeURIComponent(searchTerm)}`
    : '/api/projects';
  
  const response = await fetch(url);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('Fetch projects error response:', errorText);
    throw new Error(`Failed to fetch projects: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  console.log('Projects fetched successfully:', data);
  return data;
}

async function deleteProject(id) {
  console.log('Deleting project:', id);
  const response = await fetch(`/api/projects/${id}`, {
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
    console.error('Delete project error response:', data);
    throw new Error(data.error || data || 'Failed to delete project');
  }
  
  return data;
}

export default function ProjectsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500); // Wait 500ms after user stops typing

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const queryClient = useQueryClient();

  const { 
    data: projects, 
    isLoading, 
    error, 
    refetch,
    isError 
  } = useQuery({
    queryKey: ['projects', debouncedSearchTerm], // Use debounced term
    queryFn: () => fetchProjects(debouncedSearchTerm),
    retry: 1,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProject,
    onSuccess: (data) => {
      console.log('Project deleted successfully:', data);
      queryClient.invalidateQueries(['projects']);
      queryClient.invalidateQueries(['dashboard']);
      toast.success(`Project deleted successfully${data.deletedTasksCount ? ` along with ${data.deletedTasksCount} tasks` : ''}`);
      setDeleteDialogOpen(false);
      setProjectToDelete(null);
    },
    onError: (error) => {
      console.error('Delete project mutation error:', error);
      toast.error(error.message || 'Failed to delete project');
    },
  });

  const handleCreateNew = () => {
    console.log('Create new project clicked');
    setSelectedProject(null);
    setIsModalOpen(true);
  };

  const handleEdit = (project) => {
    console.log('Edit project clicked:', project);
    setSelectedProject(project);
    setIsModalOpen(true);
  };

  const handleDelete = (project) => {
    console.log('Delete project clicked:', project);
    setProjectToDelete(project);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (projectToDelete) {
      console.log('Confirming delete for project:', projectToDelete._id);
      deleteMutation.mutate(projectToDelete._id);
    }
  };

  const handleModalClose = () => {
    console.log('Modal closing');
    setIsModalOpen(false);
    setSelectedProject(null);
  };

  // Show error state
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <div className="w-full max-w-md text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
            Error Loading Projects
          </h3>
          <p className="mb-4 text-gray-600 dark:text-gray-400">
            {error?.message || 'Failed to load projects. Please try again.'}
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button onClick={() => refetch()} variant="default" className="w-full sm:w-auto">
              Try Again
            </Button>
            <Button onClick={handleCreateNew} variant="outline" className="w-full sm:w-auto">
              Create New Project
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="px-4 mx-auto space-y-6 max-w-7xl sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Skeleton className="w-48 h-8 mb-2" />
            <Skeleton className="w-64 h-4" />
          </div>
          <Skeleton className="w-full h-10 sm:w-32" />
        </div>
        <Skeleton className="w-full h-10" />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="w-3/4 h-6" />
              </CardHeader>
              <CardContent>
                <Skeleton className="w-full h-16 mb-4" />
                <Skeleton className="w-1/2 h-4 mb-2" />
                <Skeleton className="w-1/3 h-4" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 mx-auto space-y-6 max-w-7xl sm:px-6 lg:px-8">
      {/* Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white lg:text-3xl">
            Projects
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 lg:text-base">
            Manage your projects and track their progress
          </p>
        </div>
        <Button onClick={handleCreateNew} size="lg" className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          New Project
        </Button>
      </div>

      {/* Search Bar - Fixed Layout */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="w-4 h-4 text-gray-400" />
          </div>
          <Input
            type="text"
            placeholder="Search projects by name or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-10"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        {searchTerm && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setSearchTerm('')}
            className="whitespace-nowrap"
          >
            Clear
          </Button>
        )}
      </div>

      {/* Empty State */}
      {(!projects || projects.length === 0) ? (
        <Card>
          <CardContent className="px-4 py-16 text-center sm:px-6 lg:px-8">
            <div className="flex items-center justify-center w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full sm:w-32 sm:h-32 dark:bg-gray-800">
              {searchTerm ? (
                <Search className="w-12 h-12 text-gray-400 sm:w-16 sm:h-16" />
              ) : (
                <Plus className="w-12 h-12 text-gray-400 sm:w-16 sm:h-16" />
              )}
            </div>
            <h3 className="mb-2 text-xl font-medium text-gray-900 dark:text-white lg:text-2xl">
              {searchTerm ? 'No projects found' : 'No projects yet'}
            </h3>
            <p className="max-w-md mx-auto mb-6 text-gray-500 dark:text-gray-400">
              {searchTerm 
                ? `No projects match "${searchTerm}". Try a different search term.`
                : 'Get started by creating your first project. Projects help you organize and track your work.'}
            </p>
            {!searchTerm && (
              <Button onClick={handleCreateNew} size="lg" className="w-full sm:w-auto">
                Create Your First Project
              </Button>
            )}
            {searchTerm && (
              <Button onClick={() => setSearchTerm('')} variant="outline" size="lg" className="w-full sm:w-auto">
                Clear Search
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        /* Projects Grid */
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {projects.map((project) => (
            <Card key={project._id} className="flex flex-col transition-shadow duration-200 hover:shadow-xl">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <CardTitle className="text-lg font-semibold text-gray-900 break-words dark:text-white line-clamp-2">
                    {truncateText(project.name, 40)}
                  </CardTitle>
                  <span className={`flex-shrink-0 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap ${getStatusColor(project.status)}`}>
                    {project.status}
                  </span>
                </div>
              </CardHeader>
              
              <CardContent className="flex flex-col flex-1 pt-0">
                <p className="flex-1 mb-4 text-sm text-gray-600 break-words line-clamp-3 dark:text-gray-300">
                  {truncateText(project.description, 120)}
                </p>
                
                <div className="pt-3 space-y-2 text-xs border-t border-gray-100 sm:text-sm dark:border-gray-800 dark:text-gray-400">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 dark:text-gray-500">Priority:</span>
                    <span className="font-medium text-gray-900 capitalize dark:text-white">{project.priority}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 dark:text-gray-500">Created:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{formatDate(project.createdAt)}</span>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="grid grid-cols-3 gap-1 mt-4">
                  <Link href={`/dashboard/projects/${project._id}`}>
                    <Button variant="outline" size="sm" className="w-full">
                      <Eye className="w-3.5 h-3.5 sm:mr-1" />
                      <span className="hidden sm:inline">View</span>
                    </Button>
                  </Link>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleEdit(project)}
                    className="w-full"
                  >
                    <Edit className="w-3.5 h-3.5 sm:mr-1" />
                    <span className="hidden sm:inline">Edit</span>
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => handleDelete(project)}
                    disabled={deleteMutation.isLoading}
                    className="w-full"
                  >
                    <Trash2 className="w-3.5 h-3.5 sm:mr-1" />
                    <span className="hidden sm:inline">Delete</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modals */}
      {isModalOpen && (
        <ProjectModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          project={selectedProject}
        />
      )}

      <DeleteConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setProjectToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Delete Project"
        description="Are you sure you want to delete this project? This action cannot be undone and will also delete all tasks associated with this project."
        isDeleting={deleteMutation.isLoading}
      />
    </div>
  );
}