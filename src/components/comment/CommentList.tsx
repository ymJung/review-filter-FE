'use client';

import { Comment } from '@/types';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

interface CommentListProps {
  comments: Comment[];
  currentUserId?: string;
  onDelete?: (commentId: string) => void;
  className?: string;
}

export function CommentList({ 
  comments, 
  currentUserId, 
  onDelete,
  className = '' 
}: CommentListProps) {
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

  if (comments.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {comments.map((comment) => {
        const isOwner = currentUserId === comment.userId;
        const showContent = comment.status === 'APPROVED' || isOwner;

        return (
          <div
            key={comment.id}
            className="border rounded-lg p-4 bg-white shadow-sm"
          >
            {/* Comment Header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className="font-medium text-gray-900">
                  익명 사용자
                </span>
                <span className="text-sm text-gray-500">
                  {formatDate(comment.createdAt)}
                </span>
                {isOwner && getStatusBadge(comment.status)}
              </div>
              
              {isOwner && onDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(comment.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  삭제
                </Button>
              )}
            </div>

            {/* Comment Content */}
            <div className="text-gray-700">
              {showContent ? (
                <p className="whitespace-pre-wrap">{comment.content}</p>
              ) : (
                <p className="text-gray-500 italic">
                  {comment.status === 'PENDING' 
                    ? '검수 중인 댓글입니다.' 
                    : '삭제된 댓글입니다.'
                  }
                </p>
              )}
            </div>

            {/* Updated indicator */}
            {comment.updatedAt && 
             comment.updatedAt.getTime() !== comment.createdAt.getTime() && (
              <div className="mt-2 text-xs text-gray-400">
                수정됨 · {formatDate(comment.updatedAt)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}