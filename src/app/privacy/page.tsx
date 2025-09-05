import { Layout, Container } from '@/components/layout';

export const metadata = {
  title: '개인정보처리방침 - Review Filter',
  description: 'Review Filter 개인정보 처리방침 안내',
};

export default function PrivacyPage() {
  return (
    <Layout className="bg-white">
      <Container className="py-12 max-w-3xl text-gray-800">
        <h1 className="text-3xl font-bold mb-2 text-gray-900">개인정보처리방침</h1>
        <p className="text-sm text-gray-500 mt-0 mb-8">시행일: 2025-09-05</p>

        <section className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">1. 수집하는 개인정보 항목</h2>
          <p className="leading-7">회사는 최소한의 개인정보만을 수집합니다. 소셜 로그인 정보(플랫폼, 고유 식별자), 닉네임, 서비스 이용 기록, 쿠키/기기 정보 등이 포함될 수 있습니다.</p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">2. 개인정보의 수집 및 이용 목적</h2>
          <ul className="list-disc ml-5 space-y-1 leading-7">
            <li>회원 식별 및 계정 관리</li>
            <li>후기/로드맵 작성과 열람 등 서비스 제공</li>
            <li>서비스 품질 향상 및 보안 모니터링</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">3. 보유 및 이용 기간</h2>
          <p className="leading-7">법령이 정한 기간 또는 서비스 제공에 필요한 기간 동안 보관하며, 기간 경과 시 지체 없이 파기합니다.</p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">4. 제3자 제공 및 처리 위탁</h2>
          <p className="leading-7">법령상 요구되거나 이용자의 동의가 있는 경우에 한해 제한적으로 제공하며, 위탁 시 수탁자에 대한 관리·감독을 수행합니다.</p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">5. 이용자 권리 및 행사 방법</h2>
          <p className="leading-7">이용자는 개인정보 열람·정정·삭제·처리정지 등을 요청할 수 있습니다. 문의는 아래 연락처로 접수해 주세요.</p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">6. 안전성 확보 조치</h2>
          <p className="leading-7">접근권한 관리, 암호화, 접근 통제, 모니터링 등 합리적인 보호 조치를 적용합니다.</p>
        </section>

        <section className="mb-2">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">7. 문의처</h2>
          <p className="leading-7">개인정보 관련 문의: <a href="mailto:theslowbiz@gmail.com" className="text-blue-600 hover:underline">theslowbiz@gmail.com</a></p>
        </section>
      </Container>
    </Layout>
  );
}
