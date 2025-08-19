'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';
import { LogoutButton } from '@/components/auth/LogoutButton';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { USER_ROLES } from '@/lib/constants';

export const Header: React.FC = () => {
  const { user, isAuthenticated, isAdmin, canCreateContent } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case USER_ROLES.AUTH_LOGIN:
        return 'success';
      case USER_ROLES.AUTH_PREMIUM:
        return 'secondary';
      case USER_ROLES.ADMIN:
        return 'danger';
      case USER_ROLES.BLOCKED_LOGIN:
        return 'outline';
      default:
        return 'default';
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case USER_ROLES.LOGIN_NOT_AUTH:
        return '일반';
      case USER_ROLES.AUTH_LOGIN:
        return '인증';
      case USER_ROLES.AUTH_PREMIUM:
        return '프리미엄';
      case USER_ROLES.ADMIN:
        return '관리자';
      case USER_ROLES.BLOCKED_LOGIN:
        return '차단';
      default:
        return '게스트';
    }
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">R</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Review Filter</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              href="/reviews"
              className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              리뷰
            </Link>
            <Link
              href="/roadmaps"
              className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              로드맵
            </Link>
            
            {canCreateContent && (
              <div className="relative group">
                <button className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center">
                  글쓰기
                  <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <Link
                    href="/write/review"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    리뷰 작성
                  </Link>
                  <Link
                    href="/write/roadmap"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    로드맵 작성
                  </Link>
                </div>
              </div>
            )}
          </nav>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                {/* User Info */}
                <div className="hidden sm:flex items-center space-x-2">
                  <span className="text-sm text-gray-700">{user?.nickname}</span>
                  <Badge 
                    variant={getRoleBadgeVariant(user?.role || '') as any}
                    size="sm"
                  >
                    {getRoleDisplayName(user?.role || '')}
                  </Badge>
                </div>

                {/* Admin Link */}
                {isAdmin && (
                  <Link
                    href="/admin"
                    className="text-red-600 hover:text-red-700 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    관리자
                  </Link>
                )}

                {/* My Page */}
                <Link
                  href="/mypage"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  마이페이지
                </Link>

                {/* Logout */}
                <LogoutButton className="text-sm px-3 py-1">
                  로그아웃
                </LogoutButton>
              </div>
            ) : (
              <Link href="/login">
                <Button size="sm">로그인</Button>
              </Link>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            >
              <span className="sr-only">메뉴 열기</span>
              <svg
                className={`${isMobileMenuOpen ? 'hidden' : 'block'} h-6 w-6`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <svg
                className={`${isMobileMenuOpen ? 'block' : 'hidden'} h-6 w-6`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-gray-200">
              <Link
                href="/reviews"
                className="text-gray-700 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                리뷰
              </Link>
              <Link
                href="/roadmaps"
                className="text-gray-700 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                로드맵
              </Link>
              
              {canCreateContent && (
                <>
                  <Link
                    href="/write/review"
                    className="text-gray-700 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    리뷰 작성
                  </Link>
                  <Link
                    href="/write/roadmap"
                    className="text-gray-700 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    로드맵 작성
                  </Link>
                </>
              )}

              {isAuthenticated && (
                <>
                  <Link
                    href="/mypage"
                    className="text-gray-700 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    마이페이지
                  </Link>
                  {isAdmin && (
                    <Link
                      href="/admin"
                      className="text-red-600 hover:text-red-700 block px-3 py-2 rounded-md text-base font-medium"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      관리자
                    </Link>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};