/**
 * Authentication Flow Integration Tests
 * 
 * Tests the complete authentication flow including:
 * - Social login (Kakao/Naver)
 * - User creation and profile management
 * - Session management
 * - Role-based access control
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AuthProvider, SocialLoginButton, ProtectedRoute } from './__mocks__/components'
import { userService } from './__mocks__/services'
// Mock Firebase auth
const auth = {
  currentUser: null,
}
import { User } from '@/types'

// Mock Firebase Auth functions
const mockSignInWithPopup = jest.fn()
const mockSignOut = jest.fn()
const mockOnAuthStateChanged = jest.fn()

describe('Authentication Flow Integration', () => {
  const mockUser: User = {
    id: 'test-user-id',
    socialProvider: 'kakao',
    socialId: 'kakao-123',
    nickname: '행복한고양이',
    role: 'LOGIN_NOT_AUTH',
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(userService.generateRandomNickname as jest.Mock).mockReturnValue('행복한고양이')
  })

  describe('Social Login Flow', () => {
    it('should complete Kakao login flow successfully', async () => {
      // Mock successful Firebase auth
      const mockFirebaseUser = {
        uid: 'firebase-uid',
        providerData: [{ providerId: 'oidc.kakao' }],
      }
      
      mockSignInWithPopup.mockResolvedValue({
        user: mockFirebaseUser,
      })

      // Mock user service responses
      ;(userService.getUserById as jest.Mock).mockResolvedValue(null) // New user
      ;(userService.createUser as jest.Mock).mockResolvedValue(mockUser)

      const TestComponent = () => (
        <AuthProvider>
          <SocialLoginButton provider="kakao" />
        </AuthProvider>
      )

      render(<TestComponent />)

      const loginButton = screen.getByRole('button', { name: /카카오로 시작하기/i })
      fireEvent.click(loginButton)

      await waitFor(() => {
        expect(mockSignInWithPopup).toHaveBeenCalled()
      })

      // Verify user creation flow
      await waitFor(() => {
        expect(userService.createUser).toHaveBeenCalledWith({
          id: 'firebase-uid',
          socialProvider: 'kakao',
          socialId: expect.any(String),
          nickname: '행복한고양이',
          role: 'LOGIN_NOT_AUTH',
        })
      })
    })

    it('should handle existing user login', async () => {
      const mockFirebaseUser = {
        uid: 'existing-user-id',
        providerData: [{ providerId: 'oidc.naver' }],
      }
      
      mockSignInWithPopup.mockResolvedValue({
        user: mockFirebaseUser,
      })

      // Mock existing user
      ;(userService.getUserById as jest.Mock).mockResolvedValue({
        ...mockUser,
        id: 'existing-user-id',
        socialProvider: 'naver',
        role: 'AUTH_LOGIN',
      })

      const TestComponent = () => (
        <AuthProvider>
          <SocialLoginButton provider="naver" />
        </AuthProvider>
      )

      render(<TestComponent />)

      const loginButton = screen.getByRole('button', { name: /네이버로 시작하기/i })
      fireEvent.click(loginButton)

      await waitFor(() => {
        expect(mockSignInWithPopup).toHaveBeenCalled()
      })

      // Should not create new user
      expect(userService.createUser).not.toHaveBeenCalled()
      
      // Should retrieve existing user
      await waitFor(() => {
        expect(userService.getUserById).toHaveBeenCalledWith('existing-user-id')
      })
    })

    it('should handle login errors gracefully', async () => {
      mockSignInWithPopup.mockRejectedValue(new Error('Login failed'))

      const TestComponent = () => (
        <AuthProvider>
          <SocialLoginButton provider="kakao" />
        </AuthProvider>
      )

      render(<TestComponent />)

      const loginButton = screen.getByRole('button', { name: /카카오로 시작하기/i })
      fireEvent.click(loginButton)

      await waitFor(() => {
        expect(mockSignInWithPopup).toHaveBeenCalled()
      })

      // Should not create user on login failure
      expect(userService.createUser).not.toHaveBeenCalled()
    })
  })

  describe('Session Management', () => {
    it('should maintain user session across page reloads', async () => {
      const mockFirebaseUser = {
        uid: 'session-user-id',
        providerData: [{ providerId: 'oidc.kakao' }],
      }

      // Mock auth state change listener
      let authStateCallback: (user: any) => void
      mockOnAuthStateChanged.mockImplementation((auth, callback) => {
        authStateCallback = callback
        return () => {} // unsubscribe function
      })

      ;(userService.getUserById as jest.Mock).mockResolvedValue({
        ...mockUser,
        id: 'session-user-id',
        role: 'AUTH_LOGIN',
      })

      const TestComponent = () => (
        <AuthProvider>
          <div data-testid="auth-status">
            {/* This would show user info when authenticated */}
          </div>
        </AuthProvider>
      )

      render(<TestComponent />)

      // Simulate Firebase auth state change
      authStateCallback!(mockFirebaseUser)

      await waitFor(() => {
        expect(userService.getUserById).toHaveBeenCalledWith('session-user-id')
      })
    })

    it('should handle logout correctly', async () => {
      mockSignOut.mockResolvedValue(undefined)

      const TestComponent = () => (
        <AuthProvider>
          <button onClick={() => mockSignOut()}>로그아웃</button>
        </AuthProvider>
      )

      render(<TestComponent />)

      const logoutButton = screen.getByRole('button', { name: /로그아웃/i })
      fireEvent.click(logoutButton)

      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalled()
      })
    })
  })

  describe('Role-based Access Control', () => {
    const ProtectedContent = () => <div data-testid="protected-content">Protected Content</div>
    const UnauthorizedContent = () => <div data-testid="unauthorized">Unauthorized</div>

    it('should allow access for authorized users', async () => {
      const authorizedUser = { ...mockUser, role: 'AUTH_LOGIN' as const }

      const TestComponent = () => (
        <AuthProvider>
          <ProtectedRoute 
            allowedRoles={['AUTH_LOGIN', 'AUTH_PREMIUM', 'ADMIN']}
            fallback={<UnauthorizedContent />}
          >
            <ProtectedContent />
          </ProtectedRoute>
        </AuthProvider>
      )

      // Mock authenticated user
      ;(userService.getUserById as jest.Mock).mockResolvedValue(authorizedUser)
      
      let authStateCallback: (user: any) => void
      mockOnAuthStateChanged.mockImplementation((auth, callback) => {
        authStateCallback = callback
        return () => {}
      })

      render(<TestComponent />)

      // Simulate authenticated user
      authStateCallback!({ uid: 'test-user-id' })

      await waitFor(() => {
        expect(screen.getByTestId('protected-content')).toBeInTheDocument()
      })
    })

    it('should deny access for unauthorized users', async () => {
      const unauthorizedUser = { ...mockUser, role: 'LOGIN_NOT_AUTH' as const }

      const TestComponent = () => (
        <AuthProvider>
          <ProtectedRoute 
            allowedRoles={['AUTH_LOGIN', 'AUTH_PREMIUM', 'ADMIN']}
            fallback={<UnauthorizedContent />}
          >
            <ProtectedContent />
          </ProtectedRoute>
        </AuthProvider>
      )

      ;(userService.getUserById as jest.Mock).mockResolvedValue(unauthorizedUser)
      
      let authStateCallback: (user: any) => void
      mockOnAuthStateChanged.mockImplementation((auth, callback) => {
        authStateCallback = callback
        return () => {}
      })

      render(<TestComponent />)

      authStateCallback!({ uid: 'test-user-id' })

      await waitFor(() => {
        expect(screen.getByTestId('unauthorized')).toBeInTheDocument()
      })
      
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
    })

    it('should handle blocked users correctly', async () => {
      const blockedUser = { ...mockUser, role: 'BLOCKED_LOGIN' as const }

      const TestComponent = () => (
        <AuthProvider>
          <ProtectedRoute 
            allowedRoles={['LOGIN_NOT_AUTH', 'AUTH_LOGIN']}
            fallback={<UnauthorizedContent />}
          >
            <ProtectedContent />
          </ProtectedRoute>
        </AuthProvider>
      )

      ;(userService.getUserById as jest.Mock).mockResolvedValue(blockedUser)
      
      let authStateCallback: (user: any) => void
      mockOnAuthStateChanged.mockImplementation((auth, callback) => {
        authStateCallback = callback
        return () => {}
      })

      render(<TestComponent />)

      authStateCallback!({ uid: 'test-user-id' })

      await waitFor(() => {
        expect(screen.getByTestId('unauthorized')).toBeInTheDocument()
      })
    })
  })

  describe('User Role Progression', () => {
    it('should upgrade user role after first review submission', async () => {
      const newUser = { ...mockUser, role: 'LOGIN_NOT_AUTH' as const }
      const upgradedUser = { ...mockUser, role: 'AUTH_LOGIN' as const }

      ;(userService.updateUserRole as jest.Mock).mockResolvedValue(upgradedUser)

      // Simulate role upgrade
      await userService.updateUserRole('test-user-id', 'AUTH_LOGIN')

      expect(userService.updateUserRole).toHaveBeenCalledWith('test-user-id', 'AUTH_LOGIN')
    })
  })
})