'use client';

import React from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { UserRole } from '@/types';
import { USER_ROLES } from '@/lib/constants';

interface UserRoleManagerProps {
  userId: string;
  currentRole: UserRole;
  onRoleChange?: (userId: string, newRole: UserRole) => void;
  className?: string;
}

export const UserRoleManager: React.FC<UserRoleManagerProps> = ({
  userId,
  currentRole,
  onRoleChange,
  className = ''
}) => {
  const { user, isAdmin } = useAuth();

  // Only admins can manage user roles
  if (!isAdmin) {
    return null;
  }

  // Can't change own role
  if (user?.id === userId) {
    return (
      <div className={`text-sm text-gray-500 ${className}`}>
        자신의 권한은 변경할 수 없습니다.
      </div>
    );
  }

  const roleOptions = [
    { value: USER_ROLES.LOGIN_NOT_AUTH, label: '일반 회원', description: '기본 권한' },
    { value: USER_ROLES.AUTH_LOGIN, label: '인증 회원', description: '리뷰 작성 후 승급' },
    { value: USER_ROLES.AUTH_PREMIUM, label: '프리미엄 회원', description: '광고 없는 경험' },
    { value: USER_ROLES.BLOCKED_LOGIN, label: '차단된 회원', description: '서비스 이용 제한' },
    { value: USER_ROLES.ADMIN, label: '관리자', description: '모든 권한' },
  ];

  const handleRoleChange = (newRole: UserRole) => {
    if (onRoleChange) {
      onRoleChange(userId, newRole);
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case USER_ROLES.AUTH_LOGIN:
        return 'text-green-600';
      case USER_ROLES.AUTH_PREMIUM:
        return 'text-purple-600';
      case USER_ROLES.ADMIN:
        return 'text-red-600';
      case USER_ROLES.BLOCKED_LOGIN:
        return 'text-gray-600';
      default:
        return 'text-blue-600';
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          사용자 권한
        </label>
        <span className={`text-sm font-medium ${getRoleColor(currentRole)}`}>
          현재: {roleOptions.find(opt => opt.value === currentRole)?.label}
        </span>
      </div>
      
      <div className="space-y-2">
        {roleOptions.map((option) => (
          <label key={option.value} className="flex items-center space-x-3 cursor-pointer">
            <input
              type="radio"
              name={`role-${userId}`}
              value={option.value}
              checked={currentRole === option.value}
              onChange={() => handleRoleChange(option.value as UserRole)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
            />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900">
                  {option.label}
                </span>
                <span className="text-xs text-gray-500">
                  {option.description}
                </span>
              </div>
            </div>
          </label>
        ))}
      </div>
      
      <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
        <strong>권한 설명:</strong>
        <ul className="mt-1 space-y-1">
          <li>• 일반 회원: 제한된 리뷰 조회</li>
          <li>• 인증 회원: 모든 리뷰 조회 및 작성</li>
          <li>• 프리미엄 회원: 광고 없는 서비스</li>
          <li>• 차단된 회원: 서비스 이용 불가</li>
          <li>• 관리자: 모든 관리 기능</li>
        </ul>
      </div>
    </div>
  );
};