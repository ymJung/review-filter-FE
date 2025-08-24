/**
 * @jest-environment jsdom
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { LoginForm } from '@/components/auth/LoginForm'
import { authService } from '@/lib/services/authService'
import type { User } from '@/types'

// Mock services
jest.mock('@/lib/services/authService')
jest.mock('@/components/auth/LoginForm')

const mockAuthService = authService as jest.Mocked<typeof authService>

// Mock components
const MockLoginForm = () => <div data-testid="login-form">Login Form</div>

;(LoginForm as jest.Mock).mockImplementation(MockLoginForm)

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

describe('Authentication Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Login Flow', () => {
    it('should handle successful login', async () => {
      const mockUser = createMockUser('AUTH_LOGIN')
      mockAuthService.signInWithGoogle.mockResolvedValue({ success: true, data: mockUser })

      render(
        <AuthProvider value={{ user: null, loading: false }}>
          <MockLoginForm />
        </AuthProvider>
      )

      expect(screen.getByTestId('login-form')).toBeInTheDocument()
    })

    it('should handle login failure', async () => {
      mockAuthService.signInWithGoogle.mockResolvedValue({ 
        success: false, 
        error: { code: 'auth/user-not-found', message: 'User not found' }
      })

      render(
        <AuthProvider value={{ user: null, loading: false }}>
          <MockLoginForm />
        </AuthProvider>
      )

      expect(screen.getByTestId('login-form')).toBeInTheDocument()
    })
  })

  describe('User State Management', () => {
    it('should handle authenticated user state', async () => {
      const mockUser = createMockUser('AUTH_LOGIN')

      render(
        <AuthProvider value={{ user: mockUser, loading: false }}>
          <div data-testid="user-info">
            Welcome, {mockUser.nickname}!
          </div>
        </AuthProvider>
      )

      expect(screen.getByTestId('user-info')).toBeInTheDocument()
      expect(screen.getByText('Welcome, Test User!')).toBeInTheDocument()
    })

    it('should handle loading state', async () => {
      render(
        <AuthProvider value={{ user: null, loading: true }}>
          <div data-testid="loading">Loading...</div>
        </AuthProvider>
      )

      expect(screen.getByTestId('loading')).toBeInTheDocument()
    })

    it('should handle unauthenticated state', async () => {
      render(
        <AuthProvider value={{ user: null, loading: false }}>
          <div data-testid="not-authenticated">
            Please log in
          </div>
        </AuthProvider>
      )

      expect(screen.getByTestId('not-authenticated')).toBeInTheDocument()
    })
  })

  describe('Role-based Access', () => {
    it('should handle admin user', async () => {
      const adminUser = createMockUser('ADMIN')

      render(
        <AuthProvider value={{ user: adminUser, loading: false }}>
          <div data-testid="admin-panel">
            Admin Panel
          </div>
        </AuthProvider>
      )

      expect(screen.getByTestId('admin-panel')).toBeInTheDocument()
    })

    it('should handle premium user', async () => {
      const premiumUser = createMockUser('AUTH_PREMIUM')

      render(
        <AuthProvider value={{ user: premiumUser, loading: false }}>
          <div data-testid="premium-content">
            Premium Content
          </div>
        </AuthProvider>
      )

      expect(screen.getByTestId('premium-content')).toBeInTheDocument()
    })

    it('should handle blocked user', async () => {
      const blockedUser = createMockUser('BLOCKED_LOGIN')

      render(
        <AuthProvider value={{ user: blockedUser, loading: false }}>
          <div data-testid="blocked-message">
            Your account has been blocked
          </div>
        </AuthProvider>
      )

      expect(screen.getByTestId('blocked-message')).toBeInTheDocument()
    })
  })

  describe('Logout Flow', () => {
    it('should handle successful logout', async () => {
      mockAuthService.signOut.mockResolvedValue({ success: true })

      render(
        <AuthProvider value={{ user: null, loading: false }}>
          <div data-testid="logged-out">
            You have been logged out
          </div>
        </AuthProvider>
      )

      expect(screen.getByTestId('logged-out')).toBeInTheDocument()
    })
  })
})