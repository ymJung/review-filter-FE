import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/components/auth/AuthProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'Review Filter - 강의 후기 플랫폼',
    template: '%s | Review Filter'
  },
  description: '다양한 온라인 강의에 대한 솔직한 후기를 공유하고, 학습 로드맵을 통해 더 나은 학습 경험을 만들어보세요. AI 기반 리뷰 요약과 인기 카테고리 통계를 제공합니다.',
  keywords: ['강의후기', '온라인강의', '학습로드맵', '강의추천', '리뷰', 'AI요약', '교육플랫폼'],
  authors: [{ name: 'Review Filter Team' }],
  creator: 'Review Filter',
  publisher: 'Review Filter',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    url: 'https://review-filter.vercel.app',
    title: 'Review Filter - 강의 후기 플랫폼',
    description: '다양한 온라인 강의에 대한 솔직한 후기를 공유하고, 학습 로드맵을 통해 더 나은 학습 경험을 만들어보세요.',
    siteName: 'Review Filter',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Review Filter - 강의 후기 플랫폼',
    description: '다양한 온라인 강의에 대한 솔직한 후기를 공유하고, 학습 로드맵을 통해 더 나은 학습 경험을 만들어보세요.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}