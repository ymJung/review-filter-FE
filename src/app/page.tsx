'use client';

import { Layout, Container } from '@/components/layout';
import { Card, CardContent, Button } from '@/components/ui';
import { CategoryStatsComponent } from '@/components/course';
import { useAuth } from '@/components/auth/AuthProvider';
import Link from 'next/link';

export default function Home() {
  const { isAuthenticated, canCreateContent } = useAuth();

  return (
    <Layout>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20">
        <Container>
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Review Filter
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100">
              강의 후기를 모으는 플랫폼
            </p>
            <p className="text-lg mb-8 text-blue-100 max-w-2xl mx-auto">
              다양한 온라인 강의에 대한 솔직한 후기를 공유하고, 
              학습 로드맵을 통해 더 나은 학습 경험을 만들어보세요.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/reviews">
                <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
                  리뷰 둘러보기
                </Button>
              </Link>
              {canCreateContent ? (
                <Link href="/write/review">
                  <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600">
                    리뷰 작성하기
                  </Button>
                </Link>
              ) : (
                <Link href="/login">
                  <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600">
                    로그인하고 시작하기
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </Container>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <Container>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              왜 Review Filter인가요?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              온라인 학습의 효율성을 높이는 다양한 기능을 제공합니다.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">솔직한 리뷰</h3>
                <p className="text-gray-600">
                  실제 수강생들의 솔직한 후기를 통해 강의의 장단점을 미리 파악할 수 있습니다.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">학습 로드맵</h3>
                <p className="text-gray-600">
                  체계적인 학습 경로를 제시하여 효율적인 스킬 향상을 도와드립니다.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">커뮤니티</h3>
                <p className="text-gray-600">
                  같은 관심사를 가진 학습자들과 소통하며 함께 성장할 수 있습니다.
                </p>
              </CardContent>
            </Card>
          </div>
        </Container>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gray-50">
        <Container>
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              인기 카테고리
            </h2>
            <p className="text-lg text-gray-600">
              최근 리뷰가 많이 작성된 인기 카테고리를 확인해보세요.
            </p>
          </div>
          
          <div className="max-w-2xl mx-auto">
            <CategoryStatsComponent 
              source="reviews"
              limit={8}
              title="인기 카테고리 TOP 8"
            />
          </div>
        </Container>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-white">
        <Container>
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              지금 시작해보세요
            </h2>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              {isAuthenticated 
                ? "첫 번째 리뷰를 작성하고 더 많은 콘텐츠에 접근해보세요."
                : "회원가입하고 다양한 강의 후기를 확인해보세요."
              }
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {isAuthenticated ? (
                <>
                  <Link href="/write/review">
                    <Button size="lg">
                      첫 리뷰 작성하기
                    </Button>
                  </Link>
                  <Link href="/roadmaps">
                    <Button size="lg" variant="outline">
                      로드맵 둘러보기
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/login">
                    <Button size="lg">
                      무료로 시작하기
                    </Button>
                  </Link>
                  <Link href="/reviews">
                    <Button size="lg" variant="outline">
                      리뷰 미리보기
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </Container>
      </section>
    </Layout>
  );
}