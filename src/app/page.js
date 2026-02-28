'use client';

import { useUser, useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { UserButton } from '@clerk/nextjs';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();
  const router = useRouter();

  // Redirect to dashboard if already signed in
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.push('/dashboard');
    }
  }, [isLoaded, isSignedIn, router]);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 mx-auto border-4 rounded-full border-primary-600 border-t-transparent animate-spin"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If signed in, this will redirect, but show loading state while redirecting
  if (isSignedIn) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 mx-auto border-4 rounded-full border-primary-600 border-t-transparent animate-spin"></div>
          <p className="mt-2 text-gray-600">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white dark:from-gray-900 dark:to-gray-950">
      <nav className="container px-6 py-4 mx-auto">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary-600 dark:text-primary-400">ProjectFlow</h1>
          <div className="flex items-center space-x-4">
            <Link href="/sign-in">
              <Button variant="outline">Sign In</Button>
            </Link>
            <Link href="/sign-up">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="container px-6 py-16 mx-auto">
        <div className="text-center">
          <h2 className="mb-4 text-5xl font-bold text-gray-900 dark:text-white">
            Manage Your Projects Like a Pro
          </h2>
          <p className="max-w-2xl mx-auto mb-8 text-xl text-gray-600 dark:text-gray-300">
            Professional project management SaaS for modern teams. Track projects, manage tasks, and collaborate efficiently.
          </p>
          <div className="space-x-4">
            <Link href="/sign-up">
              <Button size="lg">Start Free Trial</Button>
            </Link>
            <Link href="#features">
              <Button size="lg" variant="outline">Learn More</Button>
            </Link>
          </div>
        </div>

        <div className="grid gap-8 mt-20 md:grid-cols-3">
          {/* Feature cards */}
          <div className="text-center">
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-primary-100 dark:bg-primary-900">
              <svg className="w-8 h-8 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="mb-2 text-xl font-semibold">Project Management</h3>
            <p className="text-gray-600 dark:text-gray-400">Create and manage multiple projects with ease</p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-primary-100 dark:bg-primary-900">
              <svg className="w-8 h-8 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="mb-2 text-xl font-semibold">Task Tracking</h3>
            <p className="text-gray-600 dark:text-gray-400">Track tasks with priorities and due dates</p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-primary-100 dark:bg-primary-900">
              <svg className="w-8 h-8 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="mb-2 text-xl font-semibold">Real-time Updates</h3>
            <p className="text-gray-600 dark:text-gray-400">Get instant updates on project progress</p>
          </div>
        </div>
      </main>
    </div>
  );
}