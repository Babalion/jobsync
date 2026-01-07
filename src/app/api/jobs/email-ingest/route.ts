import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { getCurrentUser } from "@/utils/user.utils";
import { ensureUserExists } from "@/utils/user.ensure";
import { parseJobEmailAuto } from "@/utils/email-parser.utils";
import { arePotentialDuplicates } from "@/utils/deduplication.utils";

// Schema for validating incoming email data
const EmailIngestSchema = z.object({
  emailBody: z.string().min(1, "Email body is required"),
  emailSubject: z.string().optional(),
  fromAddress: z.string().email().optional(),
});

type EmailIngestData = z.infer<typeof EmailIngestSchema>;

/**
 * POST /api/jobs/email-ingest
 * Ingests job postings from email content (e.g., job alerts, newsletters)
 * Parses the email and creates a job entry
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
    const validatedData = EmailIngestSchema.parse(body);

    // Parse job information from email
    const parsedJob = parseJobEmailAuto(
      validatedData.emailBody,
      validatedData.emailSubject,
      validatedData.fromAddress
    );

    // Validate that we have at least a job title and company
    if (!parsedJob.jobTitle) {
      return NextResponse.json(
        {
          error: "Unable to extract job information",
          message: "Could not extract job title from email content",
          parsedData: parsedJob,
        },
        { status: 400 }
      );
    }

    // Use a default company if none found
    const companyName = parsedJob.company || "Unknown Company";

    // Find or create company
    const companyValue = companyName.toLowerCase().trim();
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
          label: companyName,
          value: companyValue,
          createdBy: dbUser.id,
        },
      });
    }

    // Find or create job title
    const jobTitleValue = parsedJob.jobTitle.toLowerCase().trim();
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
          label: parsedJob.jobTitle,
          value: jobTitleValue,
          createdBy: dbUser.id,
        },
      });
    }

    // Find or create location (if provided)
    let locationId: string | null = null;
    if (parsedJob.location) {
      const locationValue = parsedJob.location.toLowerCase().trim();
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
            label: parsedJob.location,
            value: locationValue,
            createdBy: dbUser.id,
          },
        });
      }
      locationId = location.id;
    }

    // Find or create email source
    let jobSource = await prisma.jobSource.findFirst({
      where: { value: "email" },
    });

    if (!jobSource) {
      jobSource = await prisma.jobSource.create({
        data: {
          label: "Email Alert",
          value: "email",
        },
      });
    }

    // Get default status (Draft)
    const defaultStatus = await prisma.jobStatus.findFirst({
      where: { value: "draft" },
    });

    if (!defaultStatus) {
      return NextResponse.json(
        { error: "Default status not found. Please run database seed." },
        { status: 500 }
      );
    }

    // Check for duplicates
    const existingJobs = await prisma.job.findMany({
      where: {
        userId: dbUser.id,
        companyId: company.id,
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
      include: {
        JobTitle: true,
      },
      take: 50,
    });

    // Check for potential duplicates
    for (const existingJob of existingJobs) {
      const isDuplicate = arePotentialDuplicates(
        {
          companyId: company.id,
          jobTitleValue: jobTitle.value,
          jobUrl: parsedJob.jobUrl || null,
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
            message: "Duplicate job detected from email",
            duplicate: true,
            existingJobId: existingJob.id,
            parsedData: parsedJob,
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
        jobType: "FT", // Default to full-time
        statusId: defaultStatus.id,
        jobSourceId: jobSource.id,
        jobUrl: parsedJob.jobUrl || null,
        description: parsedJob.description || "",
        salaryRange: parsedJob.salaryRange || null,
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
        message: "Job ingested successfully from email",
        duplicate: false,
        parsedData: parsedJob,
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
    console.error("Email ingest error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Invalid email data",
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to ingest job from email",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
