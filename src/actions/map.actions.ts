"use server";
import prisma from "@/lib/db";
import { handleError } from "@/lib/utils";
import { getCurrentUser } from "@/utils/user.utils";
import { ensureUserExists } from "@/utils/user.ensure";

export const getJobsForMap = async (): Promise<any | undefined> => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error("Not authenticated");
    }
    const dbUser = await ensureUserExists(user);

    const jobs = await prisma.job.findMany({
      where: {
        userId: dbUser.id,
      },
      select: {
        id: true,
        createdAt: true,
        appliedDate: true,
        jobType: true,
        JobSource: true,
        JobTitle: true,
        Company: true,
        Status: true,
        Location: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return { success: true, data: jobs };
  } catch (error) {
    const msg = "Failed to fetch jobs for map. ";
    return handleError(error, msg);
  }
};

export const getCompaniesForMap = async (): Promise<any | undefined> => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error("Not authenticated");
    }
    const dbUser = await ensureUserExists(user);

    const companies = await prisma.company.findMany({
      where: {
        createdBy: dbUser.id,
      },
      include: {
        locations: {
          include: { location: true },
        },
      },
      orderBy: { label: "asc" },
    });

    return { success: true, data: companies };
  } catch (error) {
    const msg = "Failed to fetch companies for map. ";
    return handleError(error, msg);
  }
};
