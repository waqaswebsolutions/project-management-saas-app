'use client';

import { cn } from '@/lib/utils';

export function ProgressBar({ value, max = 100, className = '', showPercentage = false }) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-500 dark:text-gray-400">Progress</span>
        {showPercentage && (
          <span className="font-medium text-gray-700 dark:text-gray-300">
            {Math.round(percentage)}%
          </span>
        )}
      </div>
      <div className={cn("w-full h-2 bg-gray-200 rounded-full dark:bg-gray-700", className)}>
        <div 
          className="h-2 transition-all duration-300 rounded-full bg-primary-600 dark:bg-primary-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}