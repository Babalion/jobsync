/**
 * Utilities for job deduplication logic
 */

/**
 * Normalizes a URL by removing common variations
 * - Removes protocol (http/https)
 * - Removes www subdomain
 * - Removes trailing slashes
 * - Removes common query parameters (utm_*, ref, etc.)
 * - Converts to lowercase
 */
export function normalizeUrl(url: string | null | undefined): string {
  if (!url) return "";
  
  try {
    const urlObj = new URL(url);
    
    // Remove common tracking parameters
    const paramsToRemove = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'ref', 'source'];
    paramsToRemove.forEach(param => urlObj.searchParams.delete(param));
    
    // Reconstruct URL without protocol and www
    let normalized = urlObj.hostname.replace(/^www\./, '') + urlObj.pathname;
    
    // Remove trailing slashes (all of them)
    normalized = normalized.replace(/\/+$/, '');
    
    // Add back search params if any remain
    const searchString = urlObj.searchParams.toString();
    if (searchString) {
      normalized += '?' + searchString;
    }
    
    return normalized.toLowerCase();
  } catch (_error) {
    // If URL is invalid, just normalize the string
    return url.toLowerCase().trim();
  }
}

/**
 * Calculates the Levenshtein distance between two strings
 * Used for fuzzy string matching
 */
export function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix: number[][] = [];

  // Initialize matrix
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  // Fill matrix
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return matrix[len1][len2];
}

/**
 * Calculates similarity ratio between two strings (0 to 1)
 * 1 means identical, 0 means completely different
 */
export function calculateSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) {
    return 1.0;
  }
  
  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
}

/**
 * Normalizes a job title for comparison
 * - Converts to lowercase
 * - Removes extra whitespace
 * - Removes common suffixes/prefixes that don't affect the core role
 */
export function normalizeJobTitle(title: string | null | undefined): string {
  if (!title) return "";
  
  let normalized = title.toLowerCase().trim();
  
  // Replace multiple spaces with single space
  normalized = normalized.replace(/\s+/g, ' ');
  
  // Remove parenthetical content at the end
  normalized = normalized.replace(/\s+\(.*?\)$/, '');
  
  return normalized.trim();
}

/**
 * Checks if two job titles are similar enough to be considered duplicates
 * @param title1 First job title
 * @param title2 Second job title
 * @param threshold Similarity threshold (0-1), default 0.85
 */
export function areJobTitlesSimilar(
  title1: string | null | undefined,
  title2: string | null | undefined,
  threshold: number = 0.85
): boolean {
  const normalized1 = normalizeJobTitle(title1);
  const normalized2 = normalizeJobTitle(title2);
  
  if (!normalized1 || !normalized2) return false;
  
  // Exact match after normalization
  if (normalized1 === normalized2) return true;
  
  // Calculate similarity
  const similarity = calculateSimilarity(normalized1, normalized2);
  return similarity >= threshold;
}

/**
 * Checks if two URLs are similar enough to be considered duplicates
 * @param url1 First URL
 * @param url2 Second URL
 */
export function areUrlsSimilar(
  url1: string | null | undefined,
  url2: string | null | undefined
): boolean {
  const normalized1 = normalizeUrl(url1);
  const normalized2 = normalizeUrl(url2);
  
  if (!normalized1 || !normalized2) return false;
  
  return normalized1 === normalized2;
}

/**
 * Checks if a job is a potential duplicate based on multiple criteria
 * @param job1 First job
 * @param job2 Second job
 * @returns true if jobs are likely duplicates
 */
export function arePotentialDuplicates(
  job1: {
    companyId?: string;
    jobTitleValue?: string;
    jobUrl?: string | null;
  },
  job2: {
    companyId?: string;
    jobTitleValue?: string;
    jobUrl?: string | null;
  }
): boolean {
  // Must be from the same company
  if (job1.companyId !== job2.companyId) return false;
  
  // If both have URLs and they match, it's a duplicate
  if (job1.jobUrl && job2.jobUrl && areUrlsSimilar(job1.jobUrl, job2.jobUrl)) {
    return true;
  }
  
  // If job titles are very similar, consider it a duplicate
  if (areJobTitlesSimilar(job1.jobTitleValue, job2.jobTitleValue)) {
    return true;
  }
  
  return false;
}
