"use server";
import prisma from "@/lib/db";
import { handleError } from "@/lib/utils";
import { scrapeJobFromUrl, ScrapedJobData } from "@/lib/scraper";
import { getCurrentUser } from "@/utils/user.utils";
import { ensureUserExists } from "@/utils/user.ensure";

export interface CaptureJobInput {
  url: string;
  scrapedData?: ScrapedJobData;
}

export interface CaptureJobResult {
  success: boolean;
  message: string;
  jobId?: string;
  isDuplicate?: boolean;
  existingJobId?: string;
}

/**
 * Normalize text for comparison (lowercase, trim, remove extra spaces)
 */
function normalizeText(text: string | undefined): string {
  if (!text) return '';
  return text.toLowerCase().trim().replace(/\s+/g, ' ');
}

/**
 * Check if a job already exists based on URL, company, and title
 */
async function findDuplicateJob(
  userId: string,
  url: string,
  company?: string,
  title?: string
): Promise<string | null> {
  try {
    // First check by URL (exact match)
    if (url) {
      const jobByUrl = await prisma.job.findFirst({
        where: {
          userId,
          jobUrl: url,
        },
        select: { id: true },
      });

      if (jobByUrl) {
        return jobByUrl.id;
      }
    }

    // Check by company and title (normalized match)
    if (company && title) {
      const normalizedCompany = normalizeText(company);
      const normalizedTitle = normalizeText(title);

      // Get all jobs for user to check fuzzy matches
      const userJobs = await prisma.job.findMany({
        where: { userId },
        select: {
          id: true,
          Company: { select: { label: true, value: true } },
          JobTitle: { select: { label: true, value: true } },
        },
      });

      // Check for fuzzy match on company and title
      for (const job of userJobs) {
        const jobCompany = normalizeText(job.Company.label);
        const jobTitle = normalizeText(job.JobTitle.label);

        if (jobCompany === normalizedCompany && jobTitle === normalizedTitle) {
          return job.id;
        }
      }
    }

    return null;
  } catch (error) {
    console.error('Error checking for duplicate job:', error);
    return null;
  }
}

/**
 * Find or create a company by name
 */
async function findOrCreateCompany(userId: string, companyName: string) {
  const normalizedValue = companyName.toLowerCase().replace(/\s+/g, '-');
  
  // Try to find existing company
  const existing = await prisma.company.findFirst({
    where: {
      createdBy: userId,
      OR: [
        { label: companyName },
        { value: normalizedValue },
      ],
    },
  });

  if (existing) {
    return existing;
  }

  // Create new company
  return await prisma.company.create({
    data: {
      label: companyName,
      value: normalizedValue,
      createdBy: userId,
    },
  });
}

/**
 * Find or create a job title by name
 */
async function findOrCreateJobTitle(userId: string, titleName: string) {
  const normalizedValue = titleName.toLowerCase().replace(/\s+/g, '-');
  
  // Try to find existing title
  const existing = await prisma.jobTitle.findFirst({
    where: {
      createdBy: userId,
      OR: [
        { label: titleName },
        { value: normalizedValue },
      ],
    },
  });

  if (existing) {
    return existing;
  }

  // Create new title
  return await prisma.jobTitle.create({
    data: {
      label: titleName,
      value: normalizedValue,
      createdBy: userId,
    },
  });
}

/**
 * Find or create a location by name
 */
async function findOrCreateLocation(userId: string, locationName: string) {
  const normalizedValue = locationName.toLowerCase().replace(/\s+/g, '-');
  
  // Try to find existing location
  const existing = await prisma.location.findFirst({
    where: {
      createdBy: userId,
      OR: [
        { label: locationName },
        { value: normalizedValue },
      ],
    },
  });

  if (existing) {
    return existing;
  }

  // Create new location
  return await prisma.location.create({
    data: {
      label: locationName,
      value: normalizedValue,
      createdBy: userId,
    },
  });
}

/**
 * Capture a job from URL or scraped data
 */
export async function captureJob(input: CaptureJobInput): Promise<CaptureJobResult> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return {
        success: false,
        message: "Not authenticated",
      };
    }

    const dbUser = await ensureUserExists(user);

    // Get scraped data (either provided or fetch it)
    const scrapedData = input.scrapedData || await scrapeJobFromUrl(input.url);

    // Check for duplicates
    const duplicateId = await findDuplicateJob(
      dbUser.id,
      input.url,
      scrapedData.company,
      scrapedData.title
    );

    if (duplicateId) {
      return {
        success: false,
        message: "Job already exists in your list",
        isDuplicate: true,
        existingJobId: duplicateId,
      };
    }

    // Get default/draft status
    const draftStatus = await prisma.jobStatus.findFirst({
      where: { value: 'draft' },
    });

    if (!draftStatus) {
      return {
        success: false,
        message: "Default status not found. Please seed the database.",
      };
    }

    // Get or create browser extension source
    let browserSource = await prisma.jobSource.findFirst({
      where: { value: 'browser-extension' },
    });

    if (!browserSource) {
      browserSource = await prisma.jobSource.create({
        data: {
          label: 'Browser Extension',
          value: 'browser-extension',
        },
      });
    }

    // Prepare job data with fallbacks
    const companyName = scrapedData.company || 'Unknown Company';
    const titleName = scrapedData.title || 'Unknown Position';
    const locationName = scrapedData.location || 'Remote';
    const description = scrapedData.description || 'Job captured from: ' + input.url;

    // Find or create related entities
    const company = await findOrCreateCompany(dbUser.id, companyName);
    const jobTitle = await findOrCreateJobTitle(dbUser.id, titleName);
    const location = await findOrCreateLocation(dbUser.id, locationName);

    // Create the job
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7); // Default 7 days due date

    const job = await prisma.job.create({
      data: {
        userId: dbUser.id,
        jobUrl: input.url,
        description,
        jobType: 'FT', // Default to full-time
        statusId: draftStatus.id,
        jobTitleId: jobTitle.id,
        companyId: company.id,
        locationId: location.id,
        jobSourceId: browserSource.id,
        applied: false,
        dueDate,
      },
    });

    return {
      success: true,
      message: "Job captured successfully",
      jobId: job.id,
    };
  } catch (error) {
    const msg = "Failed to capture job. ";
    return handleError(error, msg);
  }
}

/**
 * Get captured job preview without saving
 */
export async function previewCapturedJob(url: string): Promise<ScrapedJobData | { error: string }> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { error: "Not authenticated" };
    }

    const scrapedData = await scrapeJobFromUrl(url);
    return scrapedData;
  } catch (error) {
    console.error('Error previewing captured job:', error);
    return {
      error: error instanceof Error ? error.message : "Failed to preview job",
    };
  }
}
