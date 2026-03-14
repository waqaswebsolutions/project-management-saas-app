import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { formatDistanceToNow, isToday, isTomorrow, isYesterday, format } from 'date-fns';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatDate(date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date));
}

export function formatRelativeTime(date) {
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  const now = new Date();
  const then = new Date(date);
  const diffInDays = Math.round((then.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (Math.abs(diffInDays) < 7) {
    return rtf.format(diffInDays, 'day');
  }
  
  return formatDate(date);
}

export function getStatusColor(status) {
  const colors = {
    'pending': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    'in-progress': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    'completed': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    'active': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    'archived': 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
    'low': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    'medium': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    'high': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    'critical': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  };
  return colors[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
}

export function truncateText(text, length) {
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
}

export function formatRelativeDate(date) {
  const dateObj = new Date(date);
  
  if (isToday(dateObj)) {
    return 'Today';
  }
  
  if (isTomorrow(dateObj)) {
    return 'Tomorrow';
  }
  
  if (isYesterday(dateObj)) {
    return 'Yesterday';
  }
  
  // For dates within the next 7 days, show relative
  const diffInDays = Math.ceil((dateObj - new Date()) / (1000 * 60 * 60 * 24));
  if (diffInDays > 0 && diffInDays <= 7) {
    return `In ${diffInDays} days`;
  }
  
  if (diffInDays < 0 && diffInDays >= -7) {
    return `${Math.abs(diffInDays)} days ago`;
  }
  
  // For everything else, show actual date
  return format(dateObj, 'MMM d, yyyy');
}

export function formatDueText(date) {
  const dateObj = new Date(date);
  const today = new Date();
  
  if (dateObj < today) {
    return `Overdue (${formatRelativeDate(date)})`;
  }
  
  return `Due ${formatRelativeDate(date)}`;
}