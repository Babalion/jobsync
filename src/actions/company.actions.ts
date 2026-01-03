"use server";
import prisma from "@/lib/db";
import { handleError } from "@/lib/utils";
import { AddCompanyFormSchema } from "@/models/addCompanyForm.schema";
import { getCurrentUser } from "@/utils/user.utils";
import { ensureUserExists } from "@/utils/user.ensure";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const getFaviconFromUrl = (siteUrl?: string) => {
  if (!siteUrl) return "";
  try {
    const url = siteUrl.match(/^https?:\/\//)
      ? new URL(siteUrl)
      : new URL(`https://${siteUrl}`);
    return `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=64`;
  } catch {
    return "";
  }
};

export const getCompanyList = async (
  page = 1,
  limit?: number | null,
  countBy?: string
): Promise<any | undefined> => {
  try {
    const user = await getCurrentUser();

    if (!user) {
      throw new Error("Not authenticated");
    }
    const dbUser = await ensureUserExists(user);
    const skip = limit ? (page - 1) * limit : undefined;

    const [data, total] = await Promise.all([
      prisma.company.findMany({
        where: {
          createdBy: dbUser.id,
        },
        ...(skip != null ? { skip } : {}),
        ...(limit != null ? { take: limit } : {}),
        ...(countBy
          ? {
              select: {
                id: true,
                label: true,
                value: true,
                logoUrl: true,
                website: true,
                careerSite: true,
                archetype: true,
                ownership: true,
                cultureTag: true,
                industryRole: true,
                innovationLevel: true,
                country: true,
                summary: true,
                fitNotes: true,
                hasWorksCouncil: true,
                hasCollectiveAgreement: true,
                locations: {
                  include: { location: true },
                },
                _count: {
                  select: {
                    jobsApplied: {
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
          jobsApplied: {
            _count: "desc",
          },
        },
      }),
      prisma.company.count({
        where: {
          createdBy: dbUser.id,
        },
      }),
    ]);
    return { data, total };
  } catch (error) {
    const msg = "Failed to fetch company list. ";
    return handleError(error, msg);
  }
};

export const getAllCompanies = async (): Promise<any | undefined> => {
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
    });
    return companies;
  } catch (error) {
    const msg = "Failed to fetch all companies. ";
    return handleError(error, msg);
  }
};

export const addCompany = async (
  data: z.infer<typeof AddCompanyFormSchema>
): Promise<any | undefined> => {
  try {
    const user = await getCurrentUser();

    if (!user) {
      throw new Error("Not authenticated");
    }
    const dbUser = await ensureUserExists(user);

    const {
      company,
      companyUrl,
      careerSite,
      archetype,
      ownership,
      industryRole,
      innovationLevel,
      cultureTag,
      country,
      summary,
      fitNotes,
      hasWorksCouncil,
      hasCollectiveAgreement,
      locations,
    } = data;

    const value = company.trim().toLowerCase();
    const website = companyUrl?.trim() || undefined;

    const companyExists = await prisma.company.findUnique({
      where: {
        value_createdBy: {
          value,
          createdBy: dbUser.id,
        },
      },
    });

    if (companyExists) {
      throw new Error("Company already exists!");
    }

    const finalLogo = getFaviconFromUrl(website) || undefined;

    const optionalFields: Record<string, string | boolean | undefined> = {
      logoUrl: finalLogo,
      website,
      careerSite: careerSite?.trim() || undefined,
      archetype: archetype?.trim() || undefined,
      ownership: ownership?.trim() || undefined,
      industryRole: industryRole?.trim() || undefined,
      innovationLevel: innovationLevel?.trim() || undefined,
      cultureTag: cultureTag?.trim() || undefined,
      country: country?.trim() || undefined,
      summary: summary?.trim() || undefined,
      fitNotes: fitNotes?.trim() || undefined,
      hasWorksCouncil: hasWorksCouncil ?? false,
      hasCollectiveAgreement: hasCollectiveAgreement ?? false,
    };

    const locationIds =
      locations?.filter(Boolean).filter((v, idx, arr) => arr.indexOf(v) === idx) ||
      [];

    const res = await prisma.company.create({
      data: {
        createdBy: dbUser.id,
        value,
        label: company,
        ...optionalFields,
        locations:
          locationIds.length > 0
            ? {
                create: locationIds.map((locId) => ({
                  location: { connect: { id: locId } },
                })),
              }
            : undefined,
      },
    });
    revalidatePath("/dashboard/myjobs", "page");
    return { success: true, data: res };
  } catch (error) {
    const msg = "Failed to create company.";
    return handleError(error, msg);
  }
};

export const updateCompany = async (
  data: z.infer<typeof AddCompanyFormSchema>
): Promise<any | undefined> => {
  try {
    const user = await getCurrentUser();

    if (!user) {
      throw new Error("Not authenticated");
    }
    const dbUser = await ensureUserExists(user);

    const {
      id,
      company,
      companyUrl,
      careerSite,
      createdBy,
      archetype,
      ownership,
      industryRole,
      innovationLevel,
      cultureTag,
      country,
      summary,
      fitNotes,
      hasWorksCouncil,
      hasCollectiveAgreement,
      locations,
    } = data;

    if (!id || dbUser.id != createdBy) {
      throw new Error("Id is not provided or no user privilages");
    }

    const value = company.trim().toLowerCase();
    const website = companyUrl?.trim() || undefined;

    const companyExists = await prisma.company.findUnique({
      where: {
        value_createdBy: {
          value,
          createdBy: dbUser.id,
        },
      },
    });

    if (companyExists && companyExists.id !== id) {
      throw new Error("Company already exists!");
    }

    const optionalFields: Record<string, string | boolean | undefined> = {
      logoUrl: getFaviconFromUrl(website) || undefined,
      website,
      careerSite: careerSite?.trim() || undefined,
      archetype: archetype?.trim() || undefined,
      ownership: ownership?.trim() || undefined,
      industryRole: industryRole?.trim() || undefined,
      innovationLevel: innovationLevel?.trim() || undefined,
      cultureTag: cultureTag?.trim() || undefined,
      country: country?.trim() || undefined,
      summary: summary?.trim() || undefined,
      fitNotes: fitNotes?.trim() || undefined,
      hasWorksCouncil: hasWorksCouncil ?? false,
      hasCollectiveAgreement: hasCollectiveAgreement ?? false,
    };

    const locationIds =
      locations?.filter(Boolean).filter((v, idx, arr) => arr.indexOf(v) === idx) ||
      [];

    const res = await prisma.company.update({
      where: {
        id,
      },
      data: {
        value,
        label: company,
        ...optionalFields,
        locations: {
          deleteMany: {},
          ...(locationIds.length > 0
            ? {
                create: locationIds.map((locId) => ({
                  location: { connect: { id: locId } },
                })),
              }
            : {}),
        },
      },
    });

    return { success: true, data: res };
  } catch (error) {
    const msg = "Failed to update company.";
    return handleError(error, msg);
  }
};

export const getCompanyById = async (
  companyId: string
): Promise<any | undefined> => {
  try {
    if (!companyId) {
      throw new Error("Please provide company id");
    }
    const user = await getCurrentUser();

    if (!user) {
      throw new Error("Not authenticated");
    }

    const company = await prisma.company.findUnique({
      where: {
        id: companyId,
      },
      include: {
        locations: {
          include: { location: true },
        },
      },
    });
    return company;
  } catch (error) {
    const msg = "Failed to fetch company by Id. ";
    console.error(msg);
    if (error instanceof Error) {
      return { success: false, message: error.message };
    }
  }
};

export const deleteCompanyById = async (
  companyId: string
): Promise<any | undefined> => {
  try {
    const user = await getCurrentUser();

    if (!user) {
      throw new Error("Not authenticated");
    }

    const jobs = await prisma.job.count({
      where: {
        companyId,
      },
    });

    if (jobs > 0) {
      throw new Error(
        `Company cannot be deleted due to ${jobs} number of associated jobs! `
      );
    }

    const res = await prisma.company.delete({
      where: {
        id: companyId,
        createdBy: user.id,
      },
    });
    return { res, success: true };
  } catch (error) {
    const msg = "Failed to delete company.";
    return handleError(error, msg);
  }
};
