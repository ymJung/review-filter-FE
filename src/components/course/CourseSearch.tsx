'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Course } from '@/types';
import { searchCourses } from '@/lib/services/courseService';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Loading } from '@/components/ui/Loading';
import { debounce } from '@/lib/utils';

interface CourseSearchProps {
  onCourseSelect?: (course: Course) => void;
  onCourseCreate?: (courseData: { title: string; platform: string; instructor?: string; category?: string }) => void;
  placeholder?: string;
  showCreateOption?: boolean;
  filters?: {
    platform?: string;
    category?: string;
  };
  className?: string;
}

export const CourseSearch: React.FC<CourseSearchProps> = ({
  onCourseSelect,
  onCourseCreate,
  placeholder = '강의명을 검색하세요...',
  showCreateOption = true,
  filters,
  className = '',
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounced search function
  const debouncedSearch = debounce(async (searchQuery: string) => {
    if (searchQuery.trim().length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }

    setLoading(true);
    try {
      const courses = await searchCourses(searchQuery, {
        ...filters,
        limit: 10,
      });
      setResults(courses);
      setShowResults(true);
      setSelectedIndex(-1);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, 300);

  useEffect(() => {
    debouncedSearch(query);
  }, [query, filters]);

  // Handle click outside to close results
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showResults) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < results.length - 1 + (showCreateOption ? 1 : 0) ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > -1 ? prev - 1 : prev);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex === -1) return;
        
        if (selectedIndex < results.length) {
          handleCourseSelect(results[selectedIndex]);
        } else if (showCreateOption && onCourseCreate) {
          handleCreateCourse();
        }
        break;
      case 'Escape':
        setShowResults(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleCourseSelect = (course: Course) => {
    setQuery(course.title);
    setShowResults(false);
    setSelectedIndex(-1);
    onCourseSelect?.(course);
  };

  const handleCreateCourse = () => {
    if (!query.trim() || !onCourseCreate) return;
    
    const courseData = {
      title: query.trim(),
      platform: filters?.platform || '',
      category: filters?.category,
    };
    
    onCourseCreate(courseData);
    setShowResults(false);
    setSelectedIndex(-1);
  };

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      <Input
        ref={inputRef}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => query.length >= 2 && setShowResults(true)}
        placeholder={placeholder}
        className="w-full"
      />

      {/* Search Results Dropdown */}
      {showResults && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {loading && (
            <div className="p-4 text-center">
              <Loading size="sm" text="검색 중..." />
            </div>
          )}

          {!loading && results.length === 0 && query.trim().length >= 2 && (
            <div className="p-4 text-center text-gray-500">
              <div className="text-sm">검색 결과가 없습니다</div>
              {showCreateOption && onCourseCreate && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCreateCourse}
                  className="mt-2"
                >
                  "{query}" 강의 추가하기
                </Button>
              )}
            </div>
          )}

          {!loading && results.length > 0 && (
            <>
              {results.map((course, index) => (
                <div
                  key={course.id}
                  onClick={() => handleCourseSelect(course)}
                  className={`p-3 cursor-pointer border-b border-gray-100 last:border-b-0 hover:bg-gray-50 ${
                    selectedIndex === index ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">
                        {course.title}
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="outline" size="sm">
                          {course.platform}
                        </Badge>
                        {course.category && (
                          <Badge variant="secondary" size="sm">
                            {course.category}
                          </Badge>
                        )}
                        {course.instructor && (
                          <span className="text-xs text-gray-500">
                            {course.instructor}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-gray-400 ml-2">
                      조회 {course.viewCount}
                    </div>
                  </div>
                </div>
              ))}

              {showCreateOption && onCourseCreate && (
                <div
                  onClick={handleCreateCourse}
                  className={`p-3 cursor-pointer border-t border-gray-200 hover:bg-gray-50 ${
                    selectedIndex === results.length ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-center space-x-2 text-blue-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span className="text-sm font-medium">
                      "{query}" 강의 추가하기
                    </span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};