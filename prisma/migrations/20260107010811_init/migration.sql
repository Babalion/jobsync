-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Contact" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL,
    "createdBy" TEXT NOT NULL,
    "interviewId" TEXT,
    CONSTRAINT "Contact_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Contact_interviewId_fkey" FOREIGN KEY ("interviewId") REFERENCES "Interview" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "JobTitle" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "label" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    CONSTRAINT "JobTitle_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "JobStatus" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "label" TEXT NOT NULL,
    "value" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Location" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "label" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "zipCode" TEXT DEFAULT '',
    "lat" REAL,
    "lng" REAL,
    "stateProv" TEXT,
    "country" TEXT,
    "createdBy" TEXT NOT NULL,
    CONSTRAINT "Location_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "label" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "logoUrl" TEXT,
    "website" TEXT,
    "careerSite" TEXT,
    "archetype" TEXT,
    "ownership" TEXT,
    "industryRole" TEXT,
    "innovationLevel" TEXT,
    "cultureTag" TEXT,
    "country" TEXT,
    "summary" TEXT,
    "fitNotes" TEXT,
    "hasWorksCouncil" BOOLEAN NOT NULL DEFAULT false,
    "hasCollectiveAgreement" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT NOT NULL,
    CONSTRAINT "Company_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CompanyLocation" (
    "companyId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,

    PRIMARY KEY ("companyId", "locationId"),
    CONSTRAINT "CompanyLocation_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CompanyLocation_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "JobSource" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "label" TEXT NOT NULL,
    "value" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Interview" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL,
    "jobId" TEXT NOT NULL,
    CONSTRAINT "Interview_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "jobUrl" TEXT,
    "description" TEXT NOT NULL,
    "jobType" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "applied" BOOLEAN NOT NULL DEFAULT false,
    "appliedDate" DATETIME,
    "dueDate" DATETIME,
    "statusId" TEXT NOT NULL,
    "jobTitleId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "jobSourceId" TEXT,
    "salaryRange" TEXT,
    "locationId" TEXT,
    CONSTRAINT "Job_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Job_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "JobStatus" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Job_jobTitleId_fkey" FOREIGN KEY ("jobTitleId") REFERENCES "JobTitle" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Job_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Job_jobSourceId_fkey" FOREIGN KEY ("jobSourceId") REFERENCES "JobSource" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Job_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "JobTitle_value_createdBy_key" ON "JobTitle"("value", "createdBy");

-- CreateIndex
CREATE UNIQUE INDEX "JobStatus_value_key" ON "JobStatus"("value");

-- CreateIndex
CREATE UNIQUE INDEX "Location_value_createdBy_key" ON "Location"("value", "createdBy");

-- CreateIndex
CREATE UNIQUE INDEX "Company_value_createdBy_key" ON "Company"("value", "createdBy");

-- CreateIndex
CREATE UNIQUE INDEX "JobSource_value_key" ON "JobSource"("value");
