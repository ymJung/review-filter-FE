'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { getUserStatistics, updateCurrentUser, validateNickname } from '@/lib/services/userService';
import { UserStats } from '@/types';
import { formatDate } from '@/lib/utils';
import { USER_ROLES } from '@/lib/constants';

interface UserProfileProps {
  className?: string;
}

export const UserProfile: React.FC<UserProfileProps> = ({ className = '' }) => {
  const { user, refreshUser } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Load user stats
  useEffect(() => {
    const loadStats = async () => {
      if (user) {
        try {
          const userStats = await getUserStatistics();
          setStats(userStats);
        } catch (error) {
          console.error('Error loading user stats:', error);
        }
      }
    };

    loadStats();
  }, [user]);

  // Initialize nickname when editing
  useEffect(() => {
    if (isEditing && user) {
      setNickname(user.nickname);
    }
  }, [isEditing, user]);

  const handleEditClick = () => {
    setIsEditing(true);
    setError('');
    setSuccess('');
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setNickname('');
    setError('');
    setSuccess('');
  };

  const handleSaveNickname = async () => {
    if (!user) return;

    const validation = validateNickname(nickname);
    if (!validation.isValid) {
      setError(validation.error!);
      return;
    }

    setLoading(true);
    setError('');

    try {
      await updateCurrentUser({ nickname: nickname.trim() });
      await refreshUser();
      setIsEditing(false);
      setSuccess('닉네임이 성공적으로 변경되었습니다.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      setError(error.message || '닉네임 변경에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const getRoleDisplayName = (role: string) => {
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

  const getRoleBadgeColor = (role: string) => {
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

  if (!user) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <p className="text-gray-500">로그인이 필요합니다.</p>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">프로필</h2>
        {!isEditing && (
          <button
            onClick={handleEditClick}
            className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
          >
            편집
          </button>
        )}
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-md">
          {success}
        </div>
      )}
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {/* Nickname */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            닉네임
          </label>
          {isEditing ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="닉네임을 입력하세요"
                maxLength={20}
              />
              <button
                onClick={handleSaveNickname}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? '저장 중...' : '저장'}
              </button>
              <button
                onClick={handleCancelEdit}
                disabled={loading}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                취소
              </button>
            </div>
          ) : (
            <p className="text-gray-900 font-medium">{user.nickname}</p>
          )}
        </div>

        {/* Role */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            회원 등급
          </label>
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
            {getRoleDisplayName(user.role)}
          </span>
        </div>

        {/* Join Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            가입일
          </label>
          <p className="text-gray-900">{formatDate(user.createdAt)}</p>
        </div>

        {/* Social Provider */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            로그인 방식
          </label>
          <p className="text-gray-900 capitalize">
            {user.socialProvider === 'google' ? 'Google' : 
             user.socialProvider === 'kakao' ? '카카오' : 
             user.socialProvider === 'naver' ? '네이버' : user.socialProvider}
          </p>
        </div>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">활동 통계</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{stats.reviewCount}</div>
              <div className="text-sm text-blue-800">작성한 리뷰</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{stats.roadmapCount}</div>
              <div className="text-sm text-green-800">작성한 로드맵</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};