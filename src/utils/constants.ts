/**
 * Constants for job capture and deduplication features
 */

/**
 * Time window for duplicate job detection (in milliseconds)
 * Only jobs created within this window will be checked for duplicates
 * Default: 30 days
 */
export const DUPLICATE_CHECK_TIME_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Maximum number of recent jobs to check for duplicates
 * Limits the number of jobs fetched when checking for duplicates
 */
export const MAX_DUPLICATE_CHECK_JOBS = 50;

/**
 * Maximum length for company names in email parsing
 * Used to prevent overly greedy regex matches
 */
export const MAX_COMPANY_NAME_LENGTH = 40;

/**
 * Default job type when not specified
 */
export const DEFAULT_JOB_TYPE = "FT";

/**
 * Default status value for new jobs
 */
export const DEFAULT_JOB_STATUS = "draft";

/**
 * Maximum description length for email-ingested jobs
 */
export const MAX_EMAIL_DESCRIPTION_LENGTH = 1000;
