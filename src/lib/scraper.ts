/**
 * Utilities for scraping and parsing job posting data from URLs
 */

export interface ScrapedJobData {
  title?: string;
  company?: string;
  location?: string;
  description?: string;
  url: string;
  logoUrl?: string;
  salaryRange?: string;
}

/**
 * Extract OpenGraph metadata from HTML
 */
export function extractOpenGraphData(html: string): Partial<ScrapedJobData> {
  const data: Partial<ScrapedJobData> = {};

  // Extract og:title
  const titleMatch = html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i);
  if (titleMatch) {
    data.title = titleMatch[1];
  }

  // Extract og:description
  const descMatch = html.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i);
  if (descMatch) {
    data.description = descMatch[1];
  }

  // Extract og:image
  const imageMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i);
  if (imageMatch) {
    data.logoUrl = imageMatch[1];
  }

  // Extract og:site_name (often the company name)
  const siteMatch = html.match(/<meta\s+property=["']og:site_name["']\s+content=["']([^"']+)["']/i);
  if (siteMatch) {
    data.company = siteMatch[1];
  }

  return data;
}

/**
 * Extract basic HTML metadata
 */
export function extractBasicMetadata(html: string): Partial<ScrapedJobData> {
  const data: Partial<ScrapedJobData> = {};

  // Extract page title
  const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
  if (titleMatch) {
    data.title = titleMatch[1].trim();
  }

  // Extract meta description
  const descMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
  if (descMatch) {
    data.description = descMatch[1];
  }

  return data;
}

/**
 * Attempt to extract job-specific structured data (JSON-LD)
 */
export function extractStructuredData(html: string): Partial<ScrapedJobData> {
  const data: Partial<ScrapedJobData> = {};

  // Look for JSON-LD JobPosting schema
  const jsonLdMatch = html.match(/<script\s+type=["']application\/ld\+json["'][^>]*>([^<]+)<\/script>/gi);
  
  if (jsonLdMatch) {
    for (const script of jsonLdMatch) {
      try {
        const jsonContent = script.replace(/<script[^>]*>|<\/script>/gi, '').trim();
        const parsed = JSON.parse(jsonContent);
        
        // Handle both single objects and arrays
        const items = Array.isArray(parsed) ? parsed : [parsed];
        
        for (const item of items) {
          if (item['@type'] === 'JobPosting') {
            if (item.title) data.title = item.title;
            if (item.description) data.description = item.description;
            if (item.hiringOrganization?.name) data.company = item.hiringOrganization.name;
            if (item.hiringOrganization?.logo) data.logoUrl = item.hiringOrganization.logo;
            if (item.jobLocation?.address?.addressLocality || item.jobLocation?.address?.addressRegion) {
              const locality = item.jobLocation?.address?.addressLocality || '';
              const region = item.jobLocation?.address?.addressRegion || '';
              data.location = [locality, region].filter(Boolean).join(', ');
            }
            if (item.baseSalary?.value) {
              data.salaryRange = String(item.baseSalary.value);
            }
          }
        }
      } catch (e) {
        // Skip invalid JSON-LD
        continue;
      }
    }
  }

  return data;
}

/**
 * Scrape job data from HTML content
 */
export function parseJobFromHtml(html: string, url: string): ScrapedJobData {
  // Try multiple extraction methods and merge results
  const structured = extractStructuredData(html);
  const openGraph = extractOpenGraphData(html);
  const basic = extractBasicMetadata(html);

  // Merge data with priority: structured > openGraph > basic
  return {
    url,
    ...basic,
    ...openGraph,
    ...structured,
  };
}

/**
 * Fetch and parse job data from a URL
 */
export async function scrapeJobFromUrl(url: string): Promise<ScrapedJobData> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    return parseJobFromHtml(html, url);
  } catch (error) {
    console.error('Error scraping job from URL:', error);
    // Return minimal data with just the URL
    return {
      url,
      title: undefined,
      company: undefined,
      location: undefined,
      description: undefined,
    };
  }
}
