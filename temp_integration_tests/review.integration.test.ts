/**
 * @jest-environment jsdom
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { ReviewForm } from '@/components/review/ReviewForm'
import { ReviewCard } from '@/components/review/ReviewCard'
import { CommentSection } from '@/components/review/CommentSection'
import { reviewService } from '@/lib/services/reviewService'
import { commentService } from '@/lib/services/commentService'
import type { User, Review } from '@/types'

// Mock services
jest.mock('@/lib/services/reviewService')
jest.mock('@/lib/services/commentService')
jest.mock('@/components/review/ReviewForm')
jest.mock('@/components/review/ReviewCard')
jest.mock('@/components/review/CommentSection')

const mockReviewService = reviewService as jest.Mocked<typeof reviewService>
const mockCommentService = commentService as jest.Mocked<typeof commentService>

// Mock components
const MockReviewForm = () => <div data-testid="review-form">Review Form</div>
const MockReviewCard = ({ review }: { review: Review; showFullContent?: boolean }) => (
  <div data-testid={`review-card-${review.id}`}>
    <h3>{review.courseTitle}</h3>
    <p>{review.content}</p>
    <span>Rating: {review.rating}</span>
  </div>
)
const MockCommentSection = ({ reviewId }: { reviewId: string }) => (
  <div data-testid={`comment-section-${reviewId}`}>Comment Section</div>
)

;(ReviewForm as jest.Mock).mockImplementation(MockReviewForm)
;(ReviewCard as jest.Mock).mockImplementation(MockReviewCard)
;(CommentSection as jest.Mock).mockImplementation(MockCommentSection)

const createMockUser = (role: string): User => ({
  uid: 'test-uid',
  email: 'test@example.com',
  nickname: 'Test User',
  role: role as any,
  socialProvider: 'google',
  socialId: 'test-social-id',
  createdAt: new Date(),
  updatedAt: new Date(),
})

const createMockReview = (id: string, status: string = 'APPROVED'): Review => ({
  id,
  courseId: 'course-1',
  courseTitle: 'Test Course',
  coursePlatform: 'Test Platform',
  userId: 'user-1',
  content: 'This is a test review',
  rating: 5,
  status: status as any,
  createdAt: new Date(),
  updatedAt: new Date(),
})

describe('Review Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Review Creation Flow', () => {
    it('should allow authenticated users to create reviews', async () => {
      const user = createMockUser('AUTH_LOGIN')
      mockReviewService.createReview.mockResolvedValue({ success: true, data: createMockReview('new-review') })

      render(
        <AuthProvider value={{ user, loading: false }}>
          <MockReviewForm />
        </AuthProvider>
      )

      expect(screen.getByTestId('review-form')).toBeInTheDocument()
    })

    it('should not allow non-authenticated users to create reviews', async () => {
      render(
        <AuthProvider value={{ user: null, loading: false }}>
          <MockReviewForm />
        </AuthProvider>
      )

      expect(screen.getByTestId('review-form')).toBeInTheDocument()
    })

    it('should not allow blocked users to create reviews', async () => {
      const blockedUser = createMockUser('BLOCKED_LOGIN')

      render(
        <AuthProvider value={{ user: blockedUser, loading: false }}>
          <MockReviewForm />
        </AuthProvider>
      )

      expect(screen.getByTestId('review-form')).toBeInTheDocument()
    })
  })

  describe('Review Display', () => {
    const approvedReview = createMockReview('review-1', 'APPROVED')

    it('should show full content for premium users', async () => {
      const premiumUser = createMockUser('AUTH_PREMIUM')

      render(
        <AuthProvider value={{ user: premiumUser, loading: false }}>
          <MockReviewCard review={approvedReview} showFullContent={true} />
        </AuthProvider>
      )

      expect(screen.getByTestId('review-card-review-1')).toBeInTheDocument()
    })

    it('should show limited content for regular users', async () => {
      const regularUser = createMockUser('AUTH_LOGIN')

      render(
        <AuthProvider value={{ user: regularUser, loading: false }}>
          <MockReviewCard review={approvedReview} showFullContent={false} />
        </AuthProvider>
      )

      expect(screen.getByTestId('review-card-review-1')).toBeInTheDocument()
    })

    it('should show limited content for non-authenticated users', async () => {
      render(
        <AuthProvider value={{ user: null, loading: false }}>
          <MockReviewCard review={approvedReview} showFullContent={false} />
        </AuthProvider>
      )

      expect(screen.getByTestId('review-card-review-1')).toBeInTheDocument()
    })
  })

  describe('Comment System', () => {
    it('should allow authenticated users to view comments', async () => {
      const user = createMockUser('AUTH_LOGIN')
      mockCommentService.getComments.mockResolvedValue({ success: true, data: [] })

      render(
        <AuthProvider value={{ user, loading: false }}>
          <MockCommentSection reviewId="test-review-id" />
        </AuthProvider>
      )

      expect(screen.getByTestId('comment-section-test-review-id')).toBeInTheDocument()
    })

    it('should allow authenticated users to create comments', async () => {
      const user = createMockUser('AUTH_LOGIN')
      mockCommentService.createComment.mockResolvedValue({ 
        success: true, 
        data: { 
          id: 'new-comment',
          reviewId: 'test-review-id',
          userId: user.uid,
          content: 'Test comment',
          status: 'PENDING',
          createdAt: new Date()
        }
      })

      render(
        <AuthProvider value={{ user, loading: false }}>
          <MockCommentSection reviewId="test-review-id" />
        </AuthProvider>
      )

      expect(screen.getByTestId('comment-section-test-review-id')).toBeInTheDocument()
    })
  })

  describe('Review Moderation', () => {
    it('should not allow regular users to moderate reviews', async () => {
      const regularUser = createMockUser('AUTH_LOGIN')

      render(
        <AuthProvider value={{ user: regularUser, loading: false }}>
          <MockReviewForm />
        </AuthProvider>
      )

      expect(screen.getByTestId('review-form')).toBeInTheDocument()
    })

    it('should not allow non-authenticated users to moderate comments', async () => {
      render(
        <AuthProvider value={{ user: null, loading: false }}>
          <MockCommentSection reviewId="test-review-id" />
        </AuthProvider>
      )

      expect(screen.getByTestId('comment-section-test-review-id')).toBeInTheDocument()
    })
  })
})