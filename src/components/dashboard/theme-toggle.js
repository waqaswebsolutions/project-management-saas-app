'use client';

import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Moon, Sun, Laptop } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Check } from 'lucide-react';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="text-gray-700 dark:text-gray-300">
        <Sun className="w-5 h-5" />
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon"
          className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          {theme === 'dark' ? (
            <Moon className="w-5 h-5" />
          ) : theme === 'light' ? (
            <Sun className="w-5 h-5" />
          ) : (
            <Laptop className="w-5 h-5" />
          )}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-white border-gray-200 dark:bg-gray-900 dark:border-gray-800">
        <DropdownMenuItem 
          onClick={() => setTheme('light')}
          className="text-gray-700 dark:text-gray-300 focus:bg-gray-100 dark:focus:bg-gray-800"
        >
          <Sun className="w-4 h-4 mr-2" />
          <span>Light</span>
          {theme === 'light' && <Check className="w-4 h-4 ml-2 text-primary-600 dark:text-primary-400" />}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme('dark')}
          className="text-gray-700 dark:text-gray-300 focus:bg-gray-100 dark:focus:bg-gray-800"
        >
          <Moon className="w-4 h-4 mr-2" />
          <span>Dark</span>
          {theme === 'dark' && <Check className="w-4 h-4 ml-2 text-primary-600 dark:text-primary-400" />}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme('system')}
          className="text-gray-700 dark:text-gray-300 focus:bg-gray-100 dark:focus:bg-gray-800"
        >
          <Laptop className="w-4 h-4 mr-2" />
          <span>System</span>
          {theme === 'system' && <Check className="w-4 h-4 ml-2 text-primary-600 dark:text-primary-400" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Add Check icon import