'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Settings,
  BarChart3,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserButton } from '@clerk/nextjs';
import { useSidebar } from '@/hooks/use-sidebar';

const navigation = [
  { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Projects', href: '/dashboard/projects', icon: FolderKanban },
  { name: 'Tasks', href: '/dashboard/tasks', icon: CheckSquare },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useUser();
  const { isOpen, toggleSidebar } = useSidebar();

  return (
    <div
      className={cn(
        'flex flex-col h-full bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950 border-r border-gray-200 dark:border-gray-800 transition-all duration-300',
        isOpen ? 'w-64' : 'w-20'
      )}
    >
      {/* Header with Logo and Toggle */}
      <div className="relative flex items-center justify-center h-16 bg-white border-b border-gray-200 dark:border-gray-800 dark:bg-gray-900">
        {isOpen ? (
          <h1 className="text-xl font-bold text-transparent bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text">
            ProjectFlow
          </h1>
        ) : (
          <h1 className="text-2xl font-bold text-primary-600 dark:text-primary-400">PF</h1>
        )}
        
        {/* Toggle Button */}
        <button
          onClick={toggleSidebar}
          className="absolute -right-3 top-1/2 transform -translate-y-1/2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-full p-1.5 shadow-md hover:shadow-lg transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          {isOpen ? (
            <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'group flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                isActive
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white',
                !isOpen && 'justify-center'
              )}
              title={!isOpen ? item.name : ''}
            >
              <item.icon
                className={cn(
                  'h-5 w-5 flex-shrink-0 transition-colors',
                  isOpen ? 'mr-3' : 'mr-0',
                  isActive
                    ? 'text-white'
                    : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-300'
                )}
              />
              {isOpen && <span>{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="p-4 bg-white border-t border-gray-200 dark:border-gray-800 dark:bg-gray-900">
        <div className={cn('flex items-center', isOpen ? 'space-x-3' : 'justify-center')}>
          <UserButton 
            afterSignOutUrl="/"
            appearance={{
              elements: {
                userButtonAvatarBox: "w-8 h-8",
                userButtonTrigger: "focus:shadow-none"
              }
            }}
          />
          {isOpen && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate dark:text-white">
                {user?.fullName || user?.emailAddresses[0]?.emailAddress}
              </p>
              <p className="text-xs text-gray-500 truncate dark:text-gray-400">
                {user?.emailAddresses[0]?.emailAddress}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}