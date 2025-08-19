'use client';

import React from 'react';
import { Course } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatDate, formatNumber } from '@/lib/utils';
import Link from 'next/link';

interface CourseCardProps {
  course: Course;
  showActions?: boolean;
  onViewDetails?: (course: Course) => void;
  onWriteReview?: (course: Course) => void;
  className?: string;
}

export const CourseCard: React.FC<CourseCardProps> = ({
  course,
  showActions = true,
  onViewDetails,
  onWriteReview,
  className = '',
}) => {
  const handleViewDetails = () => {
    onViewDetails?.(course);
  };

  const handleWriteReview = () => {
    onWriteReview?.(course);
  };

  return (
    <Card className={`h-full ${className}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg leading-tight mb-2">
              {course.title}
            </CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" size="sm">
                {course.platform}
              </Badge>
              {course.category && (
                <Badge variant="secondary" size="sm">
                  {course.category}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col">
        {/* Course Info */}
        <div className="space-y-2 mb-4">
          {course.instructor && (
            <div className="flex items-center text-sm text-gray-600">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              {course.instructor}
            </div>
          )}
          
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              조회 {formatNumber(course.viewCount)}
            </div>
            <div>
              {formatDate(course.createdAt)}
            </div>
          </div>
        </div>

        {/* Actions */}
        {showActions && (
          <div className="mt-auto pt-4 border-t border-gray-200">
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleViewDetails}
                className="flex-1"
              >
                상세보기
              </Button>
              <Button
                size="sm"
                onClick={handleWriteReview}
                className="flex-1"
              >
                리뷰 작성
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

interface CourseListProps {
  courses: Course[];
  loading?: boolean;
  showActions?: boolean;
  onViewDetails?: (course: Course) => void;
  onWriteReview?: (course: Course) => void;
  emptyMessage?: string;
  className?: string;
}

export const CourseList: React.FC<CourseListProps> = ({
  courses,
  loading = false,
  showActions = true,
  onViewDetails,
  onWriteReview,
  emptyMessage = '강의가 없습니다.',
  className = '',
}) => {
  if (loading) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
        {[...Array(6)].map((_, index) => (
          <Card key={index} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-gray-200 rounded mb-2"></div>
              <div className="flex space-x-2">
                <div className="h-5 w-16 bg-gray-200 rounded"></div>
                <div className="h-5 w-20 bg-gray-200 rounded"></div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="text-gray-500">
          <div className="text-4xl mb-4">📚</div>
          <p className="text-lg font-medium">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
      {courses.map((course) => (
        <CourseCard
          key={course.id}
          course={course}
          showActions={showActions}
          onViewDetails={onViewDetails}
          onWriteReview={onWriteReview}
        />
      ))}
    </div>
  );
};