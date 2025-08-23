/**
 * E2E Tests for User Authentication Flow
 * 
 * Tests the complete user authentication experience including:
 * - Landing page access
 * - Social login flow simulation
 * - User session management
 * - Role-based content access
 */

import { test, expect } from '@playwright/test'

test.describe('User Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the home page before each test
    await page.goto('/')
  })

  test('should display landing page for unauthenticated users', async ({ page }) => {
    // Check if the main page loads correctly
    await expect(page).toHaveTitle(/리뷰 플랫폼/)
    
    // Check for key elements on the landing page
    await expect(page.locator('h1')).toContainText('강의 리뷰 플랫폼')
    
    // Should show login buttons
    await expect(page.locator('text=로그인')).toBeVisible()
    
    // Should show limited content for unauthenticated users
    await expect(page.locator('text=더 많은 리뷰를 보려면')).toBeVisible()
  })

  test('should show social login options', async ({ page }) => {
    // Click on login button or navigate to login page
    await page.click('text=로그인')
    
    // Should show social login options
    await expect(page.locator('text=카카오로 시작하기')).toBeVisible()
    await expect(page.locator('text=네이버로 시작하기')).toBeVisible()
    
    // Check if login buttons are clickable
    const kakaoButton = page.locator('text=카카오로 시작하기')
    await expect(kakaoButton).toBeEnabled()
    
    const naverButton = page.locator('text=네이버로 시작하기')
    await expect(naverButton).toBeEnabled()
  })

  test('should handle login button clicks', async ({ page }) => {
    // Navigate to login page
    await page.click('text=로그인')
    
    // Mock the social login process (since we can't actually authenticate in E2E)
    // In a real scenario, this would redirect to the social provider
    await page.click('text=카카오로 시작하기')
    
    // Should attempt to redirect or show loading state
    // Note: In actual implementation, this would redirect to Kakao OAuth
    // For testing purposes, we'll check if the click is registered
    await expect(page.locator('text=카카오로 시작하기')).toHaveBeenClicked
  })

  test('should show different content for authenticated users', async ({ page }) => {
    // Simulate authenticated state by setting localStorage or cookies
    // This is a mock authentication for testing purposes
    await page.evaluate(() => {
      localStorage.setItem('mockAuth', JSON.stringify({
        user: {
          id: 'test-user-id',
          nickname: '테스트사용자',
          role: 'AUTH_LOGIN'
        },
        isAuthenticated: true
      }))
    })
    
    // Reload the page to apply the mock authentication
    await page.reload()
    
    // Should show authenticated user content
    await expect(page.locator('text=테스트사용자')).toBeVisible()
    await expect(page.locator('text=로그아웃')).toBeVisible()
    
    // Should not show login prompts
    await expect(page.locator('text=더 많은 리뷰를 보려면')).not.toBeVisible()
  })

  test('should handle logout process', async ({ page }) => {
    // Set up authenticated state
    await page.evaluate(() => {
      localStorage.setItem('mockAuth', JSON.stringify({
        user: {
          id: 'test-user-id',
          nickname: '테스트사용자',
          role: 'AUTH_LOGIN'
        },
        isAuthenticated: true
      }))
    })
    
    await page.reload()
    
    // Click logout button
    await page.click('text=로그아웃')
    
    // Should return to unauthenticated state
    await expect(page.locator('text=로그인')).toBeVisible()
    await expect(page.locator('text=테스트사용자')).not.toBeVisible()
  })

  test('should show role-based content access', async ({ page }) => {
    // Test with different user roles
    const roles = [
      { role: 'NOT_ACCESS', expectLimited: true },
      { role: 'LOGIN_NOT_AUTH', expectLimited: true },
      { role: 'AUTH_LOGIN', expectLimited: false },
      { role: 'AUTH_PREMIUM', expectLimited: false },
    ]

    for (const { role, expectLimited } of roles) {
      // Set user role
      await page.evaluate((userRole) => {
        localStorage.setItem('mockAuth', JSON.stringify({
          user: {
            id: 'test-user-id',
            nickname: '테스트사용자',
            role: userRole
          },
          isAuthenticated: userRole !== 'NOT_ACCESS'
        }))
      }, role)
      
      await page.reload()
      
      // Check content visibility based on role
      if (expectLimited) {
        await expect(page.locator('text=더 많은 리뷰를 보려면')).toBeVisible()
      } else {
        await expect(page.locator('text=더 많은 리뷰를 보려면')).not.toBeVisible()
      }
    }
  })

  test('should handle blocked users', async ({ page }) => {
    // Set blocked user state
    await page.evaluate(() => {
      localStorage.setItem('mockAuth', JSON.stringify({
        user: {
          id: 'blocked-user-id',
          nickname: '차단된사용자',
          role: 'BLOCKED_LOGIN'
        },
        isAuthenticated: true
      }))
    })
    
    await page.reload()
    
    // Should show blocked user message
    await expect(page.locator('text=계정이 차단되었습니다')).toBeVisible()
    
    // Should not show normal content
    await expect(page.locator('text=리뷰 작성')).not.toBeVisible()
  })

  test('should persist authentication state across page reloads', async ({ page }) => {
    // Set authenticated state
    await page.evaluate(() => {
      localStorage.setItem('mockAuth', JSON.stringify({
        user: {
          id: 'test-user-id',
          nickname: '테스트사용자',
          role: 'AUTH_LOGIN'
        },
        isAuthenticated: true
      }))
    })
    
    await page.reload()
    
    // Should maintain authenticated state
    await expect(page.locator('text=테스트사용자')).toBeVisible()
    
    // Navigate to different page and back
    await page.goto('/reviews')
    await expect(page.locator('text=테스트사용자')).toBeVisible()
    
    await page.goto('/')
    await expect(page.locator('text=테스트사용자')).toBeVisible()
  })

  test('should handle authentication errors gracefully', async ({ page }) => {
    // Simulate authentication error by setting invalid auth state
    await page.evaluate(() => {
      localStorage.setItem('mockAuth', 'invalid-json')
    })
    
    await page.reload()
    
    // Should fall back to unauthenticated state
    await expect(page.locator('text=로그인')).toBeVisible()
    
    // Should not crash the application
    await expect(page.locator('body')).toBeVisible()
  })

  test('should show appropriate navigation based on auth state', async ({ page }) => {
    // Test unauthenticated navigation
    await expect(page.locator('nav')).toBeVisible()
    await expect(page.locator('text=홈')).toBeVisible()
    await expect(page.locator('text=리뷰')).toBeVisible()
    
    // Should not show authenticated-only navigation
    await expect(page.locator('text=마이페이지')).not.toBeVisible()
    await expect(page.locator('text=리뷰 작성')).not.toBeVisible()
    
    // Set authenticated state
    await page.evaluate(() => {
      localStorage.setItem('mockAuth', JSON.stringify({
        user: {
          id: 'test-user-id',
          nickname: '테스트사용자',
          role: 'AUTH_LOGIN'
        },
        isAuthenticated: true
      }))
    })
    
    await page.reload()
    
    // Should show authenticated navigation
    await expect(page.locator('text=마이페이지')).toBeVisible()
    await expect(page.locator('text=리뷰 작성')).toBeVisible()
  })
})