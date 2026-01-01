/**
 * @jest-environment node
 */

import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { addCompany } from "@/actions/company.actions";
import { createLocation, addJob } from "@/actions/job.actions";
import { createJobTitle } from "@/actions/jobtitle.actions";
import { getJobLocationsList } from "@/actions/jobLocation.actions";

process.env.DATABASE_URL = "file:./prisma/test.db";

jest.mock("@/utils/user.utils", () => ({
  getCurrentUser: jest.fn(),
}));

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

const { getCurrentUser } = jest.requireMock("@/utils/user.utils");

describe("Integration actions against sqlite", () => {
  const prisma = new PrismaClient();
  const testDbPath = path.join(process.cwd(), "prisma", "test.db");
  let userId: string;
  let statusId: string;
  let sourceId: string;
  let companyId: string;
  let locationId: string;
  let jobTitleId: string;
  let otherUserId: string;

  beforeAll(async () => {
    if (fs.existsSync(testDbPath)) {
      fs.rmSync(testDbPath);
    }
    execSync("npx prisma db push --force-reset --skip-generate --schema prisma/schema.prisma", {
      stdio: "inherit",
      env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL },
    });

    const user = await prisma.user.create({
      data: {
        name: "Tester",
        email: "tester@example.com",
        password: "secret",
      },
    });
    userId = user.id;
    (getCurrentUser as jest.Mock).mockResolvedValue({
      id: user.id,
      name: user.name,
      email: user.email,
    });

    const [status, source, title, company, location] = await Promise.all([
      prisma.jobStatus.create({
        data: { label: "Draft", value: "draft" },
      }),
      prisma.jobSource.create({
        data: { label: "Indeed", value: "indeed" },
      }),
      prisma.jobTitle.create({
        data: { label: "Engineer", value: "engineer", createdBy: user.id },
      }),
      prisma.company.create({
        data: {
          label: "ACME",
          value: "acme",
          createdBy: user.id,
        },
      }),
      prisma.location.create({
        data: {
          label: "Remote",
          value: "remote",
          createdBy: user.id,
        },
      }),
    ]);

    statusId = status.id;
    sourceId = source.id;
    jobTitleId = title.id;
    companyId = company.id;
    locationId = location.id;

    const otherUser = await prisma.user.create({
      data: {
        name: "Other",
        email: "other@example.com",
        password: "secret",
      },
    });
    otherUserId = otherUser.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("creates a company via action and persists it", async () => {
    const result = await addCompany({
      company: "New Co",
      logoUrl: "https://logo.test/new.png",
    });
    const saved = await prisma.company.findUnique({
      where: { value_createdBy: { value: "new co", createdBy: userId } },
    });

    expect(result?.success).toBe(true);
    expect(saved?.label).toBe("New Co");
    expect(saved?.createdBy).toBe(userId);
  });

  it("creates a location via action and persists it", async () => {
    const result = await createLocation("Hybrid City");
    const saved = await prisma.location.findUnique({
      where: { value_createdBy: { value: "hybrid city", createdBy: userId } },
    });

    expect(result?.success).toBe(true);
    expect(saved?.label).toBe("Hybrid City");
    expect(saved?.createdBy).toBe(userId);
  });

  it("creates a job title via action and persists it", async () => {
    const result = await createJobTitle("Backend Developer");
    const saved = await prisma.jobTitle.findUnique({
      where: {
        value_createdBy: { value: "backend developer", createdBy: userId },
      },
    });

    expect(result?.id).toBe(saved?.id);
    expect(saved?.createdBy).toBe(userId);
  });

  it("creates a job with existing references", async () => {
    const result = await addJob({
      title: jobTitleId,
      company: companyId,
      location: locationId,
      type: "FT",
      status: statusId,
      source: sourceId,
      salaryRange: "1",
      dueDate: new Date(),
      jobDescription: "<p>Test job</p>",
      applied: false,
      userId,
    });

    const saved = await prisma.job.findFirst({
      where: { id: result?.job?.id },
      include: { JobTitle: true, Company: true, Location: true },
    });

    expect(result?.success).toBe(true);
    expect(saved?.jobTitleId).toBe(jobTitleId);
    expect(saved?.companyId).toBe(companyId);
    expect(saved?.locationId).toBe(locationId);
    expect(saved?.userId).toBe(userId);
  });

  it("lists newly created locations in the admin list", async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue({
      id: userId,
      name: "Tester",
      email: "tester@example.com",
    });

    await createLocation("Listed City");
    const { data } = await getJobLocationsList(1, 10);

    const found = data?.some(
      (loc: any) => loc.value === "listed city" && loc.createdBy === userId
    );
    expect(found).toBe(true);
  });

  it("allows the same company label for different users", async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue({
      id: otherUserId,
      name: "Other",
      email: "other@example.com",
    });
    await addCompany({ company: "Shared Co", logoUrl: "" });
    const savedOther = await prisma.company.findUnique({
      where: {
        value_createdBy: { value: "shared co", createdBy: otherUserId },
      },
    });

    (getCurrentUser as jest.Mock).mockResolvedValue({
      id: userId,
      name: "Tester",
      email: "tester@example.com",
    });
    const result = await addCompany({ company: "Shared Co", logoUrl: "" });
    const saved = await prisma.company.findUnique({
      where: {
        value_createdBy: { value: "shared co", createdBy: userId },
      },
    });

    expect(result?.success).toBe(true);
    expect(savedOther?.createdBy).toBe(otherUserId);
    expect(saved?.createdBy).toBe(userId);
  });

  describe("when current user does not yet exist in DB", () => {
    const ghostUser = {
      id: "ghost-user",
      name: "Ghost",
      email: "ghost@example.com",
    };

    beforeEach(() => {
      (getCurrentUser as jest.Mock).mockResolvedValue(ghostUser);
    });

    it("auto-creates user and then location", async () => {
      const result = await createLocation("Ghost City");
      const dbUser = await prisma.user.findUnique({ where: { id: ghostUser.id } });
      const savedLocation = await prisma.location.findUnique({
        where: {
          value_createdBy: { value: "ghost city", createdBy: ghostUser.id },
        },
      });

      expect(result?.success).toBe(true);
      expect(dbUser?.email).toBe(ghostUser.email);
      expect(savedLocation?.createdBy).toBe(ghostUser.id);
    });

    it("auto-creates user and then company", async () => {
      const result = await addCompany({ company: "Ghost Co", logoUrl: "" });
      const dbUser = await prisma.user.findUnique({ where: { id: ghostUser.id } });
      const savedCompany = await prisma.company.findUnique({
        where: {
          value_createdBy: { value: "ghost co", createdBy: ghostUser.id },
        },
      });

      expect(result?.success).toBe(true);
      expect(dbUser?.email).toBe(ghostUser.email);
      expect(savedCompany?.createdBy).toBe(ghostUser.id);
    });

    it("auto-creates user and then job title", async () => {
      const result = await createJobTitle("Ghost Title");
      const dbUser = await prisma.user.findUnique({ where: { id: ghostUser.id } });
      const savedTitle = await prisma.jobTitle.findUnique({
        where: {
          value_createdBy: { value: "ghost title", createdBy: ghostUser.id },
        },
      });

      expect(result?.id).toBe(savedTitle?.id);
      expect(dbUser?.email).toBe(ghostUser.email);
      expect(savedTitle?.createdBy).toBe(ghostUser.id);
    });
  });
});
