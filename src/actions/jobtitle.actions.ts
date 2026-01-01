"use server";
import prisma from "@/lib/db";
import { handleError } from "@/lib/utils";
import { getCurrentUser } from "@/utils/user.utils";
import { ensureUserExists } from "@/utils/user.ensure";

export const getAllJobTitles = async (): Promise<any | undefined> => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error("Not authenticated");
    }
    const dbUser = await ensureUserExists(user);
    const list = await prisma.jobTitle.findMany({
      where: {
        createdBy: dbUser.id,
      },
    });
    return list;
  } catch (error) {
    const msg = "Failed to fetch job title list. ";
    return handleError(error, msg);
  }
};

export const getJobTitleList = async (
  page = 1,
  limit = 10,
  countBy?: string
): Promise<any | undefined> => {
  try {
    const user = await getCurrentUser();

    if (!user) {
      throw new Error("Not authenticated");
    }
    const dbUser = await ensureUserExists(user);
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      prisma.jobTitle.findMany({
        where: {
          createdBy: dbUser.id,
        },
        skip,
        take: limit,
        ...(countBy
          ? {
              select: {
                id: true,
                label: true,
                value: true,
                _count: {
                  select: {
                    jobs: {
                      where: {
                        applied: true,
                      },
                    },
                  },
                },
              },
            }
          : {}),
        orderBy: {
          jobs: {
            _count: "desc",
          },
        },
      }),
      prisma.jobTitle.count({
        where: {
          createdBy: dbUser.id,
        },
      }),
    ]);
    return { data, total };
  } catch (error) {
    const msg = "Failed to fetch job title list. ";
    return handleError(error, msg);
  }
};

export const createJobTitle = async (
  label: string
): Promise<any | undefined> => {
  try {
    const user = await getCurrentUser();

    if (!user) {
      throw new Error("Not authenticated");
    }
    const dbUser = await ensureUserExists(user);

    const value = label.trim().toLowerCase();

    const upsertedTitle = await prisma.jobTitle.upsert({
      where: { value_createdBy: { value, createdBy: dbUser.id } },
      update: { label },
      create: { label, value, createdBy: dbUser.id },
    });

    return upsertedTitle;
  } catch (error) {
    const msg = "Failed to create job title. ";
    return handleError(error, msg);
  }
};

export const deleteJobTitleById = async (
  jobTitleId: string
): Promise<any | undefined> => {
  try {
    const user = await getCurrentUser();

    if (!user) {
      throw new Error("Not authenticated");
    }

    const jobs = await prisma.job.count({
      where: {
        jobTitleId,
      },
    });

    if (jobs > 0) {
      throw new Error(
        `Job title cannot be deleted due to ${jobs} number of associated jobs! `
      );
    }

    const res = await prisma.jobTitle.delete({
      where: {
        id: jobTitleId,
        createdBy: user.id,
      },
    });
    return { res, success: true };
  } catch (error) {
    const msg = "Failed to delete job title.";
    return handleError(error, msg);
  }
};
