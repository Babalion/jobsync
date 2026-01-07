/**
 * Utilities for parsing job information from email content
 */

import { MAX_COMPANY_NAME_LENGTH, MAX_EMAIL_DESCRIPTION_LENGTH } from "./constants";

export interface ParsedJobFromEmail {
  jobTitle?: string;
  company?: string;
  location?: string;
  jobUrl?: string;
  description?: string;
  salaryRange?: string;
}

/**
 * Extracts URLs from text and HTML attributes
 */
function extractUrls(text: string): string[] {
  // Extract from href attributes
  const hrefRegex = /href=["']([^"']+)["']/g;
  const hrefMatches = [...text.matchAll(hrefRegex)].map(m => m[1]);
  
  // Extract from visible text
  const urlRegex = /https?:\/\/[^\s<>"{}|\\^`\[\]]+/g;
  const textUrls = text.match(urlRegex) || [];
  
  // Combine and deduplicate
  return Array.from(new Set([...hrefMatches, ...textUrls]));
}

/**
 * Attempts to extract job title from text
 * Looks for common patterns like "Position:", "Role:", "Job Title:", etc.
 */
function extractJobTitle(text: string): string | undefined {
  const patterns = [
    /(?:position|role|job title|title|opening):\s*([^\n]+?)(?:\n|$)/i,
    /(?:we're hiring|we are hiring|now hiring)(?:\s+a|\s+an)?\s+([A-Z][^\n]+?)(?:\s+at\s+|$)/i,
    /(?:looking for|seeking)(?:\s+a|\s+an)?\s+([^\n]+?)(?:\n|$)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      // Clean up extra whitespace and trim
      return match[1].trim().replace(/\s+/g, ' ');
    }
  }

  return undefined;
}

/**
 * Attempts to extract company name from text
 * Looks for patterns like "Company:", "at [Company]", etc.
 */
function extractCompany(text: string, fromAddress?: string): string | undefined {
  const patterns = [
    /(?:company|organization|employer):\s*([^\n]+?)(?:\n|$)/i,
    /(?:at|@)\s+([A-Z][a-zA-Z\s&]+?)(?:\s+is\s+hiring|\s+hiring|\s+seeks|\s+looking)/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim().replace(/\s+/g, ' ');
    }
  }

  // Try to extract from email address
  if (fromAddress) {
    const emailMatch = fromAddress.match(/@([^.]+)\./);
    if (emailMatch && emailMatch[1]) {
      // Capitalize first letter
      return emailMatch[1].charAt(0).toUpperCase() + emailMatch[1].slice(1);
    }
  }

  return undefined;
}

/**
 * Attempts to extract location from text
 */
function extractLocation(text: string): string | undefined {
  const patterns = [
    /(?:location|where|city|based in):\s*([^\n]+)/i,
    /(?:remote|hybrid|on-site|onsite)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1]?.trim() || match[0].trim();
    }
  }

  return undefined;
}

/**
 * Attempts to extract salary range from text
 */
function extractSalaryRange(text: string): string | undefined {
  const patterns = [
    /(?:salary|compensation|pay):\s*([^\n]+)/i,
    /\$[\d,]+\s*[-–—to]\s*\$[\d,]+/i,
    /[\d,]+k?\s*[-–—to]\s*[\d,]+k/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1]?.trim() || match[0].trim();
    }
  }

  return undefined;
}

/**
 * Parses job information from email content
 * @param emailBody The plain text or HTML email body
 * @param emailSubject Optional email subject line
 * @param fromAddress Optional sender email address
 * @returns Parsed job information
 */
export function parseJobFromEmail(
  emailBody: string,
  emailSubject?: string,
  fromAddress?: string
): ParsedJobFromEmail {
  // Combine subject and body for better parsing
  const fullText = emailSubject ? `${emailSubject}\n\n${emailBody}` : emailBody;

  // Extract URLs before removing HTML (to catch href attributes)
  const urls = extractUrls(fullText);
  const jobUrl = urls.length > 0 ? urls[0] : undefined;

  // Remove HTML tags if present, preserving newlines
  let plainText = fullText
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/h\d>/gi, '\n')
    .replace(/<[^>]*>/g, '');
  
  // Normalize spaces but preserve newlines
  plainText = plainText
    .split('\n')
    .map(line => line.replace(/\s+/g, ' ').trim())
    .filter(line => line.length > 0)
    .join('\n');

  // Extract information
  return {
    jobTitle: extractJobTitle(plainText) || emailSubject,
    company: extractCompany(plainText, fromAddress),
    location: extractLocation(plainText),
    jobUrl,
    description: emailBody.substring(0, MAX_EMAIL_DESCRIPTION_LENGTH),
    salaryRange: extractSalaryRange(plainText),
  };
}

/**
 * Parses job information from LinkedIn job alert format
 */
export function parseLinkedInJobAlert(emailBody: string): ParsedJobFromEmail {
  const parsed: ParsedJobFromEmail = {};

  // LinkedIn specific patterns
  const titleMatch = emailBody.match(/(?:Job title|Position):\s*([^\n]+)/i);
  if (titleMatch) parsed.jobTitle = titleMatch[1].trim();

  const companyMatch = emailBody.match(/(?:Company|Employer):\s*([^\n]+)/i);
  if (companyMatch) parsed.company = companyMatch[1].trim();

  const locationMatch = emailBody.match(/(?:Location):\s*([^\n]+)/i);
  if (locationMatch) parsed.location = locationMatch[1].trim();

  const urls = extractUrls(emailBody);
  const linkedInUrl = urls.find(url => url.includes('linkedin.com'));
  if (linkedInUrl) parsed.jobUrl = linkedInUrl;

  return parsed;
}

/**
 * Parses job information from Indeed job alert format
 */
export function parseIndeedJobAlert(emailBody: string): ParsedJobFromEmail {
  const parsed: ParsedJobFromEmail = {};

  // Indeed specific patterns
  const titleMatch = emailBody.match(/(?:Job Alert|New Job):\s*([^\n]+?)(?:\n|$)/i);
  if (titleMatch) parsed.jobTitle = titleMatch[1].trim();

  // More restrictive company matching - match company name followed by "is hiring"
  // The (?!\n) prevents matching across lines
  const companyMatch = emailBody.match(new RegExp(`^([A-Z][a-zA-Z\\s&]{1,${MAX_COMPANY_NAME_LENGTH}}?)\\s+is hiring`, 'im'));
  if (companyMatch) parsed.company = companyMatch[1].trim().replace(/\s+/g, ' ');

  const urls = extractUrls(emailBody);
  const indeedUrl = urls.find(url => url.includes('indeed.com'));
  if (indeedUrl) parsed.jobUrl = indeedUrl;

  return parsed;
}

/**
 * Detects the source of a job email and parses accordingly
 */
export function parseJobEmailAuto(
  emailBody: string,
  emailSubject?: string,
  fromAddress?: string
): ParsedJobFromEmail {
  // Detect source from email address or content
  if (fromAddress?.includes('linkedin.com') || emailBody.includes('linkedin.com')) {
    return parseLinkedInJobAlert(emailBody);
  }

  if (fromAddress?.includes('indeed.com') || emailBody.includes('indeed.com')) {
    return parseIndeedJobAlert(emailBody);
  }

  // Fallback to generic parser
  return parseJobFromEmail(emailBody, emailSubject, fromAddress);
}
