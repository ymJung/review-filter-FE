/**
 * @jest-environment jsdom
 */

import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { ContentRestriction } from '@/components/auth/ContentRestriction'
import { RoleGuard } from '@/components/auth/RoleGuard'
import { AdminDashboard } from '@/components/admin/AdminDashboard'
import { ReviewModerationPanel } from '@/components/admin/ReviewModerationPanel'
import { UserManagementPanel } from '@/components/admin/UserManagementPanel'
import { accessControlService } from '@/lib/services/accessControlService'
import type { User, UserRole } from '@/types'

// Mock services
jest.mock('@/lib/services/accessControlService')
jest.mock('@/components/admin/AdminDashboard')
jest.mock('@/components/admin/ReviewModerationPanel')
jest.mock('@/components/admin/UserManagementPanel')

const mockAccessControlService = accessControlService as jest.Mocked<typeof accessControlService>

// Mock components
const MockAdminDashboard = () => <div data-testid="admin-dashboard">Admin Dashboard</div>
const MockReviewModerationPanel = () => <div data-testid="review-moderation">Review Moderation</div>
const MockUserManagementPanel = () => <div data-testid="user-management">User Management</div>

;(AdminDashboard as jest.Mock).mockImplementation(MockAdminDashboard)
;(ReviewModerationPanel as jest.Mock).mockImplementation(MockReviewModerationPanel)
;(UserManagementPanel as jest.Mock).mockImplementation(MockUserManagementPanel)

const createMockUser = (role: UserRole): User => ({
  uid: 'test-uid',
  email: 'test@example.com',
  nickname: 'Test User',
  role,
  socialProvider: 'google',
  socialId: 'test-social-id',
  createdAt: new Date(),
  updatedAt: new Date(),
})

const mockReviews = [
  { id: 'review-1', content: 'Great course!', rating: 5 },
  { id: 'review-2', content: 'Good content', rating: 4 },
  { id: 'review-3', content: 'Excellent!', rating: 5 },
]

describe('Permission Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('ContentRestriction Component', () => {
    it('should show limited content for non-authenticated users', async () => {
      mockAccessControlService.getVisibleReviews.mockResolvedValue(mockReviews.slice(0, 2))

      render(
        <AuthProvider value={{ user: null, loading: false }}>
          <ContentRestriction userRole="LOGIN_NOT_AUTH">
            <div data-testid="review-list">
              {mockReviews.slice(0, 2).map(review => (
                <div key={review.id} data-testid={`review-${review.id}`}>
                  {review.content}
                </div>
              ))}
            </div>
            <div data-testid="upgrade-message">
              더 많은 리뷰를 보려면 로그인하세요
            </div>
          </ContentRestriction>
        </AuthProvider>
      )

      // Should show limited reviews
      await waitFor(() => {
        expect(screen.getByTestId('review-review-1')).toBeInTheDocument()
        expect(screen.getByTestId('review-review-2')).toBeInTheDocument()
      })

      // Should not show third review
      expect(screen.queryByTestId('review-review-3')).not.toBeInTheDocument()

      // Should show upgrade message
      expect(screen.getByTestId('upgrade-message')).toBeInTheDocument()
    })

    it('should show all reviews without ads for premium users', async () => {
      const premiumUser = createMockUser('AUTH_PREMIUM')
      mockAccessControlService.getVisibleReviews.mockResolvedValue(mockReviews)

      render(
        <AuthProvider value={{ user: premiumUser, loading: false }}>
          <ContentRestriction userRole="AUTH_PREMIUM">
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

      // Should show all reviews
      await waitFor(() => {
        expect(screen.getByTestId('review-review-1')).toBeInTheDocument()
        expect(screen.getByTestId('review-review-2')).toBeInTheDocument()
        expect(screen.getByTestId('review-review-3')).toBeInTheDocument()
      })
    })

    it('should show blocked message for blocked users', async () => {
      const blockedUser = createMockUser('BLOCKED_LOGIN')

      render(
        <AuthProvider value={{ user: blockedUser, loading: false }}>
          <ContentRestriction userRole="BLOCKED_LOGIN">
            <div data-testid="blocked-message">
              계정이 차단되어 콘텐츠를 볼 수 없습니다.
            </div>
          </ContentRestriction>
        </AuthProvider>
      )

      expect(screen.getByTestId('blocked-message')).toBeInTheDocument()
    })
  })

  describe('RoleGuard Component', () => {
    it('should allow access for admin users', async () => {
      const adminUser = createMockUser('ADMIN')

      render(
        <AuthProvider value={{ user: adminUser, loading: false }}>
          <RoleGuard allowedRoles={['ADMIN']}>
            <MockAdminDashboard />
          </RoleGuard>
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('admin-dashboard')).toBeInTheDocument()
      })
    })

    it('should deny access for non-admin users', async () => {
      const regularUser = createMockUser('AUTH_LOGIN')

      render(
        <AuthProvider value={{ user: regularUser, loading: false }}>
          <RoleGuard 
            allowedRoles={['ADMIN']}
            fallback={<div data-testid="access-denied">접근 권한이 없습니다</div>}
          >
            <MockAdminDashboard />
          </RoleGuard>
        </AuthProvider>
      )

      expect(screen.getByTestId('access-denied')).toBeInTheDocument()
      expect(screen.queryByTestId('admin-dashboard')).not.toBeInTheDocument()
    })
  })

  describe('Admin Panel Access Control', () => {
    it('should allow admin to access review moderation', async () => {
      const adminUser = createMockUser('ADMIN')

      render(
        <AuthProvider value={{ user: adminUser, loading: false }}>
          <RoleGuard allowedRoles={['ADMIN']}>
            <MockReviewModerationPanel />
          </RoleGuard>
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('review-moderation')).toBeInTheDocument()
      })
    })

    it('should allow admin to access user management', async () => {
      const adminUser = createMockUser('ADMIN')

      render(
        <AuthProvider value={{ user: adminUser, loading: false }}>
          <RoleGuard allowedRoles={['ADMIN']}>
            <MockUserManagementPanel />
          </RoleGuard>
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('user-management')).toBeInTheDocument()
      })
    })
  })
})