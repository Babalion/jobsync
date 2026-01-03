import {
  getJobLocationsList,
  createJobLocation,
  updateJobLocation,
} from "@/actions/jobLocation.actions";
import { getCurrentUser } from "@/utils/user.utils";
import { ensureUserExists } from "@/utils/user.ensure";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

jest.mock("@prisma/client", () => {
  const mPrismaClient = {
    location: {
      findMany: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };
  return { PrismaClient: jest.fn(() => mPrismaClient) };
});

jest.mock("@/utils/user.utils", () => ({
  getCurrentUser: jest.fn(),
}));

jest.mock("@/utils/user.ensure", () => ({
  ensureUserExists: jest.fn(async (user) => user),
}));

jest.mock("@/lib/geocode", () => ({
  geocodeLocation: jest.fn(async () => ({ lat: 50, lng: 8 })),
}));

describe("Job Location Actions", () => {
  const mockUser = { id: "user-id" };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("includes lat/lng when selecting with countBy", async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue(mockUser);
    (prisma.location.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.location.count as jest.Mock).mockResolvedValue(0);

    await getJobLocationsList(1, 10, "applied");

    expect(prisma.location.findMany).toHaveBeenCalledWith({
      where: { createdBy: mockUser.id },
      skip: 0,
      take: 10,
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
              where: { applied: true },
            },
          },
        },
      },
      orderBy: { jobsApplied: { _count: "desc" } },
    });
  });

  it("creates with geocoded lat/lng", async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue(mockUser);
    (prisma.location.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.location.create as jest.Mock).mockResolvedValue({ id: "loc1" });

    const res = await createJobLocation("City", "12345", "DE");
    expect(res?.success).toBeTruthy();
    expect(prisma.location.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        label: "City",
        lat: 50,
        lng: 8,
      }),
    });
  });

  it("updates with geocoded lat/lng", async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue(mockUser);
    (prisma.location.update as jest.Mock).mockResolvedValue({ id: "loc1" });

    const res = await updateJobLocation("loc1", "City", "12345", "DE", mockUser.id);
    expect(res?.success).toBeTruthy();
    expect(prisma.location.update).toHaveBeenCalledWith({
      where: { id: "loc1" },
      data: expect.objectContaining({ lat: 50, lng: 8 }),
    });
  });
});
