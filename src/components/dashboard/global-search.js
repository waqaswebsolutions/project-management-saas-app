'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, X, FolderKanban, CheckSquare, Clock, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { formatDate, getStatusColor } from '@/lib/utils';

export function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ projects: [], tasks: [] });
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const searchRef = useRef(null);
  const inputRef = useRef(null);
  const router = useRouter();

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved).slice(0, 5));
    }
  }, []);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard shortcut (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 100);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim().length >= 2) {
        performSearch();
      } else {
        setResults({ projects: [], tasks: [] });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const performSearch = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error('Search failed');
      const data = await response.json();
      setResults(data);
      
      // Save to recent searches
      const newRecent = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5);
      setRecentSearches(newRecent);
      localStorage.setItem('recentSearches', JSON.stringify(newRecent));
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (type, id) => {
    setIsOpen(false);
    setQuery('');
    if (type === 'project') {
      router.push(`/dashboard/projects/${id}`);
    } else {
      // For tasks, we need to navigate to the project containing the task
      // This assumes your task object has projectId
      const task = results.tasks.find(t => t._id === id);
      if (task) {
        router.push(`/dashboard/projects/${task.projectId}`);
      }
    }
  };

  const handleRecentClick = (term) => {
    setQuery(term);
    inputRef.current?.focus();
  };

  return (
    <div className="relative" ref={searchRef}>
      {/* Search Trigger Button */}
      <Button
        variant="outline"
        className="relative justify-start w-full text-gray-500 md:w-64 lg:w-80 dark:text-gray-400"
        onClick={() => setIsOpen(true)}
      >
        <Search className="w-4 h-4 mr-2" />
        <span className="flex-1 text-left">Search projects & tasks...</span>
        <kbd className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 rounded">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      {/* Search Modal */}
      {isOpen && (
        <div className="absolute top-0 left-0 z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-2xl dark:bg-gray-900 dark:border-gray-800">
          {/* Search Input */}
          <div className="relative border-b border-gray-200 dark:border-gray-800">
            <Search className="absolute w-4 h-4 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
            <Input
              ref={inputRef}
              type="text"
              placeholder="Search projects and tasks..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-10 border-0 focus-visible:ring-0"
              autoFocus
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute text-gray-400 transform -translate-y-1/2 right-3 top-1/2 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Recent Searches (when no query) */}
          {!query && recentSearches.length > 0 && (
            <div className="p-3 border-b border-gray-200 dark:border-gray-800">
              <h4 className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">
                Recent Searches
              </h4>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((term, i) => (
                  <button
                    key={i}
                    onClick={() => handleRecentClick(term)}
                    className="px-3 py-1 text-sm transition-colors bg-gray-100 rounded-full dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="p-8 text-center">
              <div className="inline-block w-6 h-6 border-2 rounded-full border-primary-600 border-t-transparent animate-spin"></div>
              <p className="mt-2 text-sm text-gray-500">Searching...</p>
            </div>
          )}

          {/* Results */}
          {!loading && query.length >= 2 && (
            <div className="p-2 overflow-y-auto max-h-96">
              {/* Projects */}
              {results.projects?.length > 0 && (
                <div className="mb-4">
                  <h4 className="px-3 py-2 text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                    Projects ({results.projects.length})
                  </h4>
                  {results.projects.map((project) => (
                    <button
                      key={project._id}
                      onClick={() => handleSelect('project', project._id)}
                      className="w-full px-3 py-2 text-left transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 group"
                    >
                      <div className="flex items-center gap-3">
                        <FolderKanban className="flex-shrink-0 w-4 h-4 text-primary-600 dark:text-primary-400" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate dark:text-white">
                            {project.name}
                          </p>
                          <p className="text-xs text-gray-500 truncate dark:text-gray-400">
                            {project.description}
                          </p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-400 transition-opacity opacity-0 group-hover:opacity-100" />
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Tasks */}
              {results.tasks?.length > 0 && (
                <div>
                  <h4 className="px-3 py-2 text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                    Tasks ({results.tasks.length})
                  </h4>
                  {results.tasks.map((task) => (
                    <button
                      key={task._id}
                      onClick={() => handleSelect('task', task._id)}
                      className="w-full px-3 py-2 text-left transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 group"
                    >
                      <div className="flex items-center gap-3">
                        <CheckSquare className="flex-shrink-0 w-4 h-4 text-green-600 dark:text-green-400" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-gray-900 truncate dark:text-white">
                              {task.title}
                            </p>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(task.priority)}`}>
                              {task.priority}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              In: {task.projectName}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              Due: {formatDate(task.dueDate)}
                            </span>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-400 transition-opacity opacity-0 group-hover:opacity-100" />
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* No Results */}
              {results.projects?.length === 0 && results.tasks?.length === 0 && (
                <div className="p-8 text-center">
                  <Search className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                  <p className="text-gray-500 dark:text-gray-400">No results found</p>
                  <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
                    Try different keywords
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Footer with keyboard shortcut hint */}
          <div className="flex items-center justify-between p-3 text-xs text-gray-500 border-t border-gray-200 dark:border-gray-800 dark:text-gray-400">
            <div className="flex items-center gap-4">
              <span><kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">↑</kbd> <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">↓</kbd> to navigate</span>
              <span><kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">Enter</kbd> to select</span>
            </div>
            <span><kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">Esc</kbd> to close</span>
          </div>
        </div>
      )}
    </div>
  );
}