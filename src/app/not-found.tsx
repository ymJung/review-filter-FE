import Link from 'next/link';
import { Button } from '@/components/ui';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-gray-700 mb-2">
            페이지를 찾을 수 없습니다
          </h2>
          <p className="text-gray-600">
            요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.
          </p>
        </div>
        
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/">
              <Button size="sm">
                홈으로 이동
              </Button>
            </Link>
            <Link href="/reviews">
              <Button variant="outline" size="sm">
                리뷰 보기
              </Button>
            </Link>
          </div>
          
          <div className="text-sm text-gray-500">
            <p>또는 다음 링크를 이용해보세요:</p>
            <div className="mt-2 space-y-1">
              <Link href="/roadmaps" className="block text-blue-600 hover:text-blue-800">
                학습 로드맵
              </Link>
              <Link href="/write/review" className="block text-blue-600 hover:text-blue-800">
                리뷰 작성
              </Link>
              <Link href="/mypage" className="block text-blue-600 hover:text-blue-800">
                마이페이지
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}