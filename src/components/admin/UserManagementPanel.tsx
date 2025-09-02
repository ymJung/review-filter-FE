'use client';

<<<<<<< HEAD
import { useState, useEffect } from 'react';
=======
import { useState, useEffect, useRef } from 'react';
>>>>>>> origin/main
import { useAuth } from '@/components/auth/AuthProvider';
import { User } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Loading } from '@/components/ui/Loading';
import { Alert } from '@/components/ui/Alert';
import { Input } from '@/components/ui/Input';
import { formatRelativeTime } from '@/lib/utils';

interface UserWithStats extends User {
  stats?: {
    reviewCount: number;
    roadmapCount: number;
    lastActivity: Date;
  };
}

export function UserManagementPanel() {
  const { firebaseUser } = useAuth();
  const hasFetchedData = useRef(false);
  const [users, setUsers] = useState<UserWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'BLOCKED_LOGIN' | 'AUTH_LOGIN' | 'AUTH_PREMIUM'>('ALL');
  const { firebaseUser } = useAuth();

  useEffect(() => {
<<<<<<< HEAD
    if (!firebaseUser) return;
    fetchUsers();
  }, [filter, searchTerm, firebaseUser]);
=======
    // Reset the flag when user changes or filter/search changes
    hasFetchedData.current = false;
  }, [firebaseUser, filter, searchTerm]);

  useEffect(() => {
    // Fetch data when user is available and we haven't fetched yet
    if (firebaseUser && !hasFetchedData.current) {
      hasFetchedData.current = true;
      fetchUsers();
    }
  }, [firebaseUser, filter, searchTerm]);
>>>>>>> origin/main

  const fetchUsers = async () => {
    try {
      // Wait for firebaseUser to be available
      if (!firebaseUser) {
        hasFetchedData.current = false; // Reset flag if no user
        return;
      }

      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filter !== 'ALL') {
        params.set('role', filter);
      }
      if (searchTerm) {
        params.set('search', searchTerm);
      }
      params.set('limit', '50');
      params.set('_ts', Date.now().toString());

<<<<<<< HEAD
      let headers: HeadersInit = {};
      try {
        const token = await firebaseUser?.getIdToken();
        if (token) headers = { Authorization: `Bearer ${token}` };
      } catch {}

      const response = await fetch(`/api/admin/users?${params.toString()}`, { headers, cache: 'no-store' });
=======
      // Get auth token
      const token = await firebaseUser.getIdToken();

      const response = await fetch(`/api/admin/users?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
>>>>>>> origin/main
      if (!response.ok) {
        throw new Error('사용자 목록을 불러오는데 실패했습니다.');
      }

      const data = await response.json();
      if (data.success) {
        setUsers(data.data || []);
      } else {
        throw new Error(data.error?.message || '사용자 목록을 불러오는데 실패했습니다.');
      }
    } catch (error: any) {
      console.error('Error fetching users:', error);
      setError(error.message);
      hasFetchedData.current = false; // Reset flag on error so we can retry
    } finally {
      setLoading(false);
    }
  };

  const handleUserAction = async (userId: string, action: 'block' | 'unblock' | 'promote' | 'demote') => {
    try {
      if (!firebaseUser) {
        throw new Error('인증이 필요합니다.');
      }

      setProcessingId(userId);

<<<<<<< HEAD
      let headers: HeadersInit = { 'Content-Type': 'application/json' };
      try {
        const token = await firebaseUser?.getIdToken();
        if (token) headers = { ...headers, Authorization: `Bearer ${token}` };
      } catch {}

      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers,
=======
      // Get auth token
      const token = await firebaseUser.getIdToken();

      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
>>>>>>> origin/main
        body: JSON.stringify({
          action,
        }),
      });

      if (!response.ok) {
        throw new Error('사용자 처리에 실패했습니다.');
      }

      const data = await response.json();
      if (data.success) {
        const newRole = data.data.role as User['role'];
        setUsers(prev => {
          const updated = prev.map(u => u.id === userId ? { ...u, role: newRole } : u);
          if (filter !== 'ALL') {
            return updated.filter(u => u.role === filter);
          }
          return updated;
        });
        // 최신 목록 재조회로 정합성 확보
        fetchUsers();
      } else {
        throw new Error(data.error?.message || '사용자 처리에 실패했습니다.');
      }
    } catch (error: any) {
      console.error('Error processing user:', error);
      alert(error.message);
    } finally {
      setProcessingId(null);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <Badge variant="danger">관리자</Badge>;
      case 'AUTH_PREMIUM':
        return <Badge variant="success">프리미엄</Badge>;
      case 'AUTH_LOGIN':
        return <Badge variant="default">인증됨</Badge>;
      case 'LOGIN_NOT_AUTH':
        return <Badge variant="secondary">미인증</Badge>;
      case 'BLOCKED_LOGIN':
        return <Badge variant="danger">블록됨</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  const getRoleActions = (user: UserWithStats) => {
    const actions = [];

    if (user.role === 'BLOCKED_LOGIN') {
      actions.push(
        <Button
          key="unblock"
          variant="success"
          size="sm"
          onClick={() => handleUserAction(user.id, 'unblock')}
          disabled={processingId === user.id}
        >
          차단 해제
        </Button>
      );
    } else if (user.role !== 'ADMIN') {
      actions.push(
        <Button
          key="block"
          variant="danger"
          size="sm"
          onClick={() => handleUserAction(user.id, 'block')}
          disabled={processingId === user.id}
        >
          차단
        </Button>
      );
    }

    if (user.role === 'AUTH_LOGIN' || user.role === 'LOGIN_NOT_AUTH') {
      actions.push(
        <Button
          key="promote"
          variant="outline"
          size="sm"
          onClick={() => handleUserAction(user.id, 'promote')}
          disabled={processingId === user.id}
        >
          프리미엄 승격
        </Button>
      );
    }

    if (user.role === 'AUTH_PREMIUM') {
      actions.push(
        <Button
          key="demote"
          variant="outline"
          size="sm"
          onClick={() => handleUserAction(user.id, 'demote')}
          disabled={processingId === user.id}
        >
          일반 회원으로 변경
        </Button>
      );
    }

    return actions;
  };

  if (loading) {
    return <Loading text="사용자 목록을 불러오는 중..." />;
  }

  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }

  return (
    <div className="space-y-6">
      {/* Search and Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="사용자 닉네임으로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex space-x-2">
              {[
                { key: 'ALL' as const, label: '전체' },
                { key: 'AUTH_LOGIN' as const, label: '인증됨' },
                { key: 'AUTH_PREMIUM' as const, label: '프리미엄' },
                { key: 'BLOCKED_LOGIN' as const, label: '블록됨' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                    filter === tab.key
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      {users.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="text-gray-500">
              <div className="text-4xl mb-4">👥</div>
              <p className="text-lg font-medium mb-2">사용자가 없습니다</p>
              <p className="text-sm">검색 조건을 확인해주세요.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {users.map((user) => {
            const createdAt = user.createdAt instanceof Date ? user.createdAt : new Date(user.createdAt as any);
            const lastActivity = user.stats?.lastActivity instanceof Date || !user.stats?.lastActivity
              ? (user.stats?.lastActivity as Date | undefined)
              : new Date(user.stats!.lastActivity as any);
            return (
            <Card key={user.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-lg font-medium text-gray-600">
                        {user.nickname.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-medium text-gray-900">{user.nickname}</h3>
                        {getRoleBadge(user.role)}
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>가입: {formatRelativeTime(createdAt)}</span>
                        {user.stats && (
                          <>
                            <span>•</span>
                            <span>리뷰 {user.stats.reviewCount}개</span>
                            <span>•</span>
                            <span>로드맵 {user.stats.roadmapCount}개</span>
                            {lastActivity && (
                              <>
                                <span>•</span>
                                <span>최근 활동: {formatRelativeTime(lastActivity)}</span>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {processingId === user.id ? (
                      <div className="text-sm text-gray-500">처리 중...</div>
                    ) : (
                      getRoleActions(user)
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )})}
        </div>
      )}
    </div>
  );
}
