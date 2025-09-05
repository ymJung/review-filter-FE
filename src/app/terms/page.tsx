import { Layout, Container } from '@/components/layout';

export const metadata = {
  title: '이용약관 - Review Filter',
  description: 'Review Filter 서비스 이용약관 안내',
};

export default function TermsPage() {
  return (
    <Layout className="bg-white">
      <Container className="py-12 max-w-3xl text-gray-800">
        <h1 className="text-3xl font-bold mb-2 text-gray-900">이용약관</h1>
        <p className="text-sm text-gray-500 mt-0 mb-8">시행일: 2025-09-05</p>

        <section className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">제1조 (목적)</h2>
          <p className="leading-7">본 약관은 Review Filter(이하 “회사”)가 제공하는 서비스 이용과 관련하여 회사와 이용자 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.</p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">제2조 (정의)</h2>
          <p className="leading-7">“서비스”란 회사가 제공하는 강의 후기 열람·작성, 학습 로드맵, 요약 정보 등 일체의 기능을 말합니다. “이용자”란 본 약관에 동의하고 서비스를 이용하는 자를 말합니다.</p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">제3조 (약관의 게시와 개정)</h2>
          <p className="leading-7">회사는 관련 법령을 위배하지 않는 범위에서 본 약관을 개정할 수 있으며, 개정 시 서비스 내 공지사항을 통해 사전 공지합니다.</p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">제4조 (계정 및 인증)</h2>
          <p className="leading-7">소셜 로그인으로 계정을 생성할 수 있으며, 일부 기능은 인증 또는 별도의 권한이 필요할 수 있습니다. 인증된 이용자는 추가 열람 권한이 부여될 수 있습니다.</p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">제5조 (이용자의 의무)</h2>
          <ul className="list-disc ml-5 space-y-1 leading-7">
            <li>타인의 권리를 침해하거나 위법·부적절한 콘텐츠를 게시하지 않습니다.</li>
            <li>허위 사실, 광고성 게시물, 욕설·비방 등 검수 기준을 위반하지 않습니다.</li>
            <li>계정, 보안 정보는 본인이 책임지고 관리합니다.</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">제6조 (콘텐츠 권리)</h2>
          <p className="leading-7">이용자가 작성한 콘텐츠의 저작권은 이용자에게 있으며, 회사는 서비스 제공 및 운영, 홍보를 위해 필요한 범위에서 비독점적 이용권을 가집니다.</p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">제7조 (서비스의 변경·중단)</h2>
          <p className="leading-7">회사는 운영상·기술상 필요에 따라 서비스의 전부 또는 일부를 변경·중단할 수 있으며, 중요한 변경 시 사전 공지합니다.</p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">제8조 (면책)</h2>
          <p className="leading-7">천재지변, 제3자 서비스 장애, 불가항력 등 회사의 합리적 통제를 벗어난 사유로 인한 손해에 대해 회사는 책임을 지지 않습니다.</p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">제9조 (분쟁 해결)</h2>
          <p className="leading-7">본 약관과 서비스 이용과 관련된 분쟁은 관련 법령 및 상관례에 따릅니다.</p>
        </section>

        <section className="mb-2">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">제10조 (문의처)</h2>
          <p className="leading-7">본 약관에 관한 문의: <a href="mailto:theslowbiz@gmail.com" className="text-blue-600 hover:underline">theslowbiz@gmail.com</a></p>
        </section>
      </Container>
    </Layout>
  );
}
