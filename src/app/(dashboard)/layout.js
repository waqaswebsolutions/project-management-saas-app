'use client';

import { useAuth } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/dashboard/sidebar';
import { Header } from '@/components/dashboard/header';

export default function DashboardLayout({ children }) {
  const { userId, isLoaded } = useAuth();

  if (!isLoaded) return <div>Loading...</div>;
  if (!userId) redirect('/sign-in');

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}