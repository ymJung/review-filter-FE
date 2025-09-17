'use client';

import { Roadmap } from '@/types';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePermissions } from '@/hooks/usePermissions';

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
  // When true, hide content details and show blurred overlay CTA
  blurred?: boolean;
}

export function RoadmapCard({ 
  roadmap, 
  showActions = false,
  onEdit,
  onDelete,
  className = '',
  blurred = false,
}: RoadmapCardProps) {
  const router = useRouter();
  const { canCreateRoadmaps } = usePermissions();

  const formatDate = (date: Date) => {
    return formatDistanceToNow(date, { 
      addSuffix: true, 
      locale: ko 
    });
  };

  const handleViewDetails = () => {
    router.push(`/roadmaps/${roadmap.id}`);
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
              onClick={handleViewDetails}
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

        {showActions && !blurred && (
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
      {blurred ? (
        <div className="relative mb-4">
          {/* Placeholder blocks instead of real text */}
          <div className="space-y-2 select-none" aria-hidden>
            <div className="h-4 bg-gray-200 rounded w-11/12" />
            <div className="h-4 bg-gray-200 rounded w-10/12" />
          </div>
          {/* Overlay CTA */}
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center rounded">
            <div className="text-center px-4 py-3">
              <p className="text-gray-800 font-medium">나머지 로드맵은 제한된 접근입니다</p>
              <p className="text-gray-600 text-sm mb-3">로드맵을 작성하면 전체 열람이 가능해요</p>
              <div className="flex items-center justify-center gap-2">
                {canCreateRoadmaps ? (
                  <Link href="/write/roadmap">
                    <Button size="sm">로드맵 작성하기</Button>
                  </Link>
                ) : (
                  <Link href="/login">
                    <Button size="sm">로그인하기</Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-gray-700 mb-4 line-clamp-2">
          {roadmap.description}
        </p>
      )}

      {/* Course Information */}
      <div className={`space-y-3 ${blurred ? 'pointer-events-none select-none' : ''}`}>
        {/* Current Course */}
        {blurred ? (
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm font-medium text-blue-700">시작 강의</span>
            </div>
            <div className="ml-4 space-y-1" aria-hidden>
              <div className="h-4 bg-blue-100 rounded w-8/12" />
              <div className="h-3 bg-blue-100 rounded w-6/12" />
            </div>
          </div>
        ) : (
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
        )}

        {/* Next Course */}
        {roadmap.nextCourses && roadmap.nextCourses.length > 0 && (
          blurred ? (
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-green-700">다음 강의</span>
              </div>
              <div className="ml-4 space-y-1" aria-hidden>
                <div className="h-4 bg-green-100 rounded w-8/12" />
                <div className="h-3 bg-green-100 rounded w-6/12" />
              </div>
            </div>
          ) : (
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-green-700">다음 강의</span>
              </div>
              <div className="ml-4">
                <p className="font-medium text-gray-900">{roadmap.nextCourses[0].title}</p>
                <p className="text-sm text-gray-600">{roadmap.nextCourses[0].platform}</p>
              </div>
            </div>
          )
        )}
      </div>

      {/* Category */}
      {!blurred && roadmap.category && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <Badge variant="outline" className="text-xs">
            {roadmap.category}
          </Badge>
        </div>
      )}

      {/* View Details Link */}
      {!blurred && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full"
            onClick={handleViewDetails}
          >
            자세히 보기 →
          </Button>
        </div>
      )}
    </Card>
  );
}
