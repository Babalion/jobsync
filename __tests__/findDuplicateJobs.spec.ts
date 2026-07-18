import { findDuplicateJobs } from "@/actions/job.actions";
import { getCurrentUser } from "@/utils/user.utils";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

jest.mock("@prisma/client", () => {
  const mPrismaClient = {
    job: {
      findMany: jest.fn(),
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

describe("findDuplicateJobs", () => {
  const mockUser = { id: "user-id", name: "Test User", email: "test@example.com" };

  beforeEach(() => {
    jest.clearAllMocks();
    (getCurrentUser as jest.Mock).mockResolvedValue(mockUser);
  });

  it("should return empty duplicates when no matching jobs exist", async () => {
    (prisma.job.findMany as jest.Mock).mockResolvedValue([]);

    const result = await findDuplicateJobs("company-id", "software engineer", null);

    expect(result.success).toBe(true);
    expect(result.duplicates).toEqual([]);
  });

  it("should detect duplicate with same URL", async () => {
    const existingJob = {
      id: "job-1",
      companyId: "company-id",
      jobUrl: "https://example.com/job/123",
      createdAt: new Date(),
      JobTitle: { value: "software engineer", label: "Software Engineer" },
      Company: { label: "TechCorp" },
    };

    (prisma.job.findMany as jest.Mock).mockResolvedValue([existingJob]);

    const result = await findDuplicateJobs(
      "company-id",
      "software engineer",
      "https://example.com/job/123?utm_source=linkedin"
    );

    expect(result.success).toBe(true);
    expect(result.duplicates).toHaveLength(1);
    expect(result.duplicates[0].id).toBe("job-1");
  });

  it("should detect duplicate with similar title", async () => {
    const existingJob = {
      id: "job-1",
      companyId: "company-id",
      jobUrl: null,
      createdAt: new Date(),
      JobTitle: { value: "software engineer", label: "Software Engineer" },
      Company: { label: "TechCorp" },
    };

    (prisma.job.findMany as jest.Mock).mockResolvedValue([existingJob]);

    const result = await findDuplicateJobs(
      "company-id",
      "software engineer", // Case difference
      null
    );

    expect(result.success).toBe(true);
    expect(result.duplicates).toHaveLength(1);
    expect(result.duplicates[0].id).toBe("job-1");
  });

  it("should NOT detect duplicate with different title", async () => {
    const existingJob = {
      id: "job-1",
      companyId: "company-id",
      jobUrl: null,
      createdAt: new Date(),
      JobTitle: { value: "data scientist", label: "Data Scientist" },
      Company: { label: "TechCorp" },
    };

    (prisma.job.findMany as jest.Mock).mockResolvedValue([existingJob]);

    const result = await findDuplicateJobs(
      "company-id",
      "software engineer", // Very different title
      null
    );

    expect(result.success).toBe(true);
    expect(result.duplicates).toHaveLength(0);
  });

  it("should handle multiple jobs and return only duplicates", async () => {
    const existingJobs = [
      {
        id: "job-1",
        companyId: "company-id",
        jobUrl: "https://example.com/job/123",
        createdAt: new Date(),
        JobTitle: { value: "software engineer", label: "Software Engineer" },
        Company: { label: "TechCorp" },
      },
      {
        id: "job-2",
        companyId: "company-id",
        jobUrl: "https://example.com/job/456",
        createdAt: new Date(),
        JobTitle: { value: "data scientist", label: "Data Scientist" },
        Company: { label: "TechCorp" },
      },
    ];

    (prisma.job.findMany as jest.Mock).mockResolvedValue(existingJobs);

    const result = await findDuplicateJobs(
      "company-id",
      "software engineer",
      "https://example.com/job/123"
    );

    expect(result.success).toBe(true);
    expect(result.duplicates).toHaveLength(1);
    expect(result.duplicates[0].id).toBe("job-1");
  });

  it("should return error when user is not authenticated", async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue(null);

    const result = await findDuplicateJobs("company-id", "software engineer", null);

    expect(result.success).toBe(false);
    expect(result.message).toBe("Not authenticated");
  });

  it("should query only recent jobs from last 30 days", async () => {
    (prisma.job.findMany as jest.Mock).mockResolvedValue([]);

    await findDuplicateJobs("company-id", "software engineer", null);

    expect(prisma.job.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: mockUser.id,
          companyId: "company-id",
          createdAt: expect.objectContaining({
            gte: expect.any(Date),
          }),
        }),
      })
    );

    // Verify the date is approximately 30 days ago
    const call = (prisma.job.findMany as jest.Mock).mock.calls[0][0];
    const dateThreshold = call.where.createdAt.gte;
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const timeDiff = Math.abs(dateThreshold.getTime() - thirtyDaysAgo.getTime());
    expect(timeDiff).toBeLessThan(1000); // Within 1 second
  });
});
