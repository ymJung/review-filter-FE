/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.SITE_URL || 'https://review-platform.vercel.app',
  generateRobotsTxt: true,
  generateIndexSitemap: false,
  exclude: [
    '/admin',
    '/admin/*',
    '/api/*',
    '/write/*',
    '/mypage',
    '/login',
  ],
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api', '/write', '/mypage', '/login'],
      },
    ],
    additionalSitemaps: [
      `${process.env.SITE_URL || 'https://review-platform.vercel.app'}/sitemap.xml`,
    ],
  },
  transform: async (config, path) => {
    // Custom transform for dynamic routes
    if (path === '/reviews') {
      return {
        loc: path,
        changefreq: 'daily',
        priority: 0.8,
        lastmod: new Date().toISOString(),
      };
    }

    if (path === '/roadmaps') {
      return {
        loc: path,
        changefreq: 'weekly',
        priority: 0.7,
        lastmod: new Date().toISOString(),
      };
    }

    // Default transform
    return {
      loc: path,
      changefreq: 'monthly',
      priority: 0.5,
      lastmod: new Date().toISOString(),
    };
  },
};