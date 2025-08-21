'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { CommentService } from '@/lib/services/commentService';
import { Comment } from '@/types';
import { CommentList } from './CommentList';
import { CommentForm } from './CommentForm';
import { Button } from '@/components/ui/Button';
import { Loading } from '@/components/ui/Loading';
import { Alert } from '@/components/ui/Alert';

interface CommentSectionProps {
  reviewId: string;
  className?: string;
}

export function CommentSection({ reviewId, className = '' }: CommentSectionProps) {
  const { user, firebaseUser } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Fetch comments
  const fetchComments = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedComments = await CommentService.getComments(reviewId);
      setComments(fetchedComments);
    } catch (error) {
      console.error('Error fetching comments:', error);
      setError('댓글을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [reviewId]);

  // Handle comment submission
  const handleCommentSubmit = async (content: string) => {
    if (!user || !firebaseUser) {
      setError('로그인이 필요합니다.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      
      const token = await firebaseUser.getIdToken();
      const newComment = await CommentService.createComment(reviewId, content, token);
      
      // Add the new comment to the list (it will be in PENDING status)
      setComments(prev => [newComment, ...prev]);
      setShowCommentForm(false);
      
      // Show success message
      alert('댓글이 등록되었습니다. 검수 후 공개됩니다.');
    } catch (error) {
      console.error('Error creating comment:', error);
      setError('댓글 등록에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle comment deletion
  const handleCommentDelete = async (commentId: string) => {
    if (!user || !firebaseUser) {
      setError('로그인이 필요합니다.');
      return;
    }

    if (!confirm('댓글을 삭제하시겠습니까?')) {
      return;
    }

    try {
      const token = await firebaseUser.getIdToken();
      await CommentService.deleteComment(commentId, token);
      setComments(prev => prev.filter(comment => comment.id !== commentId));
    } catch (error) {
      console.error('Error deleting comment:', error);
      setError('댓글 삭제에 실패했습니다.');
    }
  };

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">댓글</h3>
        </div>
        <Loading />
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          댓글 {comments.length > 0 && `(${comments.length})`}
        </h3>
        
        {user && !showCommentForm && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCommentForm(true)}
          >
            댓글 작성
          </Button>
        )}
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="danger">
          {error}
        </Alert>
      )}

      {/* Comment Form */}
      {showCommentForm && (
        <CommentForm
          onSubmit={handleCommentSubmit}
          onCancel={() => setShowCommentForm(false)}
          submitting={submitting}
        />
      )}

      {/* Comments List */}
      {comments.length > 0 ? (
        <CommentList
          comments={comments}
          currentUserId={user?.id}
          onDelete={handleCommentDelete}
        />
      ) : (
        <div className="text-center py-8 text-gray-500">
          <p>아직 댓글이 없습니다.</p>
          {user && !showCommentForm && (
            <Button
              variant="ghost"
              className="mt-2"
              onClick={() => setShowCommentForm(true)}
            >
              첫 댓글을 작성해보세요
            </Button>
          )}
        </div>
      )}
    </div>
  );
}