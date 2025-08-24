import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const baseUrl = process.env.SITE_URL || 'https://review-platform.vercel.app';
  
  const robots = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /api
Disallow: /write
Disallow: /mypage
Disallow: /login

# Sitemap
Sitemap: ${baseUrl}/sitemap.xml

# Crawl-delay for respectful crawling
Crawl-delay: 1

# Allow specific search engines
User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

User-agent: NaverBot
Allow: /

# Block AI training crawlers (optional)
User-agent: GPTBot
Disallow: /

User-agent: ChatGPT-User
Disallow: /

User-agent: CCBot
Disallow: /

User-agent: anthropic-ai
Disallow: /

User-agent: Claude-Web
Disallow: /`;

  return new NextResponse(robots, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400', // Cache for 24 hours
    },
  });
}