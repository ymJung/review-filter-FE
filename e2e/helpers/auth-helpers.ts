/**
 * Authentication helper functions for E2E tests
 */

import { Page } from '@playwright/test'

export type UserRole = 'NOT_ACCESS' | 'LOGIN_NOT_AUTH' | 'AUTH_LOGIN' | 'AUTH_PREMIUM' | 'BLOCKED_LOGIN' | 'ADMIN'

export interface MockUser {
  id: string
  nickname: string
  role: UserRole
}

/**
 * Set up mock authentication state for a user
 */
export async function setMockAuth(page: Page, user: MockUser) {
  await page.evaluate((userData) => {
    localStorage.setItem('mockAuth', JSON.stringify({
      user: userData,
      isAuthenticated: true
    }))
  }, user)
}

/**
 * Clear authentication state
 */
export async function clearAuth(page: Page) {
  await page.evaluate(() => {
    localStorage.removeItem('mockAuth')
  })
}

/**
 * Create a mock user with the specified role
 */
export function createMockUser(role: UserRole, nickname?: string): MockUser {
  const roleNicknames = {
    'NOT_ACCESS': '비회원',
    'LOGIN_NOT_AUTH': '신규회원',
    'AUTH_LOGIN': '인증회원',
    'AUTH_PREMIUM': '프리미엄회원',
    'BLOCKED_LOGIN': '차단회원',
    'ADMIN': '관리자'
  }

  return {
    id: `${role.toLowerCase()}-user-id`,
    nickname: nickname || roleNicknames[role],
    role
  }
}

/**
 * Login as a specific user role
 */
export async function loginAs(page: Page, role: UserRole, nickname?: string) {
  const user = createMockUser(role, nickname)
  await setMockAuth(page, user)
  await page.reload()
}

/**
 * Logout the current user
 */
export async function logout(page: Page) {
  await clearAuth(page)
  await page.reload()
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  return await page.evaluate(() => {
    const auth = localStorage.getItem('mockAuth')
    if (!auth) return false
    try {
      const authData = JSON.parse(auth)
      return authData.isAuthenticated === true
    } catch {
      return false
    }
  })
}

/**
 * Get current user role
 */
export async function getCurrentUserRole(page: Page): Promise<UserRole | null> {
  return await page.evaluate(() => {
    const auth = localStorage.getItem('mockAuth')
    if (!auth) return null
    try {
      const authData = JSON.parse(auth)
      return authData.user?.role || null
    } catch {
      return null
    }
  })
}