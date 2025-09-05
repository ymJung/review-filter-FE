import { Layout, Container } from '@/components/layout';

export const metadata = {
  title: '회사소개 - Review Filter',
  description: 'Review Filter는 강의 후기와 학습 로드맵을 모아 더 나은 학습 경험을 돕는 플랫폼입니다.',
};

export default function AboutPage() {
  return (
    <Layout className="bg-white">
      <Container className="py-12">
        <header className="mb-10">
          <h1 className="text-3xl font-bold text-gray-900">회사소개</h1>
          <p className="mt-2 text-gray-600">
            Review Filter는 신뢰할 수 있는 강의 후기와 학습 로드맵을 제공하여 학습자들이 더 빠르고 똑똑하게 성장하도록 돕는 서비스입니다.
          </p>
        </header>

        <section className="mb-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">미션</h2>
          <p className="text-gray-700 leading-7">
            과도한 광고와 노이즈 속에서 진짜 도움이 되는 학습 정보를 가려내고, 학습 여정을 체계적으로 설계할 수 있도록 돕는 것이 우리의 목표입니다.
          </p>
        </section>

        <section className="mb-12 grid gap-6 md:grid-cols-3">
          <div className="p-6 rounded-lg border bg-gray-50">
            <h3 className="font-semibold text-gray-900 mb-2">신뢰할 수 있는 후기</h3>
            <p className="text-gray-700 text-sm">검수와 인증 과정을 통해 실제 수강자의 목소리를 전달합니다.</p>
          </div>
          <div className="p-6 rounded-lg border bg-gray-50">
            <h3 className="font-semibold text-gray-900 mb-2">학습 로드맵</h3>
            <p className="text-gray-700 text-sm">어떤 순서로 학습할지, 다음에는 무엇을 들을지 길잡이를 제공합니다.</p>
          </div>
          <div className="p-6 rounded-lg border bg-gray-50">
            <h3 className="font-semibold text-gray-900 mb-2">요약과 인사이트</h3>
            <p className="text-gray-700 text-sm">AI 요약과 인기 카테고리 지표로 빠르게 핵심만 파악합니다.</p>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">연락처</h2>
          <p className="text-gray-700">제휴 및 문의: <a className="text-blue-600 hover:underline" href="mailto:theslowbiz@gmail.com">theslowbiz@gmail.com</a></p>
        </section>
      </Container>
    </Layout>
  );
}

