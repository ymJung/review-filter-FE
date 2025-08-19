'use client';

import React, { useState, useEffect } from 'react';
import { User, UserRole } from '@/types';
import { formatDate, formatRelativeTime } from '@/lib/utils';
import { UserRoleManager } from './UserRoleManager';
import { USER_ROLES } from '@/lib/constants';

interface UserListProps {
  users: User[];
  loading?: boolean;
  onRoleChange?: (userId: string, newRole: UserRole) => Promise<void>;
  onUserBlock?: (userId: string) => Promise<void>;
  onUserUnblock?: (userId: string) => Promise<void>;
  className?: string;
}

export const UserList: React.FC<UserListProps> = ({
  users,
  loading = false,
  onRoleChange,
  onUserBlock,
  onUserUnblock,
  className = ''
}) => {
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    if (!onRoleChange) return;
    
    setActionLoading(userId);
    try {
      await onRoleChange(userId, newRole);
    } catch (error) {
      console.error('Error changing user role:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleBlockUser = async (userId: string) => {
    if (!onUserBlock) return;
    
    setActionLoading(userId);
    try {
      await onUserBlock(userId);
    } catch (error) {
      console.error('Error blocking user:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnblockUser = async (userId: string) => {
    if (!onUserUnblock) return;
    
    setActionLoading(userId);
    try {
      await onUserUnblock(userId);
    } catch (error) {
      console.error('Error unblocking user:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const getRoleDisplayName = (role: UserRole) => {
    switch (role) {
      case USER_ROLES.NOT_ACCESS:
        return '미로그인';
      case USER_ROLES.LOGIN_NOT_AUTH:
        return '일반 회원';
      case USER_ROLES.AUTH_LOGIN:
        return '인증 회원';
      case USER_ROLES.AUTH_PREMIUM:
        return '프리미엄 회원';
      case USER_ROLES.BLOCKED_LOGIN:
        return '차단된 회원';
      case USER_ROLES.ADMIN:
        return '관리자';
      default:
        return '알 수 없음';
    }
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case USER_ROLES.AUTH_LOGIN:
        return 'bg-green-100 text-green-800';
      case USER_ROLES.AUTH_PREMIUM:
        return 'bg-purple-100 text-purple-800';
      case USER_ROLES.ADMIN:
        return 'bg-red-100 text-red-800';
      case USER_ROLES.BLOCKED_LOGIN:
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getSocialProviderIcon = (provider: string) => {
    switch (provider) {
      case 'google':
        return '🔍';
      case 'kakao':
        return '💬';
      case 'naver':
        return '🟢';
      default:
        return '👤';
    }
  };

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        {[...Array(5)].map((_, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-6 animate-pulse">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="text-gray-500">
          <div className="text-4xl mb-4">👥</div>
          <p className="text-lg font-medium">사용자가 없습니다</p>
          <p className="text-sm">등록된 사용자가 없습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {users.map((user) => (
        <div key={user.id} className="bg-white rounded-lg shadow">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-2xl">
                  {getSocialProviderIcon(user.socialProvider)}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {user.nickname}
                  </h3>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <span>가입: {formatRelativeTime(user.createdAt)}</span>
                    <span>•</span>
                    <span className="capitalize">{user.socialProvider}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                  {getRoleDisplayName(user.role)}
                </span>
                
                <button
                  onClick={() => setExpandedUser(expandedUser === user.id ? null : user.id)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg
                    className={`w-5 h-5 transform transition-transform ${
                      expandedUser === user.id ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Expanded Details */}
          {expandedUser === user.id && (
            <div className="border-t border-gray-200 p-6 bg-gray-50">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* User Details */}
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">사용자 정보</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">사용자 ID:</span>
                      <span className="font-mono text-xs">{user.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">소셜 ID:</span>
                      <span className="font-mono text-xs">{user.socialId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">가입일:</span>
                      <span>{formatDate(user.createdAt)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">최근 활동:</span>
                      <span>{formatDate(user.updatedAt)}</span>
                    </div>
                  </div>
                </div>

                {/* Role Management */}
                <div>
                  <UserRoleManager
                    userId={user.id}
                    currentRole={user.role}
                    onRoleChange={handleRoleChange}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex justify-end space-x-3">
                {user.role === USER_ROLES.BLOCKED_LOGIN ? (
                  <button
                    onClick={() => handleUnblockUser(user.id)}
                    disabled={actionLoading === user.id}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {actionLoading === user.id ? '처리 중...' : '차단 해제'}
                  </button>
                ) : (
                  <button
                    onClick={() => handleBlockUser(user.id)}
                    disabled={actionLoading === user.id}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {actionLoading === user.id ? '처리 중...' : '사용자 차단'}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};