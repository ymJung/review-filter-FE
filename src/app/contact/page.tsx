import { Layout, Container } from '@/components/layout';
import Link from 'next/link';

export const metadata = {
  title: '문의하기 - Review Filter',
  description: 'Review Filter 서비스 문의 및 제휴 연락처',
};

export default function ContactPage() {
  return (
    <Layout className="bg-white">
      <Container className="py-12 max-w-3xl">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">문의하기</h1>
          <p className="mt-2 text-gray-600">서비스 문의, 제휴 및 제안은 아래 채널로 연락해주세요.</p>
        </header>

        <div className="grid gap-6">
          <div className="p-6 rounded-lg border bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">이메일</h2>
            <a href="mailto:theslowbiz@gmail.com" className="text-blue-600 hover:underline">theslowbiz@gmail.com</a>
          </div>

          <div className="p-6 rounded-lg border">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">자주 찾는 링크</h2>
            <ul className="list-disc ml-5 text-gray-700 space-y-2">
              <li>
                <Link href="/about" className="text-blue-600 hover:underline">회사소개</Link>
              </li>
              <li>
                <Link href="/terms" className="text-blue-600 hover:underline">이용약관</Link>
              </li>
              <li>
                <Link href="/privacy" className="text-blue-600 hover:underline">개인정보처리방침</Link>
              </li>
            </ul>
          </div>
        </div>
      </Container>
    </Layout>
  );
}

