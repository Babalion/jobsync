"use server";
import prisma from "@/lib/db";
import { handleError } from "@/lib/utils";
import { geocodeLocation } from "@/lib/geocode";
import { getCurrentUser } from "@/utils/user.utils";
import { ensureUserExists } from "@/utils/user.ensure";

export const getAllJobLocations = async (): Promise<any | undefined> => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error("Not authenticated");
    }
    const dbUser = await ensureUserExists(user);
    const list = await prisma.location.findMany({
      where: { createdBy: dbUser.id },
    });
    return list;
  } catch (error) {
    const msg = "Failed to fetch job location list. ";
    return handleError(error, msg);
  }
};

export const getJobLocationsList = async (
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
      prisma.location.findMany({
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
                zipCode: true,
                country: true,
                lat: true,
                lng: true,
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
      prisma.location.count({
        where: {
          createdBy: dbUser.id,
        },
      }),
    ]);
    return { data, total };
  } catch (error) {
    const msg = "Failed to fetch job location list. ";
    return handleError(error, msg);
  }
};

export const deleteJobLocationById = async (
  locationId: string
): Promise<any | undefined> => {
  try {
    const user = await getCurrentUser();

    if (!user) {
      throw new Error("Not authenticated");
    }

    const jobs = await prisma.job.count({
      where: {
        locationId,
      },
    });

    if (jobs > 0) {
      throw new Error(
        `Location cannot be deleted due to ${jobs} number of associated jobs! `
      );
    }

    const res = await prisma.location.delete({
      where: {
        id: locationId,
        createdBy: user.id,
      },
    });
    return { res, success: true };
  } catch (error) {
    const msg = "Failed to delete job location.";
    return handleError(error, msg);
  }
};

export const createJobLocation = async (
  label: string,
  zipCode: string,
  country?: string
): Promise<any | undefined> => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error("Not authenticated");
    }
    const dbUser = await ensureUserExists(user);
    const value = label.trim().toLowerCase();
    if (!value) {
      throw new Error("Please provide location name");
    }
    const finalZip = (zipCode || "").trim().toLowerCase();
    const finalCountry = (country || "").trim().toLowerCase();
    const uniqueValue = [value, finalZip || finalCountry]
      .filter(Boolean)
      .join("-")
      .replace(/\s+/g, "-");

    const existing = await prisma.location.findFirst({
      where: { value: uniqueValue || value, createdBy: dbUser.id },
    });
    if (existing) {
      return { data: existing, success: true };
    }

  const { lat, lng } = await geocodeLocation({
    city: label,
    zipCode,
    country,
  });
  if (lat == null || lng == null) {
    throw new Error("Unable to geocode location. Please check city/zip/country.");
  }

  const location = await prisma.location.create({
    data: {
      label,
      value: uniqueValue || value,
      zipCode: finalZip || null,
      country: finalCountry || null,
      lat,
      lng,
      createdBy: dbUser.id,
    },
  });
    return { data: location, success: true };
  } catch (error) {
    const msg = "Failed to create job location. ";
    return handleError(error, msg);
  }
};

export const updateJobLocation = async (
  id: string,
  label: string,
  zipCode: string,
  country?: string,
  createdBy?: string
): Promise<any | undefined> => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error("Not authenticated");
    }
    if (!id || (createdBy && createdBy !== user.id)) {
      throw new Error("Id is not provided or no user privileges");
    }

    const value = label.trim().toLowerCase();
    const finalZip = (zipCode || "").trim().toLowerCase();
    const finalCountry = (country || "").trim().toLowerCase();
    const uniqueValue = [value, finalZip || finalCountry]
      .filter(Boolean)
      .join("-")
      .replace(/\s+/g, "-");

  const { lat, lng } = await geocodeLocation({
    city: label,
    zipCode,
    country,
  });
  if (lat == null || lng == null) {
    throw new Error("Unable to geocode location. Please check city/zip/country.");
  }

  const updated = await prisma.location.update({
    where: { id },
    data: {
      label,
      value: uniqueValue || value,
      zipCode: finalZip || null,
      country: finalCountry || null,
      lat,
      lng,
    },
  });
    return { data: updated, success: true };
  } catch (error) {
    const msg = "Failed to update job location. ";
    return handleError(error, msg);
  }
};
