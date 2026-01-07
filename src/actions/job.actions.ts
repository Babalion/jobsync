"use server";
import prisma from "@/lib/db";
import { handleError } from "@/lib/utils";
import { AddJobFormSchema } from "@/models/addJobForm.schema";
import { JOB_TYPES, JobStatus } from "@/models/job.model";
import { geocodeLocation } from "@/lib/geocode";
import { getCurrentUser } from "@/utils/user.utils";
import { ensureUserExists } from "@/utils/user.ensure";
import { arePotentialDuplicates } from "@/utils/deduplication.utils";
import { DUPLICATE_CHECK_TIME_WINDOW_MS, MAX_DUPLICATE_CHECK_JOBS } from "@/utils/constants";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export const getStatusList = async (): Promise<any | undefined> => {
  try {
    const statuses = await prisma.jobStatus.findMany();
    return statuses;
  } catch (error) {
    const msg = "Failed to fetch status list. ";
    return handleError(error, msg);
  }
};

export const getJobSourceList = async (): Promise<any | undefined> => {
  try {
    const list = await prisma.jobSource.findMany();
    return list;
  } catch (error) {
    const msg = "Failed to fetch job source list. ";
    return handleError(error, msg);
  }
};

export const getJobsList = async (
  page = 1,
  limit?: number | null,
  filter?: string
): Promise<any | undefined> => {
  try {
    const user = await getCurrentUser();

    if (!user) {
      throw new Error("Not authenticated");
    }
    const dbUser = await ensureUserExists(user);
    const skip = limit ? (page - 1) * limit : undefined;

    const filterBy = filter
      ? filter === Object.keys(JOB_TYPES)[1]
        ? {
            jobType: filter,
          }
        : {
            Status: {
              value: filter,
            },
          }
      : {};
    const [data, total] = await Promise.all([
      prisma.job.findMany({
        where: {
          userId: dbUser.id,
          ...filterBy,
        },
        ...(skip != null ? { skip } : {}),
        ...(limit != null ? { take: limit } : {}),
        select: {
          id: true,
          createdAt: true,
          JobSource: true,
          JobTitle: true,
          jobType: true,
          Company: true,
          Status: true,
          Location: true,
          dueDate: true,
          appliedDate: true,
          description: false,
        },
        orderBy: {
          createdAt: "desc",
          // appliedDate: "desc",
        },
      }),
      prisma.job.count({
        where: {
          userId: dbUser.id,
          ...filterBy,
        },
      }),
    ]);
    return { success: true, data, total };
  } catch (error) {
    const msg = "Failed to fetch jobs list. ";
    return handleError(error, msg);
  }
};

export async function* getJobsIterator(filter?: string, pageSize = 200) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Not authenticated");
  }
  let page = 1;
  let fetchedCount = 0;

  while (true) {
    const skip = (page - 1) * pageSize;
    const filterBy = filter
      ? filter === Object.keys(JOB_TYPES)[1]
        ? { status: filter }
        : { type: filter }
      : {};

    const chunk = await prisma.job.findMany({
      where: {
        userId: user.id,
        ...filterBy,
      },
      select: {
        id: true,
        createdAt: true,
        JobSource: true,
        JobTitle: true,
        jobType: true,
        Company: true,
        Status: true,
        Location: true,
        dueDate: true,
        applied: true,
        appliedDate: true,
      },
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
    });

    if (!chunk.length) {
      break;
    }

    yield chunk;
    fetchedCount += chunk.length;
    page++;
  }
}

export const getJobDetails = async (
  jobId: string
): Promise<any | undefined> => {
  try {
    if (!jobId) {
      throw new Error("Please provide job id");
    }
    const user = await getCurrentUser();

    if (!user) {
      throw new Error("Not authenticated");
    }

    const job = await prisma.job.findUnique({
      where: {
        id: jobId,
      },
      include: {
        JobSource: true,
        JobTitle: true,
        Company: true,
        Status: true,
        Location: true,
      },
    });
    return { job, success: true };
  } catch (error) {
    const msg = "Failed to fetch job details. ";
    return handleError(error, msg);
  }
};

export const createLocation = async (
  label: string,
  zipCode?: string,
  country?: string
): Promise<any | undefined> => {
  try {
    const user = await getCurrentUser();

    if (!user) {
      throw new Error("Not authenticated");
    }
    const dbUser = await ensureUserExists(user);

    const value = label.trim().toLowerCase();
    const finalZip = (zipCode || "").trim().toLowerCase();
    const finalCountry = (country || "").trim().toLowerCase();
    const uniqueValue = [value, finalZip || finalCountry]
      .filter(Boolean)
      .join("-")
      .replace(/\s+/g, "-");

    if (!value) {
      throw new Error("Please provide location name");
    }

  const { lat, lng } =
    (await geocodeLocation({
      city: label,
      zipCode: zipCode || undefined,
      country,
    })) || {};

  const existing = await prisma.location.findFirst({
    where: {
      value: uniqueValue || value,
      createdBy: dbUser.id,
      },
    });
    if (existing) {
      return { data: existing, success: true };
    }

    const location = await prisma.location.create({
      data: {
        label,
        value: uniqueValue || value,
        zipCode: finalZip || null,
        country: finalCountry || null,
        lat: lat ?? null,
        lng: lng ?? null,
        createdBy: dbUser.id,
      },
    });

    return { data: location, success: true };
  } catch (error) {
    const msg = "Failed to create job location. ";
    return handleError(error, msg);
  }
};

export const addJob = async (
  data: z.infer<typeof AddJobFormSchema>
): Promise<any | undefined> => {
  try {
    const user = await getCurrentUser();

    if (!user) {
      throw new Error("Not authenticated");
    }
    const dbUser = await ensureUserExists(user);

    const {
      title,
      company,
      location,
      type,
      status,
      source,
      salaryRange,
      dueDate,
      dateApplied,
      jobDescription,
      jobUrl,
      applied,
    } = data;

    const job = await prisma.job.create({
      data: {
        jobTitleId: title,
        companyId: company,
        locationId: location,
        statusId: status,
        jobSourceId: source,
        salaryRange: salaryRange,
        createdAt: new Date(),
        dueDate: dueDate,
        appliedDate: dateApplied,
        description: jobDescription,
        jobType: type,
        userId: dbUser.id,
        jobUrl,
        applied,
      },
    });
    return { job, success: true };
  } catch (error) {
    const msg = "Failed to create job. ";
    return handleError(error, msg);
  }
};

export const updateJob = async (
  data: z.infer<typeof AddJobFormSchema>
): Promise<any | undefined> => {
  try {
    const user = await getCurrentUser();

    if (!user) {
      throw new Error("Not authenticated");
    }
    const dbUser = await ensureUserExists(user);

    if (!data.id || dbUser.id != data.userId) {
      throw new Error("Id is not provide or no user privilages");
    }

    const {
      id,
      title,
      company,
      location,
      type,
      status,
      source,
      salaryRange,
      dueDate,
      dateApplied,
      jobDescription,
      jobUrl,
      applied,
    } = data;

    const job = await prisma.job.update({
      where: {
        id,
      },
      data: {
        jobTitleId: title,
        companyId: company,
        locationId: location,
        statusId: status,
        jobSourceId: source,
        salaryRange: salaryRange,
        dueDate: dueDate,
        appliedDate: dateApplied,
        description: jobDescription,
        jobType: type,
        jobUrl,
        applied,
      },
    });
    // revalidatePath("/dashboard/myjobs", "page");
    return { job, success: true };
  } catch (error) {
    const msg = "Failed to update job. ";
    return handleError(error, msg);
  }
};

export const updateJobStatus = async (
  jobId: string,
  status: JobStatus
): Promise<any | undefined> => {
  try {
    const user = await getCurrentUser();

    if (!user) {
      throw new Error("Not authenticated");
    }
    const dbUser = await ensureUserExists(user);
    const dataToUpdate = () => {
      switch (status.value) {
        case "applied":
          return {
            statusId: status.id,
            applied: true,
            appliedDate: new Date(),
          };
        case "interview":
          return {
            statusId: status.id,
            applied: true,
          };
        default:
          return {
            statusId: status.id,
          };
      }
    };

    const job = await prisma.job.update({
      where: {
        id: jobId,
        userId: dbUser.id,
      },
      data: dataToUpdate(),
    });
    return { job, success: true };
  } catch (error) {
    const msg = "Failed to update job status.";
    return handleError(error, msg);
  }
};

export const deleteJobById = async (
  jobId: string
): Promise<any | undefined> => {
  try {
    const user = await getCurrentUser();

    if (!user) {
      throw new Error("Not authenticated");
    }

    const res = await prisma.job.delete({
      where: {
        id: jobId,
        userId: user.id,
      },
    });
    return { res, success: true };
  } catch (error) {
    const msg = "Failed to delete job.";
    return handleError(error, msg);
  }
};

/**
 * Finds potential duplicate jobs for a given job
 * @param companyId The company ID
 * @param jobTitleValue The normalized job title value
 * @param jobUrl Optional job URL
 * @returns Array of potential duplicate jobs
 */
export const findDuplicateJobs = async (
  companyId: string,
  jobTitleValue: string,
  jobUrl?: string | null
): Promise<any> => {
  try {
    const user = await getCurrentUser();

    if (!user) {
      throw new Error("Not authenticated");
    }

    const dbUser = await ensureUserExists(user);

    // Get recent jobs from the same company (last 30 days)
    const existingJobs = await prisma.job.findMany({
      where: {
        userId: dbUser.id,
        companyId: companyId,
        createdAt: {
          gte: new Date(Date.now() - DUPLICATE_CHECK_TIME_WINDOW_MS),
        },
      },
      include: {
        JobTitle: true,
        Company: true,
      },
      take: MAX_DUPLICATE_CHECK_JOBS,
    });

    const duplicates = [];

    for (const existingJob of existingJobs) {
      const isDuplicate = arePotentialDuplicates(
        {
          companyId,
          jobTitleValue,
          jobUrl: jobUrl || null,
        },
        {
          companyId: existingJob.companyId,
          jobTitleValue: existingJob.JobTitle.value,
          jobUrl: existingJob.jobUrl,
        }
      );

      if (isDuplicate) {
        duplicates.push({
          id: existingJob.id,
          title: existingJob.JobTitle.label,
          company: existingJob.Company.label,
          createdAt: existingJob.createdAt,
          jobUrl: existingJob.jobUrl,
        });
      }
    }

    return { success: true, duplicates };
  } catch (error) {
    const msg = "Failed to find duplicate jobs.";
    return handleError(error, msg);
  }
};
