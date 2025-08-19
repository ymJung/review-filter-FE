'use client';

import { useAuth } from '@/components/auth/AuthProvider';
import { UserProfile } from '@/components/user/UserProfile';
import { LogoutButton } from '@/components/auth/LogoutButton';

export default function MyPage() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">로그인이 필요합니다</h2>
          <p className="text-gray-600 mb-4">마이페이지에 접근하려면 로그인해주세요.</p>
          <a 
            href="/login" 
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            로그인하기
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">마이페이지</h1>
          <LogoutButton />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* User Profile */}
          <div className="lg:col-span-2">
            <UserProfile />
          </div>
          
          {/* Quick Actions */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">빠른 작업</h3>
              <div className="space-y-3">
                <a
                  href="/write/review"
                  className="block w-full px-4 py-2 text-center bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  리뷰 작성하기
                </a>
                <a
                  href="/write/roadmap"
                  className="block w-full px-4 py-2 text-center bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  로드맵 작성하기
                </a>
                <a
                  href="/reviews"
                  className="block w-full px-4 py-2 text-center bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                >
                  리뷰 둘러보기
                </a>
                <a
                  href="/roadmaps"
                  className="block w-full px-4 py-2 text-center bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                >
                  로드맵 둘러보기
                </a>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">내 활동</h3>
              <div className="space-y-3">
                <a
                  href="/mypage/reviews"
                  className="block text-blue-600 hover:text-blue-800 transition-colors"
                >
                  내가 작성한 리뷰 →
                </a>
                <a
                  href="/mypage/roadmaps"
                  className="block text-blue-600 hover:text-blue-800 transition-colors"
                >
                  내가 작성한 로드맵 →
                </a>
                <a
                  href="/mypage/comments"
                  className="block text-blue-600 hover:text-blue-800 transition-colors"
                >
                  내가 작성한 댓글 →
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}