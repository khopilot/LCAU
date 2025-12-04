import * as cheerio from 'cheerio';
import pLimit from 'p-limit';
import type { CrawlOptions, CrawledPage } from './types';
import type { SupportedLanguage } from '@lcau/shared';

const EXCLUDED_PATHS = [
  '/wp-admin',
  '/wp-content',
  '/wp-includes',
  '/cart',
  '/checkout',
  '/my-account',
  '/login',
  '/register',
  '.pdf',
  '.jpg',
  '.png',
  '.gif',
  '.svg',
  '.css',
  '.js',
];

const SECTION_PATTERNS: Record<string, string> = {
  '/cours': 'courses',
  '/culture': 'culture',
  '/mediatheque': 'library',
  '/community': 'community',
  '/event': 'events',
  '/actualites': 'news',
  '/about': 'about',
  '/faq': 'faq',
};

export async function crawlSite(
  baseUrl: string,
  options: CrawlOptions
): Promise<CrawledPage[]> {
  const visited = new Set<string>();
  const toVisit = new Set<string>([baseUrl]);
  const pages: CrawledPage[] = [];
  const limit = pLimit(options.concurrency);

  while (toVisit.size > 0 && pages.length < options.maxPages) {
    const batch = Array.from(toVisit).slice(0, options.concurrency);
    batch.forEach((url) => toVisit.delete(url));

    const results = await Promise.all(
      batch.map((url) =>
        limit(async () => {
          if (visited.has(url)) return null;
          visited.add(url);

          try {
            const page = await crawlPage(url, baseUrl);

            // Add delay between requests
            await sleep(options.delay);

            // Extract and queue new links
            if (page) {
              const links = extractLinks(page.content, url, baseUrl);
              links.forEach((link) => {
                if (!visited.has(link) && !isExcluded(link)) {
                  toVisit.add(link);
                }
              });
            }

            return page;
          } catch (error) {
            console.error(`   ⚠ Failed to crawl ${url}:`, (error as Error).message);
            return null;
          }
        })
      )
    );

    pages.push(...results.filter((p): p is CrawledPage => p !== null));
    console.log(`   Progress: ${pages.length} pages crawled, ${toVisit.size} in queue`);
  }

  return pages;
}

async function crawlPage(url: string, baseUrl: string): Promise<CrawledPage | null> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'LCAU-Crawler/1.0 (IFC Cambodia Chatbot Indexer)',
      'Accept': 'text/html',
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html')) {
    return null;
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  // Remove unwanted elements
  $('script, style, nav, footer, header, .menu, .sidebar, .advertisement').remove();

  // Extract title
  const title =
    $('h1').first().text().trim() ||
    $('title').text().trim() ||
    'Untitled';

  // Extract main content
  const mainContent =
    $('main').text() ||
    $('article').text() ||
    $('.content').text() ||
    $('body').text();

  const content = cleanText(mainContent);

  if (!content || content.length < 50) {
    return null;
  }

  // Detect language from URL or content
  const language = detectLanguageFromUrl(url) || detectLanguageFromContent(content);

  // Detect section
  const section = detectSection(url);

  return {
    url,
    title: cleanText(title),
    content,
    language,
    section,
    crawledAt: Date.now(),
  };
}

function extractLinks(html: string, currentUrl: string, baseUrl: string): string[] {
  const $ = cheerio.load(html);
  const links: string[] = [];

  $('a[href]').each((_, el) => {
    const href = $(el).attr('href');
    if (!href) return;

    try {
      const absoluteUrl = new URL(href, currentUrl).href;

      // Only include links from the same domain
      if (absoluteUrl.startsWith(baseUrl)) {
        // Remove hash and query params for deduplication
        const cleanUrl = absoluteUrl.split('#')[0]?.split('?')[0];
        if (cleanUrl) {
          links.push(cleanUrl);
        }
      }
    } catch {
      // Invalid URL, skip
    }
  });

  return [...new Set(links)];
}

function isExcluded(url: string): boolean {
  return EXCLUDED_PATHS.some((path) => url.includes(path));
}

function detectSection(url: string): string | undefined {
  for (const [pattern, section] of Object.entries(SECTION_PATTERNS)) {
    if (url.includes(pattern)) {
      return section;
    }
  }
  return undefined;
}

function detectLanguageFromUrl(url: string): SupportedLanguage | null {
  if (url.includes('/km/') || url.includes('/khmer/')) return 'km';
  if (url.includes('/en/') || url.includes('/english/')) return 'en';
  if (url.includes('/fr/') || url.includes('/french/')) return 'fr';
  return null;
}

function detectLanguageFromContent(content: string): SupportedLanguage {
  // Check for Khmer Unicode characters
  const khmerPattern = /[\u1780-\u17FF]/;
  if (khmerPattern.test(content)) {
    return 'km';
  }

  // Simple heuristic based on common words
  const frenchWords = (content.match(/\b(le|la|les|de|du|des|et|en|un|une)\b/gi) || []).length;
  const englishWords = (content.match(/\b(the|a|an|is|are|of|and|to|in)\b/gi) || []).length;

  if (frenchWords > englishWords * 1.5) return 'fr';
  if (englishWords > frenchWords * 1.5) return 'en';

  // Default to French (primary IFC language)
  return 'fr';
}

function cleanText(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/\n+/g, '\n')
    .trim();
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
