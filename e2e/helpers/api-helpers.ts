/**
 * API mocking helper functions for E2E tests
 */

import { Page, Route } from '@playwright/test'

export interface MockReview {
  id: string
  title: string
  content: string
  rating: number
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  author: string
  createdAt: string
}

export interface MockUser {
  id: string
  nickname: string
  role: string
  createdAt: string
  reviewCount: number
}

export interface MockRoadmap {
  id: string
  title: string
  description: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  author: string
  createdAt: string
}

/**
 * Mock the reviews API to return specific data
 */
export async function mockReviewsAPI(page: Page, reviews: MockReview[]) {
  await page.route('**/api/reviews', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ reviews })
    })
  })
}

/**
 * Mock a specific review API
 */
export async function mockReviewAPI(page: Page, reviewId: string, review: MockReview) {
  await page.route(`**/api/reviews/${reviewId}`, route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ review })
    })
  })
}

/**
 * Mock the users API for admin panel
 */
export async function mockUsersAPI(page: Page, users: MockUser[]) {
  await page.route('**/api/admin/users', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ users })
    })
  })
}

/**
 * Mock pending reviews for admin moderation
 */
export async function mockPendingReviewsAPI(page: Page, reviews: MockReview[]) {
  await page.route('**/api/admin/reviews/pending', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ reviews })
    })
  })
}

/**
 * Mock roadmaps API
 */
export async function mockRoadmapsAPI(page: Page, roadmaps: MockRoadmap[]) {
  await page.route('**/api/roadmaps', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ roadmaps })
    })
  })
}

/**
 * Mock API error responses
 */
export async function mockAPIError(page: Page, endpoint: string, status: number = 500, message: string = 'Internal server error') {
  await page.route(endpoint, route => {
    route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify({ error: message })
    })
  })
}

/**
 * Mock successful API responses
 */
export async function mockAPISuccess(page: Page, endpoint: string, data: any = { success: true }) {
  await page.route(endpoint, route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(data)
    })
  })
}

/**
 * Mock admin statistics API
 */
export async function mockAdminStatsAPI(page: Page, stats: any) {
  await page.route('**/api/admin/stats', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(stats)
    })
  })
}

/**
 * Mock user's own reviews API
 */
export async function mockUserReviewsAPI(page: Page, userId: string, reviews: MockReview[]) {
  await page.route(`**/api/users/${userId}/reviews`, route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ reviews })
    })
  })
}

/**
 * Mock comments API
 */
export async function mockCommentsAPI(page: Page, reviewId: string, comments: any[]) {
  await page.route(`**/api/reviews/${reviewId}/comments`, route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ comments })
    })
  })
}

/**
 * Create sample mock data
 */
export const sampleMockData = {
  reviews: [
    {
      id: 'review-1',
      title: 'React 완전정복 강의',
      content: '정말 좋은 강의였습니다. React의 기초부터 고급까지 체계적으로 학습할 수 있었습니다.',
      rating: 5,
      status: 'APPROVED' as const,
      author: '테스트사용자1',
      createdAt: new Date().toISOString()
    },
    {
      id: 'review-2',
      title: 'JavaScript 심화 과정',
      content: 'JavaScript의 고급 개념들을 잘 설명해주는 강의입니다.',
      rating: 4,
      status: 'APPROVED' as const,
      author: '테스트사용자2',
      createdAt: new Date().toISOString()
    }
  ],
  
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
      nickname: '신규사용자',
      role: 'LOGIN_NOT_AUTH',
      createdAt: new Date().toISOString(),
      reviewCount: 0
    }
  ],
  
  roadmaps: [
    {
      id: 'roadmap-1',
      title: '프론트엔드 개발자 로드맵',
      description: '프론트엔드 개발자가 되기 위한 학습 로드맵입니다.',
      status: 'APPROVED' as const,
      author: '로드맵작성자',
      createdAt: new Date().toISOString()
    }
  ],
  
  stats: {
    totalUsers: 1250,
    totalReviews: 3420,
    pendingReviews: 45,
    totalRoadmaps: 180,
    pendingRoadmaps: 12,
    blockedUsers: 8,
    monthlyActiveUsers: 890,
    averageRating: 4.2
  }
}