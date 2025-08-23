/**
 * E2E Tests for User Permission-based Experiences
 * 
 * Tests different user experiences based on their permission levels:
 * - Unauthenticated users (NOT_ACCESS)
 * - New users (LOGIN_NOT_AUTH)
 * - Verified users (AUTH_LOGIN)
 * - Premium users (AUTH_PREMIUM)
 * - Blocked users (BLOCKED_LOGIN)
 * - Admin users (ADMIN)
 */

import { test, expect } from '@playwright/test'

test.describe('User Permission-based Experiences', () => {
  const userRoles = [
    {
      role: 'NOT_ACCESS',
      nickname: '비회원',
      isAuthenticated: false,
      description: 'Unauthenticated user'
    },
    {
      role: 'LOGIN_NOT_AUTH',
      nickname: '신규회원',
      isAuthenticated: true,
      description: 'New authenticated user'
    },
    {
      role: 'AUTH_LOGIN',
      nickname: '인증회원',
      isAuthenticated: true,
      description: 'Verified user'
    },
    {
      role: 'AUTH_PREMIUM',
      nickname: '프리미엄회원',
      isAuthenticated: true,
      description: 'Premium user'
    },
    {
      role: 'BLOCKED_LOGIN',
      nickname: '차단회원',
      isAuthenticated: true,
      description: 'Blocked user'
    },
    {
      role: 'ADMIN',
      nickname: '관리자',
      isAuthenticated: true,
      description: 'Administrator'
    }
  ]

  userRoles.forEach(({ role, nickname, isAuthenticated, description }) => {
    test.describe(`${description} (${role})`, () => {
      test.beforeEach(async ({ page }) => {
        await page.goto('/')
        
        if (isAuthenticated) {
          await page.evaluate(({ userRole, userNickname }) => {
            localStorage.setItem('mockAuth', JSON.stringify({
              user: {
                id: `${userRole.toLowerCase()}-user-id`,
                nickname: userNickname,
                role: userRole
              },
              isAuthenticated: true
            }))
          }, { userRole: role, userNickname: nickname })
          await page.reload()
        }
      })

      test('should show appropriate navigation menu', async ({ page }) => {
        // Common navigation items
        await expect(page.locator('text=홈')).toBeVisible()
        await expect(page.locator('text=리뷰')).toBeVisible()
        
        if (!isAuthenticated) {
          // Unauthenticated users
          await expect(page.locator('text=로그인')).toBeVisible()
          await expect(page.locator('text=마이페이지')).not.toBeVisible()
          await expect(page.locator('text=리뷰 작성')).not.toBeVisible()
        } else if (role === 'BLOCKED_LOGIN') {
          // Blocked users
          await expect(page.locator('text=로그아웃')).toBeVisible()
          await expect(page.locator('text=리뷰 작성')).not.toBeVisible()
          await expect(page.locator('text=마이페이지')).not.toBeVisible()
        } else if (role === 'ADMIN') {
          // Admin users
          await expect(page.locator('text=관리자')).toBeVisible()
          await expect(page.locator('text=마이페이지')).toBeVisible()
          await expect(page.locator('text=리뷰 작성')).toBeVisible()
        } else {
          // Regular authenticated users
          await expect(page.locator('text=마이페이지')).toBeVisible()
          await expect(page.locator('text=리뷰 작성')).toBeVisible()
          await expect(page.locator('text=로그아웃')).toBeVisible()
        }
      })

      test('should show appropriate content on home page', async ({ page }) => {
        if (!isAuthenticated || role === 'LOGIN_NOT_AUTH') {
          // Should show upgrade prompts
          await expect(page.locator('text=더 많은 리뷰를 보려면')).toBeVisible()
          if (role === 'LOGIN_NOT_AUTH') {
            await expect(page.locator('text=리뷰를 작성하면 모든 콘텐츠를 볼 수 있습니다')).toBeVisible()
          }
        } else if (role === 'BLOCKED_LOGIN') {
          // Should show blocked message
          await expect(page.locator('text=계정이 차단되었습니다')).toBeVisible()
        } else {
          // Should show full content
          await expect(page.locator('text=더 많은 리뷰를 보려면')).not.toBeVisible()
        }
      })

      test('should handle review page access correctly', async ({ page }) => {
        await page.click('text=리뷰')
        
        if (role === 'BLOCKED_LOGIN') {
          // Blocked users should see access denied
          await expect(page.locator('text=접근이 제한되었습니다')).toBeVisible()
        } else if (!isAuthenticated || role === 'LOGIN_NOT_AUTH') {
          // Should show limited reviews
          await expect(page.locator('text=더 많은 리뷰를 보려면')).toBeVisible()
        } else {
          // Should show full review list
          await expect(page.locator('text=리뷰 목록')).toBeVisible()
        }
      })

      test('should handle review creation access', async ({ page }) => {
        if (!isAuthenticated) {
          // Should not show review creation link
          await expect(page.locator('text=리뷰 작성')).not.toBeVisible()
        } else if (role === 'BLOCKED_LOGIN') {
          // Should not show review creation for blocked users
          await expect(page.locator('text=리뷰 작성')).not.toBeVisible()
        } else {
          // Should show review creation link
          await expect(page.locator('text=리뷰 작성')).toBeVisible()
          
          // Click and verify access
          await page.click('text=리뷰 작성')
          await expect(page).toHaveURL(/\/write\/review/)
          await expect(page.locator('form')).toBeVisible()
        }
      })

      test('should handle my page access', async ({ page }) => {
        if (!isAuthenticated) {
          // Should not show my page link
          await expect(page.locator('text=마이페이지')).not.toBeVisible()
        } else if (role === 'BLOCKED_LOGIN') {
          // Should not show my page for blocked users
          await expect(page.locator('text=마이페이지')).not.toBeVisible()
        } else {
          // Should show my page link
          await expect(page.locator('text=마이페이지')).toBeVisible()
          
          // Click and verify access
          await page.click('text=마이페이지')
          await expect(page).toHaveURL(/\/my/)
          await expect(page.locator('text=내 정보')).toBeVisible()
        }
      })

      test('should handle admin access correctly', async ({ page }) => {
        if (role === 'ADMIN') {
          // Admin should see admin menu
          await expect(page.locator('text=관리자')).toBeVisible()
          
          // Should be able to access admin dashboard
          await page.click('text=관리자')
          await expect(page).toHaveURL(/\/admin/)
          await expect(page.locator('text=관리자 대시보드')).toBeVisible()
        } else {
          // Non-admin users should not see admin menu
          await expect(page.locator('text=관리자')).not.toBeVisible()
          
          // Direct access should be denied
          await page.goto('/admin')
          if (isAuthenticated && role !== 'BLOCKED_LOGIN') {
            await expect(page.locator('text=접근 권한이 없습니다')).toBeVisible()
          } else {
            // Should redirect to login or show access denied
            await expect(page).not.toHaveURL(/\/admin/)
          }
        }
      })

      test('should show appropriate content in review details', async ({ page }) => {
        // Mock a review detail page
        await page.route('**/api/reviews/*', route => {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              review: {
                id: 'test-review',
                title: 'Test Review',
                content: 'This is a test review with detailed content that should be filtered based on user permissions.',
                rating: 5,
                status: 'APPROVED',
                positivePoints: 'Great explanations and examples',
                negativePoints: 'Could use more advanced topics',
                changes: 'Improved my React skills significantly',
                recommendedFor: 'Beginners to intermediate developers'
              }
            })
          })
        })
        
        await page.goto('/reviews/test-review')
        
        if (role === 'BLOCKED_LOGIN') {
          await expect(page.locator('text=접근이 제한되었습니다')).toBeVisible()
        } else if (!isAuthenticated || role === 'LOGIN_NOT_AUTH') {
          // Should show limited content
          await expect(page.locator('text=Test Review')).toBeVisible()
          await expect(page.locator('text=더 많은 내용을 보려면')).toBeVisible()
        } else {
          // Should show full content
          await expect(page.locator('text=Test Review')).toBeVisible()
          await expect(page.locator('text=Great explanations and examples')).toBeVisible()
          await expect(page.locator('text=Could use more advanced topics')).toBeVisible()
        }
      })

      test('should handle comment functionality appropriately', async ({ page }) => {
        // Navigate to a review with comments
        await page.goto('/reviews/test-review')
        
        if (role === 'BLOCKED_LOGIN') {
          // Blocked users should not see comment form
          await expect(page.locator('textarea[placeholder*="댓글"]')).not.toBeVisible()
        } else if (!isAuthenticated) {
          // Unauthenticated users should see login prompt for comments
          await expect(page.locator('text=댓글을 작성하려면 로그인하세요')).toBeVisible()
        } else {
          // Authenticated users should see comment form
          await expect(page.locator('textarea[placeholder*="댓글"]')).toBeVisible()
          await expect(page.locator('button:has-text("댓글 작성")')).toBeVisible()
        }
      })

      test('should show appropriate ads based on user level', async ({ page }) => {
        if (role === 'AUTH_PREMIUM') {
          // Premium users should not see ads
          await expect(page.locator('.ad-banner')).not.toBeVisible()
          await expect(page.locator('text=광고')).not.toBeVisible()
        } else if (role !== 'BLOCKED_LOGIN') {
          // Other users should see ads (mocked)
          // In real implementation, ads would be shown
          // For testing, we'll check that ad-free message is not shown
          await expect(page.locator('text=광고 없는 경험')).not.toBeVisible()
        }
      })

      test('should handle roadmap access correctly', async ({ page }) => {
        await page.goto('/roadmaps')
        
        if (role === 'BLOCKED_LOGIN') {
          await expect(page.locator('text=접근이 제한되었습니다')).toBeVisible()
        } else {
          await expect(page.locator('text=로드맵')).toBeVisible()
          
          if (isAuthenticated && role !== 'BLOCKED_LOGIN') {
            // Should show create roadmap button
            await expect(page.locator('text=로드맵 작성')).toBeVisible()
          } else {
            // Should not show create button for unauthenticated users
            await expect(page.locator('text=로드맵 작성')).not.toBeVisible()
          }
        }
      })

      test('should handle search functionality based on permissions', async ({ page }) => {
        // Test search functionality
        const searchInput = page.locator('input[placeholder*="검색"]')
        if (await searchInput.isVisible()) {
          await searchInput.fill('React')
          await page.press('input[placeholder*="검색"]', 'Enter')
          
          if (role === 'BLOCKED_LOGIN') {
            await expect(page.locator('text=검색 결과를 볼 수 없습니다')).toBeVisible()
          } else if (!isAuthenticated || role === 'LOGIN_NOT_AUTH') {
            // Should show limited search results
            await expect(page.locator('text=더 많은 검색 결과를 보려면')).toBeVisible()
          } else {
            // Should show full search results
            await expect(page.locator('text=검색 결과')).toBeVisible()
          }
        }
      })

      test('should show appropriate error messages', async ({ page }) => {
        // Test 404 page access
        await page.goto('/non-existent-page')
        
        if (role === 'BLOCKED_LOGIN') {
          // Blocked users might see different 404 message
          await expect(page.locator('text=페이지를 찾을 수 없습니다')).toBeVisible()
        } else {
          // Regular 404 page
          await expect(page.locator('text=404')).toBeVisible()
        }
      })

      test('should handle profile information display', async ({ page }) => {
        if (isAuthenticated && role !== 'BLOCKED_LOGIN') {
          await page.click('text=마이페이지')
          
          // Should show user information
          await expect(page.locator(`text=${nickname}`)).toBeVisible()
          await expect(page.locator(`text=${role}`)).toBeVisible()
          
          if (role === 'AUTH_PREMIUM') {
            await expect(page.locator('text=프리미엄 회원')).toBeVisible()
          } else if (role === 'ADMIN') {
            await expect(page.locator('text=관리자 권한')).toBeVisible()
          }
        }
      })

      test('should handle feature availability based on role', async ({ page }) => {
        const features = [
          { name: '리뷰 작성', available: isAuthenticated && role !== 'BLOCKED_LOGIN' },
          { name: '댓글 작성', available: isAuthenticated && role !== 'BLOCKED_LOGIN' },
          { name: '로드맵 작성', available: isAuthenticated && role !== 'BLOCKED_LOGIN' },
          { name: '관리자 기능', available: role === 'ADMIN' },
          { name: '프리미엄 기능', available: role === 'AUTH_PREMIUM' || role === 'ADMIN' }
        ]

        for (const feature of features) {
          if (feature.available) {
            // Feature should be accessible
            if (feature.name === '관리자 기능' && role === 'ADMIN') {
              await expect(page.locator('text=관리자')).toBeVisible()
            } else if (feature.name === '리뷰 작성') {
              await expect(page.locator('text=리뷰 작성')).toBeVisible()
            }
          } else {
            // Feature should not be accessible
            if (feature.name === '관리자 기능') {
              await expect(page.locator('text=관리자')).not.toBeVisible()
            }
          }
        }
      })
    })
  })

  test.describe('Role Transition Scenarios', () => {
    test('should handle role upgrade from LOGIN_NOT_AUTH to AUTH_LOGIN', async ({ page }) => {
      // Start as new user
      await page.goto('/')
      await page.evaluate(() => {
        localStorage.setItem('mockAuth', JSON.stringify({
          user: {
            id: 'upgrading-user',
            nickname: '업그레이드사용자',
            role: 'LOGIN_NOT_AUTH'
          },
          isAuthenticated: true
        }))
      })
      await page.reload()
      
      // Should show limited access
      await expect(page.locator('text=리뷰를 작성하면 모든 콘텐츠를 볼 수 있습니다')).toBeVisible()
      
      // Create a review (simulate role upgrade)
      await page.click('text=리뷰 작성')
      await page.fill('input[name="title"]', 'First Review')
      await page.fill('textarea[name="content"]', 'My first review')
      await page.selectOption('select[name="rating"]', '5')
      await page.click('button[type="submit"]')
      
      // Simulate role upgrade
      await page.evaluate(() => {
        localStorage.setItem('mockAuth', JSON.stringify({
          user: {
            id: 'upgrading-user',
            nickname: '업그레이드사용자',
            role: 'AUTH_LOGIN'
          },
          isAuthenticated: true
        }))
      })
      await page.reload()
      
      // Should no longer show limited access message
      await expect(page.locator('text=리뷰를 작성하면 모든 콘텐츠를 볼 수 있습니다')).not.toBeVisible()
    })

    test('should handle user blocking scenario', async ({ page }) => {
      // Start as regular user
      await page.goto('/')
      await page.evaluate(() => {
        localStorage.setItem('mockAuth', JSON.stringify({
          user: {
            id: 'user-to-block',
            nickname: '차단될사용자',
            role: 'AUTH_LOGIN'
          },
          isAuthenticated: true
        }))
      })
      await page.reload()
      
      // Should have normal access
      await expect(page.locator('text=리뷰 작성')).toBeVisible()
      await expect(page.locator('text=마이페이지')).toBeVisible()
      
      // Simulate user being blocked
      await page.evaluate(() => {
        localStorage.setItem('mockAuth', JSON.stringify({
          user: {
            id: 'user-to-block',
            nickname: '차단될사용자',
            role: 'BLOCKED_LOGIN'
          },
          isAuthenticated: true
        }))
      })
      await page.reload()
      
      // Should lose access to features
      await expect(page.locator('text=계정이 차단되었습니다')).toBeVisible()
      await expect(page.locator('text=리뷰 작성')).not.toBeVisible()
      await expect(page.locator('text=마이페이지')).not.toBeVisible()
    })

    test('should handle premium upgrade scenario', async ({ page }) => {
      // Start as regular user
      await page.goto('/')
      await page.evaluate(() => {
        localStorage.setItem('mockAuth', JSON.stringify({
          user: {
            id: 'premium-upgrade-user',
            nickname: '프리미엄업그레이드사용자',
            role: 'AUTH_LOGIN'
          },
          isAuthenticated: true
        }))
      })
      await page.reload()
      
      // Simulate premium upgrade
      await page.evaluate(() => {
        localStorage.setItem('mockAuth', JSON.stringify({
          user: {
            id: 'premium-upgrade-user',
            nickname: '프리미엄업그레이드사용자',
            role: 'AUTH_PREMIUM'
          },
          isAuthenticated: true
        }))
      })
      await page.reload()
      
      // Should show premium features
      await page.click('text=마이페이지')
      await expect(page.locator('text=프리미엄 회원')).toBeVisible()
    })
  })
})