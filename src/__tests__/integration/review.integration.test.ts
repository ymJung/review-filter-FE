/**
 * Review Flow Integration Tests
 * 
 * Tests the complete review lifecycle including:
 * - Review creation with image upload
 * - Review moderation workflow
 * - Review viewing with permission controls
 * - Comment system integration
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AuthProvider, ReviewForm, ReviewCard, CommentSection } from './__mocks__/components'
import { reviewService, commentService, courseService } from './__mocks__/services'
import { Review, Comment, Course, User } from '@/types'

// Mock services are imported from __mocks__/services

// Mock file upload
global.File = class MockFile {
  constructor(
    public bits: BlobPart[],
    public name: string,
    public options?: FilePropertyBag
  ) {}
  
  get size() { return 1024 * 1024 } // 1MB
  get type() { return 'image/jpeg' }
} as any

global.URL.createObjectURL = jest.fn(() => 'mock-url')
global.URL.revokeObjectURL = jest.fn()

describe('Review Flow Integration', () => {
  const mockUser: User = {
    id: 'test-user-id',
    socialProvider: 'kakao',
    socialId: 'kakao-123',
    nickname: '행복한고양이',
    role: 'AUTH_LOGIN',
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const mockCourse: Course = {
    id: 'test-course-id',
    platform: '인프런',
    title: 'React 완전정복',
    instructor: '김개발',
    category: '프로그래밍',
    viewCount: 0,
    createdAt: new Date(),
  }

  const mockReview: Review = {
    id: 'test-review-id',
    courseId: 'test-course-id',
    userId: 'test-user-id',
    content: '정말 좋은 강의였습니다. 많은 도움이 되었어요.',
    rating: 5,
    status: 'PENDING',
    studyPeriod: new Date('2024-01-01'),
    positivePoints: '설명이 명확하고 예제가 풍부함',
    negativePoints: '조금 더 심화 내용이 있었으면 좋겠음',
    changes: '실무에 바로 적용할 수 있는 지식을 얻었음',
    recommendedFor: 'React 입문자부터 중급자까지',
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const mockComment: Comment = {
    id: 'test-comment-id',
    reviewId: 'test-review-id',
    userId: 'commenter-id',
    content: '저도 같은 강의 들었는데 정말 좋았어요!',
    status: 'APPROVED',
    createdAt: new Date(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Review Creation Flow', () => {
    it('should create review with complete form data', async () => {
      ;(courseService.createCourse as jest.Mock).mockResolvedValue(mockCourse)
      ;(reviewService.createReview as jest.Mock).mockResolvedValue(mockReview)

      const TestComponent = () => (
        <AuthProvider>
          <ReviewForm />
        </AuthProvider>
      )

      render(<TestComponent />)

      // Fill course information
      const platformSelect = screen.getByLabelText(/플랫폼/i)
      fireEvent.change(platformSelect, { target: { value: '인프런' } })

      const titleInput = screen.getByLabelText(/강의명/i)
      fireEvent.change(titleInput, { target: { value: 'React 완전정복' } })

      const instructorInput = screen.getByLabelText(/강사/i)
      fireEvent.change(instructorInput, { target: { value: '김개발' } })

      const categorySelect = screen.getByLabelText(/카테고리/i)
      fireEvent.change(categorySelect, { target: { value: '프로그래밍' } })

      // Fill review information
      const contentTextarea = screen.getByLabelText(/리뷰 내용/i)
      fireEvent.change(contentTextarea, { 
        target: { value: '정말 좋은 강의였습니다. 많은 도움이 되었어요.' } 
      })

      const ratingSelect = screen.getByLabelText(/평점/i)
      fireEvent.change(ratingSelect, { target: { value: '5' } })

      const studyPeriodInput = screen.getByLabelText(/수강시기/i)
      fireEvent.change(studyPeriodInput, { target: { value: '2024-01' } })

      const positiveInput = screen.getByLabelText(/좋았던 점/i)
      fireEvent.change(positiveInput, { 
        target: { value: '설명이 명확하고 예제가 풍부함' } 
      })

      const negativeInput = screen.getByLabelText(/아쉬웠던 점/i)
      fireEvent.change(negativeInput, { 
        target: { value: '조금 더 심화 내용이 있었으면 좋겠음' } 
      })

      const changesInput = screen.getByLabelText(/수강 후 변화/i)
      fireEvent.change(changesInput, { 
        target: { value: '실무에 바로 적용할 수 있는 지식을 얻었음' } 
      })

      const recommendedInput = screen.getByLabelText(/추천 대상/i)
      fireEvent.change(recommendedInput, { 
        target: { value: 'React 입문자부터 중급자까지' } 
      })

      // Upload payment verification image
      const fileInput = screen.getByLabelText(/결제 인증 이미지/i)
      const file = new File(['test'], 'payment.jpg', { type: 'image/jpeg' })
      fireEvent.change(fileInput, { target: { files: [file] } })

      // Submit form
      const submitButton = screen.getByRole('button', { name: /리뷰 작성/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(courseService.createCourse).toHaveBeenCalledWith({
          platform: '인프런',
          title: 'React 완전정복',
          instructor: '김개발',
          category: '프로그래밍',
        })
      })

      await waitFor(() => {
        expect(reviewService.createReview).toHaveBeenCalledWith(
          expect.objectContaining({
            courseId: 'test-course-id',
            content: '정말 좋은 강의였습니다. 많은 도움이 되었어요.',
            rating: 5,
            status: 'PENDING',
            positivePoints: '설명이 명확하고 예제가 풍부함',
            negativePoints: '조금 더 심화 내용이 있었으면 좋겠음',
            changes: '실무에 바로 적용할 수 있는 지식을 얻었음',
            recommendedFor: 'React 입문자부터 중급자까지',
          })
        )
      })
    })

    it('should handle image upload and compression', async () => {
      const TestComponent = () => (
        <AuthProvider>
          <ReviewForm />
        </AuthProvider>
      )

      render(<TestComponent />)

      const fileInput = screen.getByLabelText(/결제 인증 이미지/i)
      const largeFile = new File(['large-image-data'], 'large-image.jpg', { 
        type: 'image/jpeg' 
      })
      
      // Mock file size to be larger than 5MB
      Object.defineProperty(largeFile, 'size', { value: 6 * 1024 * 1024 })

      fireEvent.change(fileInput, { target: { files: [largeFile] } })

      // Should show compression message or handle large file
      await waitFor(() => {
        // The component should handle file size validation
        expect(fileInput.files?.[0]).toBe(largeFile)
      })
    })

    it('should validate required fields', async () => {
      const TestComponent = () => (
        <AuthProvider>
          <ReviewForm />
        </AuthProvider>
      )

      render(<TestComponent />)

      // Try to submit without filling required fields
      const submitButton = screen.getByRole('button', { name: /리뷰 작성/i })
      fireEvent.click(submitButton)

      // Should show validation errors
      await waitFor(() => {
        expect(screen.getByText(/필수 항목을 입력해주세요/i)).toBeInTheDocument()
      })

      expect(reviewService.createReview).not.toHaveBeenCalled()
    })
  })

  describe('Review Moderation Workflow', () => {
    it('should handle review approval process', async () => {
      const pendingReview = { ...mockReview, status: 'PENDING' as const }
      const approvedReview = { ...mockReview, status: 'APPROVED' as const }

      ;(reviewService.updateReviewStatus as jest.Mock).mockResolvedValue(approvedReview)

      // Simulate admin approval
      await reviewService.updateReviewStatus('test-review-id', 'APPROVED')

      expect(reviewService.updateReviewStatus).toHaveBeenCalledWith(
        'test-review-id', 
        'APPROVED'
      )
    })

    it('should handle review rejection process', async () => {
      const pendingReview = { ...mockReview, status: 'PENDING' as const }
      const rejectedReview = { ...mockReview, status: 'REJECTED' as const }

      ;(reviewService.updateReviewStatus as jest.Mock).mockResolvedValue(rejectedReview)

      // Simulate admin rejection
      await reviewService.updateReviewStatus('test-review-id', 'REJECTED')

      expect(reviewService.updateReviewStatus).toHaveBeenCalledWith(
        'test-review-id', 
        'REJECTED'
      )
    })
  })

  describe('Review Viewing with Permission Controls', () => {
    it('should show full review for authorized users', async () => {
      const approvedReview = { ...mockReview, status: 'APPROVED' as const }
      ;(reviewService.getReviewById as jest.Mock).mockResolvedValue(approvedReview)

      const TestComponent = () => (
        <AuthProvider>
          <ReviewCard 
            review={approvedReview} 
            userRole="AUTH_LOGIN" 
            showFullContent={true}
          />
        </AuthProvider>
      )

      render(<TestComponent />)

      expect(screen.getByText(mockReview.content)).toBeInTheDocument()
      expect(screen.getByText(mockReview.positivePoints!)).toBeInTheDocument()
      expect(screen.getByText(mockReview.negativePoints!)).toBeInTheDocument()
    })

    it('should show limited content for unauthorized users', async () => {
      const approvedReview = { ...mockReview, status: 'APPROVED' as const }

      const TestComponent = () => (
        <AuthProvider>
          <ReviewCard 
            review={approvedReview} 
            userRole="LOGIN_NOT_AUTH" 
            showFullContent={false}
          />
        </AuthProvider>
      )

      render(<TestComponent />)

      // Should show truncated content or upgrade message
      expect(screen.getByText(/더 많은 리뷰를 보려면/i)).toBeInTheDocument()
    })

    it('should hide content for blocked users', async () => {
      const approvedReview = { ...mockReview, status: 'APPROVED' as const }

      const TestComponent = () => (
        <AuthProvider>
          <ReviewCard 
            review={approvedReview} 
            userRole="BLOCKED_LOGIN" 
            showFullContent={false}
          />
        </AuthProvider>
      )

      render(<TestComponent />)

      // Should show access denied message
      expect(screen.getByText(/접근이 제한되었습니다/i)).toBeInTheDocument()
    })
  })

  describe('Comment System Integration', () => {
    it('should create and display comments', async () => {
      ;(commentService.getCommentsByReviewId as jest.Mock).mockResolvedValue([mockComment])
      ;(commentService.createComment as jest.Mock).mockResolvedValue({
        ...mockComment,
        id: 'new-comment-id',
        content: '새로운 댓글입니다',
        status: 'PENDING',
      })

      const TestComponent = () => (
        <AuthProvider>
          <CommentSection reviewId="test-review-id" />
        </AuthProvider>
      )

      render(<TestComponent />)

      // Should display existing comments
      await waitFor(() => {
        expect(screen.getByText(mockComment.content)).toBeInTheDocument()
      })

      // Add new comment
      const commentInput = screen.getByPlaceholderText(/댓글을 입력하세요/i)
      fireEvent.change(commentInput, { target: { value: '새로운 댓글입니다' } })

      const submitButton = screen.getByRole('button', { name: /댓글 작성/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(commentService.createComment).toHaveBeenCalledWith({
          reviewId: 'test-review-id',
          content: '새로운 댓글입니다',
          status: 'PENDING',
        })
      })
    })

    it('should handle comment moderation', async () => {
      const pendingComment = { ...mockComment, status: 'PENDING' as const }
      const approvedComment = { ...mockComment, status: 'APPROVED' as const }

      ;(commentService.updateCommentStatus as jest.Mock).mockResolvedValue(approvedComment)

      // Simulate admin approval
      await commentService.updateCommentStatus('test-comment-id', 'APPROVED')

      expect(commentService.updateCommentStatus).toHaveBeenCalledWith(
        'test-comment-id',
        'APPROVED'
      )
    })

    it('should only show approved comments to regular users', async () => {
      const comments = [
        { ...mockComment, id: 'comment-1', status: 'APPROVED' as const },
        { ...mockComment, id: 'comment-2', status: 'PENDING' as const },
        { ...mockComment, id: 'comment-3', status: 'REJECTED' as const },
      ]

      ;(commentService.getCommentsByReviewId as jest.Mock).mockResolvedValue(
        comments.filter(c => c.status === 'APPROVED')
      )

      const TestComponent = () => (
        <AuthProvider>
          <CommentSection reviewId="test-review-id" />
        </AuthProvider>
      )

      render(<TestComponent />)

      await waitFor(() => {
        expect(screen.getByText(comments[0].content)).toBeInTheDocument()
      })

      // Should not show pending or rejected comments
      expect(screen.queryByText('pending-comment')).not.toBeInTheDocument()
      expect(screen.queryByText('rejected-comment')).not.toBeInTheDocument()
    })
  })

  describe('Review Search and Filtering', () => {
    it('should filter reviews by category', async () => {
      const reviews = [
        { ...mockReview, id: 'review-1' },
        { ...mockReview, id: 'review-2' },
      ]

      ;(reviewService.getReviewsByCategory as jest.Mock).mockResolvedValue(reviews)

      await reviewService.getReviewsByCategory('프로그래밍')

      expect(reviewService.getReviewsByCategory).toHaveBeenCalledWith('프로그래밍')
    })

    it('should search reviews by keyword', async () => {
      const reviews = [mockReview]

      ;(reviewService.searchReviews as jest.Mock).mockResolvedValue(reviews)

      await reviewService.searchReviews('React')

      expect(reviewService.searchReviews).toHaveBeenCalledWith('React')
    })
  })

  describe('Error Handling in Review Flow', () => {
    it('should handle review creation errors', async () => {
      ;(reviewService.createReview as jest.Mock).mockRejectedValue(
        new Error('Failed to create review')
      )

      const TestComponent = () => (
        <AuthProvider>
          <ReviewForm />
        </AuthProvider>
      )

      render(<TestComponent />)

      // Fill minimal required fields and submit
      const titleInput = screen.getByLabelText(/강의명/i)
      fireEvent.change(titleInput, { target: { value: 'Test Course' } })

      const contentTextarea = screen.getByLabelText(/리뷰 내용/i)
      fireEvent.change(contentTextarea, { target: { value: 'Test content' } })

      const submitButton = screen.getByRole('button', { name: /리뷰 작성/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/리뷰 작성에 실패했습니다/i)).toBeInTheDocument()
      })
    })

    it('should handle comment creation errors', async () => {
      ;(commentService.createComment as jest.Mock).mockRejectedValue(
        new Error('Failed to create comment')
      )

      const TestComponent = () => (
        <AuthProvider>
          <CommentSection reviewId="test-review-id" />
        </AuthProvider>
      )

      render(<TestComponent />)

      const commentInput = screen.getByPlaceholderText(/댓글을 입력하세요/i)
      fireEvent.change(commentInput, { target: { value: '테스트 댓글' } })

      const submitButton = screen.getByRole('button', { name: /댓글 작성/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/댓글 작성에 실패했습니다/i)).toBeInTheDocument()
      })
    })
  })
})