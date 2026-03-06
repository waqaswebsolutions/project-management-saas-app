'use client';

import { useAuth } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/dashboard/sidebar';
import { Header } from '@/components/dashboard/header';
import { useSidebar } from '@/hooks/use-sidebar';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';
import { BackToTop } from '@/components/ui/back-to-top';

export default function DashboardLayout({ children }) {
  const { userId, isLoaded } = useAuth();
  const { isOpen, closeSidebar } = useSidebar();

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        closeSidebar();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [closeSidebar]);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 rounded-full animate-spin border-primary-600 border-t-transparent" />
          <p className="mt-2 text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!userId) {
    redirect('/sign-in');
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-20 transition-opacity bg-black bg-opacity-50 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-30 w-64 transform transition-transform duration-300 ease-in-out lg:static lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <Sidebar />
      </div>

      {/* Main content - RESTORED overflow-y-auto */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="relative flex-1 p-6 overflow-y-auto">
          {children}
          <BackToTop />
        </main>
      </div>
    </div>
  );
}