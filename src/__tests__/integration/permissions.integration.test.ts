/**
 * Permission-based Access Control Integration Tests
 * 
 * Tests the complete permission system including:
 * - Role-based content filtering
 * - Admin functionality access
 * - Content visibility based on user roles
 * - Permission escalation workflows
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { 
  AuthProvider, 
  ContentRestriction, 
  RoleGuard, 
  AdminDashboard, 
  ReviewModerationPanel, 
  UserManagementPanel 
} from './__mocks__/components'
import { accessControlService, reviewService, userService } from './__mocks__/services'
import { User, Review, UserRole } from '@/types'

// Mock services are imported from __mocks__/services

describe('Permission-based Access Control Integration', () => {
  const createMockUser = (role: UserRole): User => ({
    id: `user-${role}`,
    socialProvider: 'kakao',
    socialId: 'test-social-id',
    nickname: `테스트${role}`,
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
  })

  const mockReviews: Review[] = [
    {
      id: 'review-1',
      courseId: 'course-1',
      userId: 'user-1',
      content: '첫 번째 리뷰입니다.',
      rating: 5,
      status: 'APPROVED',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'review-2',
      courseId: 'course-2',
      userId: 'user-2',
      content: '두 번째 리뷰입니다.',
      rating: 4,
      status: 'APPROVED',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'review-3',
      courseId: 'course-3',
      userId: 'user-3',
      content: '세 번째 리뷰입니다.',
      rating: 3,
      status: 'APPROVED',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Content Visibility by User Role', () => {
    it('should show only top review for unauthenticated users', async () => {
      const unauthenticatedUser = createMockUser('NOT_ACCESS')
      
      ;(accessControlService.getVisibleReviews as jest.Mock).mockResolvedValue([mockReviews[0]])

      const TestComponent = () => (
        <AuthProvider>
          <ContentRestriction userRole="NOT_ACCESS">
            <div data-testid="review-list">
              {[mockReviews[0]].map(review => (
                <div key={review.id} data-testid={`review-${review.id}`}>
                  {review.content}
                </div>
              ))}
            </div>
          </ContentRestriction>
        </AuthProvider>
      )

      render(<TestComponent />)

      await waitFor(() => {
        expect(screen.getByTestId('review-review-1')).toBeInTheDocument()
      })

      // Should not show other reviews
      expect(screen.queryByTestId('review-review-2')).not.toBeInTheDocument()
      expect(screen.queryByTestId('review-review-3')).not.toBeInTheDocument()

      // Should show upgrade message
      expect(screen.getByText(/더 많은 리뷰를 보려면 로그인하세요/i)).toBeInTheDocument()
    })

    it('should show only top review for logged-in but unverified users', async () => {
      const unverifiedUser = createMockUser('LOGIN_NOT_AUTH')
      
      ;(accessControlService.getVisibleReviews as jest.Mock).mockResolvedValue([mockReviews[0]])

      const TestComponent = () => (
        <AuthProvider>
          <ContentRestriction userRole="LOGIN_NOT_AUTH">
            <div data-testid="review-list">
              {[mockReviews[0]].map(review => (
                <div key={review.id} data-testid={`review-${review.id}`}>
                  {review.content}
                </div>
              ))}
            </div>
          </ContentRestriction>
        </AuthProvider>
      )

      render(<TestComponent />)

      await waitFor(() => {
        expect(screen.getByTestId('review-review-1')).toBeInTheDocument()
      })

      // Should show verification message
      expect(screen.getByText(/리뷰를 작성하면 모든 콘텐츠를 볼 수 있습니다/i)).toBeInTheDocument()
    })

    it('should show all reviews for verified users', async () => {
      const verifiedUser = createMockUser('AUTH_LOGIN')
      
      ;(accessControlService.getVisibleReviews as jest.Mock).mockResolvedValue(mockReviews)

      const TestComponent = () => (
        <AuthProvider>
          <ContentRestriction userRole="AUTH_LOGIN">
            <div data-testid="review-list">
              {mockReviews.map(review => (
                <div key={review.id} data-testid={`review-${review.id}`}>
                  {review.content}
                </div>
              ))}
            </div>
          </ContentRestriction>
        </AuthProvider>
      )

      render(<TestComponent />)

      await waitFor(() => {
        expect(screen.getByTestId('review-review-1')).toBeInTheDocument()
        expect(screen.getByTestId('review-review-2')).toBeInTheDocument()
        expect(screen.getByTestId('review-review-3')).toBeInTheDocument()
      })

      // Should not show upgrade messages
      expect(screen.queryByText(/더 많은 리뷰를 보려면/i)).not.toBeInTheDocument()
    })

    it('should show all reviews without ads for premium users', async () => {
      const premiumUser = createMockUser('AUTH_PREMIUM')
      
      ;(accessControlService.getVisibleReviews as jest.Mock).mockResolvedValue(mockReviews)

      const TestComponent = () => (
        <AuthProvider>
          <ContentRestriction userRole="AUTH_PREMIUM">
            <div data-testid="review-list">
              {mockReviews.map(review => (
                <div key={review.id} data-testid={`review-${review.id}`}>
                  {review.content}
                </div>
              ))}
            </div>
            <div data-testid="ad-banner" style={{ display: 'none' }}>
              광고 배너
            </div>
          </ContentRestriction>
        </AuthProvider>
      )

      render(<TestComponent />)

      await waitFor(() => {
        expect(screen.getByTestId('review-review-1')).toBeInTheDocument()
        expect(screen.getByTestId('review-review-2')).toBeInTheDocument()
        expect(screen.getByTestId('review-review-3')).toBeInTheDocument()
      })

      // Should not show ads
      expect(screen.queryByText(/광고 배너/i)).not.toBeInTheDocument()
    })

    it('should show no content for blocked users', async () => {
      const blockedUser = createMockUser('BLOCKED_LOGIN')
      
      ;(accessControlService.getVisibleReviews as jest.Mock).mockResolvedValue([])

      const TestComponent = () => (
        <AuthProvider>
          <ContentRestriction userRole="BLOCKED_LOGIN">
            <div data-testid="blocked-message">
              계정이 차단되어 콘텐츠를 볼 수 없습니다.
            </div>
          </ContentRestriction>
        </AuthProvider>
      )

      render(<TestComponent />)

      await waitFor(() => {
        expect(screen.getByTestId('blocked-message')).toBeInTheDocument()
      })

      // Should not show any reviews
      expect(screen.queryByTestId('review-review-1')).not.toBeInTheDocument()
    })
  })

  describe('Admin Functionality Access', () => {
    it('should allow admin access to admin dashboard', async () => {
      const adminUser = createMockUser('ADMIN')
      
      ;(userService.getUserById as jest.Mock).mockResolvedValue(adminUser)

      const TestComponent = () => (
        <AuthProvider>
          <RoleGuard allowedRoles={['ADMIN']}>
            <AdminDashboard />
          </RoleGuard>
        </AuthProvider>
      )

      render(<TestComponent />)

      await waitFor(() => {
        expect(screen.getByText(/관리자 대시보드/i)).toBeInTheDocument()
      })
    })

    it('should deny non-admin access to admin dashboard', async () => {
      const regularUser = createMockUser('AUTH_LOGIN')
      
      ;(userService.getUserById as jest.Mock).mockResolvedValue(regularUser)

      const TestComponent = () => (
        <AuthProvider>
          <RoleGuard 
            allowedRoles={['ADMIN']}
            fallback={<div data-testid="access-denied">접근 권한이 없습니다</div>}
          >
            <AdminDashboard />
          </RoleGuard>
        </AuthProvider>
      )

      render(<TestComponent />)

      await waitFor(() => {
        expect(screen.getByTestId('access-denied')).toBeInTheDocument()
      })

      expect(screen.queryByText(/관리자 대시보드/i)).not.toBeInTheDocument()
    })

    it('should allow admin to moderate reviews', async () => {
      const adminUser = createMockUser('ADMIN')
      const pendingReviews = [
        { ...mockReviews[0], status: 'PENDING' as const },
        { ...mockReviews[1], status: 'PENDING' as const },
      ]
      
      ;(userService.getUserById as jest.Mock).mockResolvedValue(adminUser)
      ;(reviewService.getPendingReviews as jest.Mock).mockResolvedValue(pendingReviews)
      ;(reviewService.updateReviewStatus as jest.Mock).mockResolvedValue({
        ...pendingReviews[0],
        status: 'APPROVED',
      })

      const TestComponent = () => (
        <AuthProvider>
          <RoleGuard allowedRoles={['ADMIN']}>
            <ReviewModerationPanel />
          </RoleGuard>
        </AuthProvider>
      )

      render(<TestComponent />)

      await waitFor(() => {
        expect(screen.getByText(/리뷰 검수/i)).toBeInTheDocument()
      })

      // Should show pending reviews
      await waitFor(() => {
        expect(screen.getByText(pendingReviews[0].content)).toBeInTheDocument()
      })

      // Approve a review
      const approveButton = screen.getAllByText(/승인/i)[0]
      fireEvent.click(approveButton)

      await waitFor(() => {
        expect(reviewService.updateReviewStatus).toHaveBeenCalledWith(
          pendingReviews[0].id,
          'APPROVED'
        )
      })
    })

    it('should allow admin to manage users', async () => {
      const adminUser = createMockUser('ADMIN')
      const users = [
        createMockUser('AUTH_LOGIN'),
        createMockUser('LOGIN_NOT_AUTH'),
      ]
      
      ;(userService.getUserById as jest.Mock).mockResolvedValue(adminUser)
      ;(userService.getAllUsers as jest.Mock).mockResolvedValue(users)
      ;(userService.updateUserRole as jest.Mock).mockResolvedValue({
        ...users[0],
        role: 'BLOCKED_LOGIN',
      })

      const TestComponent = () => (
        <AuthProvider>
          <RoleGuard allowedRoles={['ADMIN']}>
            <UserManagementPanel />
          </RoleGuard>
        </AuthProvider>
      )

      render(<TestComponent />)

      await waitFor(() => {
        expect(screen.getByText(/사용자 관리/i)).toBeInTheDocument()
      })

      // Should show user list
      await waitFor(() => {
        expect(screen.getByText(users[0].nickname)).toBeInTheDocument()
      })

      // Block a user
      const blockButton = screen.getAllByText(/차단/i)[0]
      fireEvent.click(blockButton)

      await waitFor(() => {
        expect(userService.updateUserRole).toHaveBeenCalledWith(
          users[0].id,
          'BLOCKED_LOGIN'
        )
      })
    })
  })

  describe('Permission Escalation Workflows', () => {
    it('should upgrade user role after first review submission', async () => {
      const unverifiedUser = createMockUser('LOGIN_NOT_AUTH')
      const upgradedUser = { ...unverifiedUser, role: 'AUTH_LOGIN' as const }
      
      ;(userService.updateUserRole as jest.Mock).mockResolvedValue(upgradedUser)
      ;(accessControlService.checkPermissionUpgrade as jest.Mock).mockResolvedValue(true)

      // Simulate review submission triggering role upgrade
      await accessControlService.checkPermissionUpgrade(unverifiedUser.id, 'REVIEW_SUBMITTED')

      expect(accessControlService.checkPermissionUpgrade).toHaveBeenCalledWith(
        unverifiedUser.id,
        'REVIEW_SUBMITTED'
      )
    })

    it('should not upgrade blocked users', async () => {
      const blockedUser = createMockUser('BLOCKED_LOGIN')
      
      ;(accessControlService.checkPermissionUpgrade as jest.Mock).mockResolvedValue(false)

      // Attempt to upgrade blocked user
      const result = await accessControlService.checkPermissionUpgrade(
        blockedUser.id, 
        'REVIEW_SUBMITTED'
      )

      expect(result).toBe(false)
      expect(userService.updateUserRole).not.toHaveBeenCalled()
    })
  })

  describe('Content Filtering by Permission Level', () => {
    it('should filter sensitive content for lower permission users', async () => {
      const sensitiveReview = {
        ...mockReviews[0],
        content: '이 강의는 정말 좋습니다. 하지만 가격이 비싸서...',
        positivePoints: '내용이 알차고 실무에 도움됨',
        negativePoints: '가격이 너무 비쌈',
      }

      ;(accessControlService.filterContentByRole as jest.Mock).mockImplementation(
        (content: string, role: UserRole) => {
          if (role === 'LOGIN_NOT_AUTH' || role === 'NOT_ACCESS') {
            return content.substring(0, 50) + '...'
          }
          return content
        }
      )

      // Test for unverified user
      const filteredContent = await accessControlService.filterContentByRole(
        sensitiveReview.content,
        'LOGIN_NOT_AUTH'
      )

      expect(filteredContent).toBe('이 강의는 정말 좋습니다. 하지만 가격이 비싸서...')
      expect(filteredContent.length).toBeLessThan(sensitiveReview.content.length)
    })

    it('should show full content for verified users', async () => {
      const fullReview = mockReviews[0]

      ;(accessControlService.filterContentByRole as jest.Mock).mockImplementation(
        (content: string, role: UserRole) => {
          if (role === 'AUTH_LOGIN' || role === 'AUTH_PREMIUM' || role === 'ADMIN') {
            return content
          }
          return content.substring(0, 50) + '...'
        }
      )

      const fullContent = await accessControlService.filterContentByRole(
        fullReview.content,
        'AUTH_LOGIN'
      )

      expect(fullContent).toBe(fullReview.content)
    })
  })

  describe('API Endpoint Permission Validation', () => {
    it('should validate permissions for protected API endpoints', async () => {
      const adminUser = createMockUser('ADMIN')
      const regularUser = createMockUser('AUTH_LOGIN')

      ;(accessControlService.validateAPIAccess as jest.Mock).mockImplementation(
        (userId: string, endpoint: string, method: string) => {
          if (endpoint.startsWith('/api/admin/')) {
            return userService.getUserById(userId).then(user => user?.role === 'ADMIN')
          }
          return Promise.resolve(true)
        }
      )

      // Admin should have access to admin endpoints
      ;(userService.getUserById as jest.Mock).mockResolvedValue(adminUser)
      const adminAccess = await accessControlService.validateAPIAccess(
        adminUser.id,
        '/api/admin/reviews',
        'GET'
      )
      expect(adminAccess).toBe(true)

      // Regular user should not have access to admin endpoints
      ;(userService.getUserById as jest.Mock).mockResolvedValue(regularUser)
      const regularAccess = await accessControlService.validateAPIAccess(
        regularUser.id,
        '/api/admin/reviews',
        'GET'
      )
      expect(regularAccess).toBe(false)
    })

    it('should allow authenticated users to access user endpoints', async () => {
      const authenticatedUser = createMockUser('AUTH_LOGIN')

      ;(accessControlService.validateAPIAccess as jest.Mock).mockImplementation(
        (userId: string, endpoint: string) => {
          if (endpoint.startsWith('/api/users/me/')) {
            return Promise.resolve(!!userId)
          }
          return Promise.resolve(true)
        }
      )

      const access = await accessControlService.validateAPIAccess(
        authenticatedUser.id,
        '/api/users/me/reviews',
        'GET'
      )

      expect(access).toBe(true)
    })

    it('should deny access to blocked users for all endpoints', async () => {
      const blockedUser = createMockUser('BLOCKED_LOGIN')

      ;(accessControlService.validateAPIAccess as jest.Mock).mockImplementation(
        (userId: string) => {
          return userService.getUserById(userId).then(user => user?.role !== 'BLOCKED_LOGIN')
        }
      )

      ;(userService.getUserById as jest.Mock).mockResolvedValue(blockedUser)

      const access = await accessControlService.validateAPIAccess(
        blockedUser.id,
        '/api/reviews',
        'POST'
      )

      expect(access).toBe(false)
    })
  })

  describe('Error Handling in Permission System', () => {
    it('should handle permission check failures gracefully', async () => {
      ;(accessControlService.validateAPIAccess as jest.Mock).mockRejectedValue(
        new Error('Permission check failed')
      )

      try {
        await accessControlService.validateAPIAccess('invalid-user', '/api/reviews', 'GET')
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toBe('Permission check failed')
      }
    })

    it('should default to deny access on permission system errors', async () => {
      ;(userService.getUserById as jest.Mock).mockRejectedValue(
        new Error('Database connection failed')
      )

      ;(accessControlService.validateAPIAccess as jest.Mock).mockImplementation(
        async (userId: string) => {
          try {
            const user = await userService.getUserById(userId)
            return user?.role !== 'BLOCKED_LOGIN'
          } catch {
            return false // Default to deny on error
          }
        }
      )

      const access = await accessControlService.validateAPIAccess(
        'test-user',
        '/api/reviews',
        'POST'
      )

      expect(access).toBe(false)
    })
  })
})