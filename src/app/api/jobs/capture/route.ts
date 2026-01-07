import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { getCurrentUser } from "@/utils/user.utils";
import { ensureUserExists } from "@/utils/user.ensure";
import { arePotentialDuplicates } from "@/utils/deduplication.utils";
import { 
  DUPLICATE_CHECK_TIME_WINDOW_MS, 
  MAX_DUPLICATE_CHECK_JOBS,
  DEFAULT_JOB_STATUS 
} from "@/utils/constants";

// Schema for validating incoming job capture data
const JobCaptureSchema = z.object({
  jobUrl: z.string().url().optional(),
  jobTitle: z.string().min(1, "Job title is required"),
  company: z.string().min(1, "Company name is required"),
  location: z.string().optional(),
  jobType: z.enum(["FT", "PT", "C"]).default("FT"),
  description: z.string().optional(),
  salaryRange: z.string().optional(),
  source: z.string().optional(),
});

type JobCaptureData = z.infer<typeof JobCaptureSchema>;

/**
 * POST /api/jobs/capture
 * Captures a job posting from browser extensions or external sources
 * Handles deduplication automatically
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Ensure user exists in database
    const dbUser = await ensureUserExists(user);

    // Parse and validate request body
    const body = await request.json();
    const validatedData = JobCaptureSchema.parse(body);

    // Find or create company
    const companyValue = validatedData.company.toLowerCase().trim();
    let company = await prisma.company.findUnique({
      where: {
        value_createdBy: {
          value: companyValue,
          createdBy: dbUser.id,
        },
      },
    });

    if (!company) {
      company = await prisma.company.create({
        data: {
          label: validatedData.company,
          value: companyValue,
          createdBy: dbUser.id,
        },
      });
    }

    // Find or create job title
    const jobTitleValue = validatedData.jobTitle.toLowerCase().trim();
    let jobTitle = await prisma.jobTitle.findUnique({
      where: {
        value_createdBy: {
          value: jobTitleValue,
          createdBy: dbUser.id,
        },
      },
    });

    if (!jobTitle) {
      jobTitle = await prisma.jobTitle.create({
        data: {
          label: validatedData.jobTitle,
          value: jobTitleValue,
          createdBy: dbUser.id,
        },
      });
    }

    // Find or create location (if provided)
    let locationId: string | null = null;
    if (validatedData.location) {
      const locationValue = validatedData.location.toLowerCase().trim();
      let location = await prisma.location.findUnique({
        where: {
          value_createdBy: {
            value: locationValue,
            createdBy: dbUser.id,
          },
        },
      });

      if (!location) {
        location = await prisma.location.create({
          data: {
            label: validatedData.location,
            value: locationValue,
            createdBy: dbUser.id,
          },
        });
      }
      locationId = location.id;
    }

    // Find or create job source
    let jobSourceId: string | null = null;
    if (validatedData.source) {
      const sourceValue = validatedData.source.toLowerCase().trim();
      let jobSource = await prisma.jobSource.findUnique({
        where: { value: sourceValue },
      });

      if (!jobSource) {
        // Only create if user has permission or use a default
        jobSource = await prisma.jobSource.findFirst({
          where: { value: "extension" },
        });
        
        // If no extension source exists, create it
        if (!jobSource) {
          jobSource = await prisma.jobSource.create({
            data: {
              label: "Browser Extension",
              value: "extension",
            },
          });
        }
      }
      jobSourceId = jobSource.id;
    } else {
      // Default to extension source
      let jobSource = await prisma.jobSource.findFirst({
        where: { value: "extension" },
      });
      
      if (!jobSource) {
        jobSource = await prisma.jobSource.create({
          data: {
            label: "Browser Extension",
            value: "extension",
          },
        });
      }
      jobSourceId = jobSource.id;
    }

    // Get default status (Draft)
    const defaultStatus = await prisma.jobStatus.findFirst({
      where: { value: DEFAULT_JOB_STATUS },
    });

    if (!defaultStatus) {
      return NextResponse.json(
        { error: "Default status not found. Please run database seed." },
        { status: 500 }
      );
    }

    // Check for duplicates - get recent jobs from same company
    const existingJobs = await prisma.job.findMany({
      where: {
        userId: dbUser.id,
        companyId: company.id,
        // Only check jobs from the last 30 days to improve performance
        createdAt: {
          gte: new Date(Date.now() - DUPLICATE_CHECK_TIME_WINDOW_MS),
        },
      },
      include: {
        JobTitle: true,
      },
      take: MAX_DUPLICATE_CHECK_JOBS,
    });

    // Check for potential duplicates
    for (const existingJob of existingJobs) {
      const isDuplicate = arePotentialDuplicates(
        {
          companyId: company.id,
          jobTitleValue: jobTitle.value,
          jobUrl: validatedData.jobUrl || null,
        },
        {
          companyId: existingJob.companyId,
          jobTitleValue: existingJob.JobTitle.value,
          jobUrl: existingJob.jobUrl,
        }
      );

      if (isDuplicate) {
        return NextResponse.json(
          {
            message: "Duplicate job detected",
            duplicate: true,
            existingJobId: existingJob.id,
            job: {
              id: existingJob.id,
              title: existingJob.JobTitle.label,
              company: company.label,
              createdAt: existingJob.createdAt,
            },
          },
          { status: 200 }
        );
      }
    }

    // Create the new job
    const newJob = await prisma.job.create({
      data: {
        userId: dbUser.id,
        jobTitleId: jobTitle.id,
        companyId: company.id,
        locationId: locationId,
        jobType: validatedData.jobType,
        statusId: defaultStatus.id,
        jobSourceId: jobSourceId,
        jobUrl: validatedData.jobUrl || null,
        description: validatedData.description || "",
        salaryRange: validatedData.salaryRange || null,
        applied: false,
      },
      include: {
        JobTitle: true,
        Company: true,
        Location: true,
        Status: true,
        JobSource: true,
      },
    });

    return NextResponse.json(
      {
        message: "Job captured successfully",
        duplicate: false,
        job: {
          id: newJob.id,
          title: newJob.JobTitle.label,
          company: newJob.Company.label,
          location: newJob.Location?.label,
          jobType: newJob.jobType,
          status: newJob.Status.label,
          source: newJob.JobSource?.label,
          createdAt: newJob.createdAt,
          jobUrl: newJob.jobUrl,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Job capture error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Invalid job data",
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to capture job",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
