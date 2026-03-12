'use client';

import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/hooks/use-sidebar';
import { UserButton } from '@clerk/nextjs';
import { ThemeToggle } from './theme-toggle';
import { GlobalSearch } from './global-search';
import { KeyboardShortcuts } from './keyboard-shortcuts';

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
      
      <div className="flex items-center flex-1 gap-4">
        <h2 className="hidden text-lg font-semibold text-gray-900 dark:text-white md:block">
          Dashboard
        </h2>
        <div className="w-full max-w-md">
          <GlobalSearch />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <KeyboardShortcuts />
        <ThemeToggle />
        <UserButton 
          afterSignOutUrl="/"
          appearance={{
            elements: {
              userButtonAvatarBox: "w-8 h-8",
              userButtonTrigger: "focus:shadow-none"
            }
          }}
        />
      </div>
    </header>
  );
}