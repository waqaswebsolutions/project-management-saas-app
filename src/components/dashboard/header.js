'use client';

import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/hooks/use-sidebar';
import { UserButton } from '@clerk/nextjs';
import { ThemeToggle } from './theme-toggle';

export function Header() {
  const { toggleSidebar } = useSidebar();

  return (
    <header className="flex items-center h-16 gap-4 px-6 bg-white border-b border-gray-200 dark:border-gray-800 dark:bg-gray-900">
      <Button
        variant="ghost"
        size="icon"
        className="text-gray-700 lg:hidden dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
        onClick={toggleSidebar}
      >
        <Menu className="w-5 h-5" />
      </Button>
      
      <div className="flex-1">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Dashboard</h2>
      </div>

      <div className="flex items-center gap-2">
        <ThemeToggle />
      </div>
    </header>
  );
}