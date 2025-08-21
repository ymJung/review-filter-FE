'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';

interface CommentFormProps {
  onSubmit: (content: string) => void;
  onCancel: () => void;
  submitting?: boolean;
  className?: string;
}

export function CommentForm({ 
  onSubmit, 
  onCancel, 
  submitting = false,
  className = '' 
}: CommentFormProps) {
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedContent = content.trim();
    
    // Validation
    if (!trimmedContent) {
      setError('댓글 내용을 입력해주세요.');
      return;
    }
    
    if (trimmedContent.length < 2) {
      setError('댓글은 최소 2자 이상 입력해주세요.');
      return;
    }
    
    if (trimmedContent.length > 500) {
      setError('댓글은 최대 500자까지 입력 가능합니다.');
      return;
    }

    setError(null);
    onSubmit(trimmedContent);
  };

  const handleCancel = () => {
    setContent('');
    setError(null);
    onCancel();
  };

  return (
    <form onSubmit={handleSubmit} className={`space-y-4 ${className}`}>
      <div className="border rounded-lg p-4 bg-gray-50">
        <div className="space-y-3">
          <Textarea
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              if (error) setError(null);
            }}
            placeholder="댓글을 입력해주세요..."
            rows={3}
            maxLength={500}
            disabled={submitting}
            className="resize-none"
          />
          
          {/* Character count */}
          <div className="flex justify-between items-center text-sm">
            <div>
              {error && (
                <span className="text-red-600">{error}</span>
              )}
            </div>
            <span className={`${
              content.length > 450 ? 'text-red-600' : 'text-gray-500'
            }`}>
              {content.length}/500
            </span>
          </div>
          
          {/* Action buttons */}
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              disabled={submitting}
            >
              취소
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={submitting || !content.trim()}
            >
              {submitting ? '등록 중...' : '댓글 등록'}
            </Button>
          </div>
        </div>
      </div>
      
      {/* Guidelines */}
      <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded">
        <p className="font-medium mb-1">댓글 작성 안내</p>
        <ul className="space-y-1">
          <li>• 욕설, 비방, 광고성 댓글은 삭제될 수 있습니다.</li>
          <li>• 작성된 댓글은 검수 후 공개됩니다.</li>
          <li>• 건전한 토론 문화를 만들어주세요.</li>
        </ul>
      </div>
    </form>
  );
}