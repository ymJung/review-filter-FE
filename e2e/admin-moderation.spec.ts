/**
 * E2E Tests for Admin Moderation Flow
 * 
 * Tests the complete admin moderation workflow:
 * - Admin dashboard access
 * - Review moderation (approve/reject)
 * - User management
 * - System statistics
 */

import { test, expect } from '@playwright/test'

test.describe('Admin Moderation Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Set up admin user state
    await page.goto('/')
    await page.evaluate(() => {
      localStorage.setItem('mockAuth', JSON.stringify({
        user: {
          id: 'admin-user-id',
          nickname: '관리자',
          role: 'ADMIN'
        },
        isAuthenticated: true
      }))
    })
    await page.reload()
  })

  test('should access admin dashboard', async ({ page }) => {
    // Should show admin navigation
    await expect(page.locator('text=관리자')).toBeVisible()
    
    // Navigate to admin dashboard
    await page.click('text=관리자')
    await expect(page).toHaveURL(/\/admin/)
    
    // Should show admin dashboard content
    await expect(page.locator('text=관리자 대시보드')).toBeVisible()
    await expect(page.locator('text=리뷰 검수')).toBeVisible()
    await expect(page.locator('text=사용자 관리')).toBeVisible()
    await expect(page.locator('text=통계')).toBeVisible()
  })

  test('should deny access to non-admin users', async ({ page }) => {
    // Set regular user state
    await page.evaluate(() => {
      localStorage.setItem('mockAuth', JSON.stringify({
        user: {
          id: 'regular-user-id',
          nickname: '일반사용자',
          role: 'AUTH_LOGIN'
        },
        isAuthenticated: true
      }))
    })
    await page.reload()
    
    // Should not show admin navigation
    await expect(page.locator('text=관리자')).not.toBeVisible()
    
    // Direct access to admin page should be denied
    await page.goto('/admin')
    await expect(page.locator('text=접근 권한이 없습니다')).toBeVisible()
  })

  test('should moderate pending reviews', async ({ page }) => {
    // Navigate to admin dashboard
    await page.click('text=관리자')
    await page.click('text=리뷰 검수')
    
    // Mock pending reviews
    await page.route('**/api/admin/reviews/pending', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          reviews: [
            {
              id: 'pending-review-1',
              title: '검수 대기 중인 리뷰 1',
              content: '이 리뷰는 검수를 기다리고 있습니다.',
              rating: 5,
              status: 'PENDING',
              author: '사용자1',
              createdAt: new Date().toISOString()
            },
            {
              id: 'pending-review-2',
              title: '검수 대기 중인 리뷰 2',
              content: '또 다른 검수 대기 리뷰입니다.',
              rating: 4,
              status: 'PENDING',
              author: '사용자2',
              createdAt: new Date().toISOString()
            }
          ]
        })
      })
    })
    
    await page.reload()
    
    // Should show pending reviews
    await expect(page.locator('text=검수 대기 중인 리뷰 1')).toBeVisible()
    await expect(page.locator('text=검수 대기 중인 리뷰 2')).toBeVisible()
    
    // Should show moderation buttons
    await expect(page.locator('button:has-text("승인")')).toBeVisible()
    await expect(page.locator('button:has-text("거부")')).toBeVisible()
  })

  test('should approve a review', async ({ page }) => {
    // Navigate to review moderation
    await page.click('text=관리자')
    await page.click('text=리뷰 검수')
    
    // Mock pending review
    await page.route('**/api/admin/reviews/pending', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          reviews: [{
            id: 'review-to-approve',
            title: '승인할 리뷰',
            content: '좋은 리뷰 내용입니다.',
            rating: 5,
            status: 'PENDING',
            author: '테스트사용자'
          }]
        })
      })
    })
    
    // Mock approval API
    await page.route('**/api/admin/reviews/*/approve', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true })
      })
    })
    
    await page.reload()
    
    // Click approve button
    await page.click('button:has-text("승인")')
    
    // Should show confirmation dialog
    await expect(page.locator('text=리뷰를 승인하시겠습니까?')).toBeVisible()
    await page.click('text=확인')
    
    // Should show success message
    await expect(page.locator('text=리뷰가 승인되었습니다')).toBeVisible()
  })

  test('should reject a review', async ({ page }) => {
    // Navigate to review moderation
    await page.click('text=관리자')
    await page.click('text=리뷰 검수')
    
    // Mock pending review
    await page.route('**/api/admin/reviews/pending', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          reviews: [{
            id: 'review-to-reject',
            title: '거부할 리뷰',
            content: '부적절한 내용이 포함된 리뷰입니다.',
            rating: 1,
            status: 'PENDING',
            author: '문제사용자'
          }]
        })
      })
    })
    
    // Mock rejection API
    await page.route('**/api/admin/reviews/*/reject', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true })
      })
    })
    
    await page.reload()
    
    // Click reject button
    await page.click('button:has-text("거부")')
    
    // Should show confirmation dialog with reason input
    await expect(page.locator('text=리뷰를 거부하시겠습니까?')).toBeVisible()
    await page.fill('textarea[placeholder*="거부 사유"]', '부적절한 내용 포함')
    await page.click('text=확인')
    
    // Should show success message
    await expect(page.locator('text=리뷰가 거부되었습니다')).toBeVisible()
  })

  test('should manage users', async ({ page }) => {
    // Navigate to user management
    await page.click('text=관리자')
    await page.click('text=사용자 관리')
    
    // Mock user list
    await page.route('**/api/admin/users', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          users: [
            {
              id: 'user-1',
              nickname: '일반사용자1',
              role: 'AUTH_LOGIN',
              createdAt: new Date().toISOString(),
              reviewCount: 5
            },
            {
              id: 'user-2',
              nickname: '일반사용자2',
              role: 'LOGIN_NOT_AUTH',
              createdAt: new Date().toISOString(),
              reviewCount: 0
            },
            {
              id: 'user-3',
              nickname: '프리미엄사용자',
              role: 'AUTH_PREMIUM',
              createdAt: new Date().toISOString(),
              reviewCount: 15
            }
          ]
        })
      })
    })
    
    await page.reload()
    
    // Should show user list
    await expect(page.locator('text=일반사용자1')).toBeVisible()
    await expect(page.locator('text=일반사용자2')).toBeVisible()
    await expect(page.locator('text=프리미엄사용자')).toBeVisible()
    
    // Should show user management actions
    await expect(page.locator('button:has-text("차단")')).toBeVisible()
    await expect(page.locator('button:has-text("권한 변경")')).toBeVisible()
  })

  test('should block a user', async ({ page }) => {
    // Navigate to user management
    await page.click('text=관리자')
    await page.click('text=사용자 관리')
    
    // Mock user to block
    await page.route('**/api/admin/users', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          users: [{
            id: 'user-to-block',
            nickname: '차단할사용자',
            role: 'AUTH_LOGIN',
            createdAt: new Date().toISOString(),
            reviewCount: 3
          }]
        })
      })
    })
    
    // Mock block API
    await page.route('**/api/admin/users/*/block', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true })
      })
    })
    
    await page.reload()
    
    // Click block button
    await page.click('button:has-text("차단")')
    
    // Should show confirmation dialog
    await expect(page.locator('text=사용자를 차단하시겠습니까?')).toBeVisible()
    await page.fill('textarea[placeholder*="차단 사유"]', '부적절한 활동')
    await page.click('text=확인')
    
    // Should show success message
    await expect(page.locator('text=사용자가 차단되었습니다')).toBeVisible()
  })

  test('should change user role', async ({ page }) => {
    // Navigate to user management
    await page.click('text=관리자')
    await page.click('text=사용자 관리')
    
    // Mock user list
    await page.route('**/api/admin/users', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          users: [{
            id: 'user-role-change',
            nickname: '권한변경사용자',
            role: 'AUTH_LOGIN',
            createdAt: new Date().toISOString(),
            reviewCount: 10
          }]
        })
      })
    })
    
    // Mock role change API
    await page.route('**/api/admin/users/*/role', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true })
      })
    })
    
    await page.reload()
    
    // Click role change button
    await page.click('button:has-text("권한 변경")')
    
    // Should show role selection dialog
    await expect(page.locator('text=권한을 변경하시겠습니까?')).toBeVisible()
    await page.selectOption('select[name="newRole"]', 'AUTH_PREMIUM')
    await page.click('text=확인')
    
    // Should show success message
    await expect(page.locator('text=사용자 권한이 변경되었습니다')).toBeVisible()
  })

  test('should display system statistics', async ({ page }) => {
    // Navigate to admin dashboard
    await page.click('text=관리자')
    
    // Mock statistics API
    await page.route('**/api/admin/stats', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          totalUsers: 1250,
          totalReviews: 3420,
          pendingReviews: 45,
          totalRoadmaps: 180,
          pendingRoadmaps: 12,
          blockedUsers: 8,
          monthlyActiveUsers: 890,
          averageRating: 4.2
        })
      })
    })
    
    await page.reload()
    
    // Should show statistics
    await expect(page.locator('text=1,250')).toBeVisible() // Total users
    await expect(page.locator('text=3,420')).toBeVisible() // Total reviews
    await expect(page.locator('text=45')).toBeVisible() // Pending reviews
    await expect(page.locator('text=180')).toBeVisible() // Total roadmaps
    await expect(page.locator('text=4.2')).toBeVisible() // Average rating
  })

  test('should handle moderation errors gracefully', async ({ page }) => {
    // Navigate to review moderation
    await page.click('text=관리자')
    await page.click('text=리뷰 검수')
    
    // Mock pending review
    await page.route('**/api/admin/reviews/pending', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          reviews: [{
            id: 'error-review',
            title: '에러 테스트 리뷰',
            content: '에러 테스트용 리뷰입니다.',
            rating: 3,
            status: 'PENDING',
            author: '테스트사용자'
          }]
        })
      })
    })
    
    // Mock API error
    await page.route('**/api/admin/reviews/*/approve', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' })
      })
    })
    
    await page.reload()
    
    // Try to approve review
    await page.click('button:has-text("승인")')
    await page.click('text=확인')
    
    // Should show error message
    await expect(page.locator('text=승인 처리 중 오류가 발생했습니다')).toBeVisible()
  })

  test('should moderate roadmaps', async ({ page }) => {
    // Navigate to roadmap moderation
    await page.click('text=관리자')
    await page.click('text=로드맵 검수')
    
    // Mock pending roadmaps
    await page.route('**/api/admin/roadmaps/pending', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          roadmaps: [{
            id: 'pending-roadmap-1',
            title: '검수 대기 중인 로드맵',
            description: '프론트엔드 개발자 로드맵입니다.',
            status: 'PENDING',
            author: '로드맵작성자',
            createdAt: new Date().toISOString()
          }]
        })
      })
    })
    
    await page.reload()
    
    // Should show pending roadmaps
    await expect(page.locator('text=검수 대기 중인 로드맵')).toBeVisible()
    
    // Should show moderation buttons
    await expect(page.locator('button:has-text("승인")')).toBeVisible()
    await expect(page.locator('button:has-text("거부")')).toBeVisible()
  })

  test('should search and filter in admin panels', async ({ page }) => {
    // Navigate to user management
    await page.click('text=관리자')
    await page.click('text=사용자 관리')
    
    // Should show search functionality
    await expect(page.locator('input[placeholder*="검색"]')).toBeVisible()
    
    // Should show filter options
    await expect(page.locator('select[name="roleFilter"]')).toBeVisible()
    
    // Test search functionality
    await page.fill('input[placeholder*="검색"]', '테스트사용자')
    await page.press('input[placeholder*="검색"]', 'Enter')
    
    // Should filter results (mocked)
    // In real implementation, this would filter the user list
  })

  test('should handle bulk operations', async ({ page }) => {
    // Navigate to review moderation
    await page.click('text=관리자')
    await page.click('text=리뷰 검수')
    
    // Mock multiple pending reviews
    await page.route('**/api/admin/reviews/pending', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          reviews: [
            { id: 'bulk-1', title: '벌크 테스트 1', status: 'PENDING' },
            { id: 'bulk-2', title: '벌크 테스트 2', status: 'PENDING' },
            { id: 'bulk-3', title: '벌크 테스트 3', status: 'PENDING' }
          ]
        })
      })
    })
    
    await page.reload()
    
    // Should show bulk action controls
    await expect(page.locator('input[type="checkbox"]')).toBeVisible()
    await expect(page.locator('button:has-text("일괄 승인")')).toBeVisible()
    await expect(page.locator('button:has-text("일괄 거부")')).toBeVisible()
    
    // Select multiple items
    await page.check('input[type="checkbox"]')
    
    // Perform bulk action
    await page.click('button:has-text("일괄 승인")')
    await page.click('text=확인')
    
    // Should show success message
    await expect(page.locator('text=선택된 항목이 일괄 처리되었습니다')).toBeVisible()
  })
})