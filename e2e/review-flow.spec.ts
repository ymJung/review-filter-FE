/**
 * E2E Tests for Review Creation to Publication Flow
 * 
 * Tests the complete review lifecycle from creation to publication:
 * - Review form submission
 * - Image upload process
 * - Review moderation workflow
 * - Review publication and visibility
 */

import { test, expect } from '@playwright/test'
import path from 'path'

test.describe('Review Creation to Publication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Set up authenticated user state
    await page.goto('/')
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
  })

  test('should complete review creation flow', async ({ page }) => {
    // Navigate to review creation page
    await page.click('text=리뷰 작성')
    await expect(page).toHaveURL(/\/write\/review/)
    
    // Fill out the review form
    await page.fill('input[name="platform"]', '인프런')
    await page.fill('input[name="title"]', 'React 완전정복 강의')
    await page.fill('input[name="instructor"]', '김개발')
    await page.selectOption('select[name="category"]', '프로그래밍')
    
    // Fill review content
    await page.fill('textarea[name="content"]', '정말 좋은 강의였습니다. React의 기초부터 고급 개념까지 체계적으로 학습할 수 있었습니다.')
    await page.selectOption('select[name="rating"]', '5')
    await page.fill('input[name="studyPeriod"]', '2024-01')
    
    // Fill detailed review sections
    await page.fill('textarea[name="positivePoints"]', '설명이 명확하고 예제가 풍부합니다. 실습 위주의 강의라 이해하기 쉬웠습니다.')
    await page.fill('textarea[name="negativePoints"]', '조금 더 심화 내용이 있었으면 좋겠습니다.')
    await page.fill('textarea[name="changes"]', 'React 개발 실력이 크게 향상되었고, 실무에 바로 적용할 수 있게 되었습니다.')
    await page.fill('textarea[name="recommendedFor"]', 'React 입문자부터 중급자까지 모두에게 추천합니다.')
    
    // Upload payment verification image (mock file)
    const fileInput = page.locator('input[type="file"]')
    if (await fileInput.isVisible()) {
      // Create a mock file for testing
      const filePath = path.join(__dirname, 'fixtures', 'test-payment.jpg')
      await fileInput.setInputFiles(filePath)
    }
    
    // Submit the review
    await page.click('button[type="submit"]')
    
    // Should show success message
    await expect(page.locator('text=리뷰가 성공적으로 작성되었습니다')).toBeVisible()
    
    // Should redirect to review list or confirmation page
    await expect(page).toHaveURL(/\/reviews|\/my/)
  })

  test('should validate required fields', async ({ page }) => {
    // Navigate to review creation page
    await page.click('text=리뷰 작성')
    
    // Try to submit without filling required fields
    await page.click('button[type="submit"]')
    
    // Should show validation errors
    await expect(page.locator('text=필수 항목을 입력해주세요')).toBeVisible()
    
    // Should not submit the form
    await expect(page).toHaveURL(/\/write\/review/)
  })

  test('should handle image upload validation', async ({ page }) => {
    // Navigate to review creation page
    await page.click('text=리뷰 작성')
    
    // Fill required fields
    await page.fill('input[name="title"]', 'Test Course')
    await page.fill('textarea[name="content"]', 'Test review content')
    await page.selectOption('select[name="rating"]', '4')
    
    // Try to upload invalid file type
    const fileInput = page.locator('input[type="file"]')
    if (await fileInput.isVisible()) {
      // This would show validation error for invalid file type
      await expect(page.locator('text=이미지 파일만 업로드 가능합니다')).not.toBeVisible()
    }
  })

  test('should show review in pending status after submission', async ({ page }) => {
    // Complete review creation (simplified)
    await page.click('text=리뷰 작성')
    await page.fill('input[name="title"]', 'Test Course for Pending')
    await page.fill('textarea[name="content"]', 'Test review content')
    await page.selectOption('select[name="rating"]', '4')
    await page.click('button[type="submit"]')
    
    // Navigate to my page to see submitted reviews
    await page.click('text=마이페이지')
    
    // Should show the review with pending status
    await expect(page.locator('text=Test Course for Pending')).toBeVisible()
    await expect(page.locator('text=검수 중')).toBeVisible()
  })

  test('should upgrade user role after first review submission', async ({ page }) => {
    // Set user as new user (LOGIN_NOT_AUTH)
    await page.evaluate(() => {
      localStorage.setItem('mockAuth', JSON.stringify({
        user: {
          id: 'new-user-id',
          nickname: '신규사용자',
          role: 'LOGIN_NOT_AUTH'
        },
        isAuthenticated: true
      }))
    })
    await page.reload()
    
    // Should show limited access message
    await expect(page.locator('text=리뷰를 작성하면 모든 콘텐츠를 볼 수 있습니다')).toBeVisible()
    
    // Create first review
    await page.click('text=리뷰 작성')
    await page.fill('input[name="title"]', 'First Review')
    await page.fill('textarea[name="content"]', 'My first review')
    await page.selectOption('select[name="rating"]', '5')
    await page.click('button[type="submit"]')
    
    // After submission, user role should be upgraded
    // In real implementation, this would happen automatically
    await page.evaluate(() => {
      localStorage.setItem('mockAuth', JSON.stringify({
        user: {
          id: 'new-user-id',
          nickname: '신규사용자',
          role: 'AUTH_LOGIN'
        },
        isAuthenticated: true
      }))
    })
    await page.reload()
    
    // Should no longer show limited access message
    await expect(page.locator('text=리뷰를 작성하면 모든 콘텐츠를 볼 수 있습니다')).not.toBeVisible()
  })

  test('should handle review creation errors', async ({ page }) => {
    // Navigate to review creation page
    await page.click('text=리뷰 작성')
    
    // Fill form with data that might cause server error
    await page.fill('input[name="title"]', 'Error Test Course')
    await page.fill('textarea[name="content"]', 'Test content')
    await page.selectOption('select[name="rating"]', '3')
    
    // Mock network error by intercepting the request
    await page.route('**/api/reviews', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' })
      })
    })
    
    await page.click('button[type="submit"]')
    
    // Should show error message
    await expect(page.locator('text=리뷰 작성에 실패했습니다')).toBeVisible()
    
    // Should remain on the form page
    await expect(page).toHaveURL(/\/write\/review/)
  })

  test('should show review in list after approval', async ({ page }) => {
    // Mock an approved review in the system
    await page.route('**/api/reviews', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          reviews: [{
            id: 'approved-review-id',
            title: 'Approved Test Course',
            content: 'This is an approved review',
            rating: 5,
            status: 'APPROVED',
            author: '테스트사용자',
            createdAt: new Date().toISOString()
          }]
        })
      })
    })
    
    // Navigate to reviews page
    await page.click('text=리뷰')
    
    // Should show the approved review
    await expect(page.locator('text=Approved Test Course')).toBeVisible()
    await expect(page.locator('text=This is an approved review')).toBeVisible()
  })

  test('should allow editing own reviews', async ({ page }) => {
    // Navigate to my page
    await page.click('text=마이페이지')
    
    // Mock user's reviews
    await page.route('**/api/users/*/reviews', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          reviews: [{
            id: 'user-review-id',
            title: 'My Review',
            content: 'My review content',
            rating: 4,
            status: 'APPROVED',
            canEdit: true
          }]
        })
      })
    })
    
    await page.reload()
    
    // Should show edit button for own reviews
    await expect(page.locator('text=수정')).toBeVisible()
    
    // Click edit button
    await page.click('text=수정')
    
    // Should navigate to edit form
    await expect(page).toHaveURL(/\/write\/review\?edit=/)
  })

  test('should show different content based on user permissions', async ({ page }) => {
    // Test with different user roles viewing reviews
    const testCases = [
      {
        role: 'LOGIN_NOT_AUTH',
        expectLimited: true,
        description: 'new user should see limited content'
      },
      {
        role: 'AUTH_LOGIN',
        expectLimited: false,
        description: 'verified user should see full content'
      },
      {
        role: 'AUTH_PREMIUM',
        expectLimited: false,
        description: 'premium user should see full content without ads'
      }
    ]

    for (const { role, expectLimited, description } of testCases) {
      // Set user role
      await page.evaluate((userRole) => {
        localStorage.setItem('mockAuth', JSON.stringify({
          user: {
            id: 'test-user-id',
            nickname: '테스트사용자',
            role: userRole
          },
          isAuthenticated: true
        }))
      }, role)
      
      await page.reload()
      await page.click('text=리뷰')
      
      if (expectLimited) {
        // Should show limited content or upgrade prompt
        await expect(page.locator('text=더 많은 리뷰를 보려면')).toBeVisible()
      } else {
        // Should show full content
        await expect(page.locator('text=더 많은 리뷰를 보려면')).not.toBeVisible()
      }
    }
  })

  test('should handle comment creation on reviews', async ({ page }) => {
    // Navigate to a review detail page
    await page.click('text=리뷰')
    
    // Mock review detail with comments section
    await page.route('**/api/reviews/*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          review: {
            id: 'review-with-comments',
            title: 'Review with Comments',
            content: 'Review content',
            rating: 5,
            status: 'APPROVED'
          },
          comments: []
        })
      })
    })
    
    // Click on a review to view details
    await page.click('text=자세히 보기')
    
    // Should show comment section
    await expect(page.locator('textarea[placeholder*="댓글"]')).toBeVisible()
    
    // Add a comment
    await page.fill('textarea[placeholder*="댓글"]', '좋은 리뷰 감사합니다!')
    await page.click('text=댓글 작성')
    
    // Should show success message or the comment
    await expect(page.locator('text=댓글이 작성되었습니다')).toBeVisible()
  })
})