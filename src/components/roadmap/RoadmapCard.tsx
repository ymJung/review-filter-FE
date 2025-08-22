'use client';

import { Roadmap } from '@/types';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import Link from 'next/link';

interface RoadmapCardProps {
  roadmap: Roadmap & {
    author?: {
      id: string;
      nickname: string;
    };
  };
  showActions?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  className?: string;
}

export function RoadmapCard({ 
  roadmap, 
  showActions = false,
  onEdit,
  onDelete,
  className = '' 
}: RoadmapCardProps) {
  const formatDate = (date: Date) => {
    return formatDistanceToNow(date, { 
      addSuffix: true, 
      locale: ko 
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <Badge variant="success">승인됨</Badge>;
      case 'PENDING':
        return <Badge variant="warning">검수중</Badge>;
      case 'REJECTED':
        return <Badge variant="danger">거부됨</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card className={`p-6 hover:shadow-lg transition-shadow ${className}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 
              className="text-lg font-semibold text-gray-900 hover:text-blue-600 cursor-pointer"
              onClick={() => alert(`로드맵 상세 페이지 (ID: ${roadmap.id})\n\nTask 11.3에서 구현될 예정입니다.`)}
            >
              {roadmap.title}
            </h3>
            {getStatusBadge(roadmap.status)}
          </div>
          
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span>
              {roadmap.author?.nickname || '익명 사용자'}
            </span>
            <span>
              {formatDate(roadmap.createdAt)}
            </span>
            <span>
              조회 {roadmap.viewCount}
            </span>
          </div>
        </div>

        {showActions && (
          <div className="flex gap-2 ml-4">
            {onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={onEdit}
              >
                수정
              </Button>
            )}
            {onDelete && (
              <Button
                variant="outline"
                size="sm"
                onClick={onDelete}
                className="text-red-600 hover:text-red-700 hover:border-red-300"
              >
                삭제
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Description */}
      <p className="text-gray-700 mb-4 line-clamp-2">
        {roadmap.description}
      </p>

      {/* Course Information */}
      <div className="space-y-3">
        {/* Current Course */}
        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-sm font-medium text-blue-700">시작 강의</span>
          </div>
          <div className="ml-4">
            <p className="font-medium text-gray-900">{roadmap.courseTitle}</p>
            <p className="text-sm text-gray-600">{roadmap.coursePlatform}</p>
          </div>
        </div>

        {/* Next Course */}
        {roadmap.nextCourseTitle && (
          <div className="bg-green-50 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium text-green-700">다음 강의</span>
            </div>
            <div className="ml-4">
              <p className="font-medium text-gray-900">{roadmap.nextCourseTitle}</p>
              <p className="text-sm text-gray-600">{roadmap.nextCoursePlatform}</p>
            </div>
          </div>
        )}
      </div>

      {/* Category */}
      {roadmap.category && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <Badge variant="outline" className="text-xs">
            {roadmap.category}
          </Badge>
        </div>
      )}

      {/* View Details Link */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-full"
          onClick={() => alert(`로드맵 상세 페이지 (ID: ${roadmap.id})\n\nTask 11.3에서 구현될 예정입니다.`)}
        >
          자세히 보기 →
        </Button>
      </div>
    </Card>
  );
}