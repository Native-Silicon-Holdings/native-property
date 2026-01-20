-- CreateEnum
CREATE TYPE "OwnershipType" AS ENUM ('PRIMARY', 'CO_OWNER', 'TENANT', 'FORMER_OWNER');

-- CreateEnum
CREATE TYPE "PropertyAccessStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ElectionType" AS ENUM ('DIRECTOR', 'COMMITTEE', 'RESOLUTION');

-- CreateEnum
CREATE TYPE "ElectionStatus" AS ENUM ('UPCOMING', 'NOMINATIONS_OPEN', 'VOTING_OPEN', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CandidateStatus" AS ENUM ('NOMINATED', 'ACCEPTED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('INCOME', 'EXPENSE');

-- CreateEnum
CREATE TYPE "ResolutionStatus" AS ENUM ('PENDING', 'PASSED', 'FAILED', 'DEFERRED');

-- CreateEnum
CREATE TYPE "ImplementationStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "UtilityType" ADD VALUE 'LEVY';
ALTER TYPE "UtilityType" ADD VALUE 'OTHER';

-- AlterTable
ALTER TABLE "properties" ADD COLUMN     "currentPrimaryOwnerId" TEXT;

-- CreateTable
CREATE TABLE "property_ownerships" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ownershipType" "OwnershipType" NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "property_ownerships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "property_access_requests" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "requestedByUserId" TEXT NOT NULL,
    "requestedForEmail" TEXT NOT NULL,
    "requestedRecords" TEXT[],
    "transferDate" TIMESTAMP(3),
    "status" "PropertyAccessStatus" NOT NULL DEFAULT 'PENDING',
    "adminNotes" TEXT,
    "processedByUserId" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "property_access_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "directors" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "electedDate" TIMESTAMP(3) NOT NULL,
    "termEndDate" TIMESTAMP(3) NOT NULL,
    "portfolio" TEXT,
    "biography" TEXT,
    "contactEmail" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "directors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "elections" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "ElectionType" NOT NULL,
    "status" "ElectionStatus" NOT NULL DEFAULT 'UPCOMING',
    "nominationsStartDate" TIMESTAMP(3) NOT NULL,
    "nominationsEndDate" TIMESTAMP(3) NOT NULL,
    "votingStartDate" TIMESTAMP(3) NOT NULL,
    "votingEndDate" TIMESTAMP(3) NOT NULL,
    "resultsPublishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "elections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candidates" (
    "id" TEXT NOT NULL,
    "electionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "statement" TEXT,
    "status" "CandidateStatus" NOT NULL DEFAULT 'NOMINATED',
    "nominatedBy" TEXT NOT NULL,
    "secondedBy" TEXT,
    "withdrawnAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "candidates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "votes" (
    "id" TEXT NOT NULL,
    "electionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "voteHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "votes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vote_choices" (
    "id" TEXT NOT NULL,
    "electionId" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "voteCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vote_choices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financial_transactions" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "type" "TransactionType" NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "reference" TEXT,
    "accountingPeriod" TEXT NOT NULL,
    "attachmentUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "financial_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budget_lines" (
    "id" TEXT NOT NULL,
    "fiscalYear" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "budgetedAmount" DOUBLE PRECISION NOT NULL,
    "spentAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "variance" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "budget_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resolutions" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "ResolutionStatus" NOT NULL DEFAULT 'PENDING',
    "votesFor" INTEGER NOT NULL DEFAULT 0,
    "votesAgainst" INTEGER NOT NULL DEFAULT 0,
    "votesAbstain" INTEGER NOT NULL DEFAULT 0,
    "implementationStatus" "ImplementationStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "proposedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resolutions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "property_ownerships_propertyId_isActive_idx" ON "property_ownerships"("propertyId", "isActive");

-- CreateIndex
CREATE INDEX "property_ownerships_userId_isActive_idx" ON "property_ownerships"("userId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "property_ownerships_propertyId_userId_startDate_key" ON "property_ownerships"("propertyId", "userId", "startDate");

-- CreateIndex
CREATE INDEX "property_access_requests_propertyId_status_idx" ON "property_access_requests"("propertyId", "status");

-- CreateIndex
CREATE INDEX "property_access_requests_requestedByUserId_idx" ON "property_access_requests"("requestedByUserId");

-- CreateIndex
CREATE UNIQUE INDEX "directors_userId_key" ON "directors"("userId");

-- CreateIndex
CREATE INDEX "directors_isActive_termEndDate_idx" ON "directors"("isActive", "termEndDate");

-- CreateIndex
CREATE INDEX "directors_position_idx" ON "directors"("position");

-- CreateIndex
CREATE INDEX "elections_status_votingEndDate_idx" ON "elections"("status", "votingEndDate");

-- CreateIndex
CREATE INDEX "candidates_electionId_status_idx" ON "candidates"("electionId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "candidates_electionId_userId_position_key" ON "candidates"("electionId", "userId", "position");

-- CreateIndex
CREATE INDEX "votes_electionId_candidateId_idx" ON "votes"("electionId", "candidateId");

-- CreateIndex
CREATE INDEX "votes_userId_idx" ON "votes"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "votes_electionId_userId_key" ON "votes"("electionId", "userId");

-- CreateIndex
CREATE INDEX "vote_choices_electionId_idx" ON "vote_choices"("electionId");

-- CreateIndex
CREATE UNIQUE INDEX "vote_choices_electionId_candidateId_key" ON "vote_choices"("electionId", "candidateId");

-- CreateIndex
CREATE INDEX "financial_transactions_date_type_idx" ON "financial_transactions"("date", "type");

-- CreateIndex
CREATE INDEX "financial_transactions_accountingPeriod_idx" ON "financial_transactions"("accountingPeriod");

-- CreateIndex
CREATE INDEX "budget_lines_fiscalYear_idx" ON "budget_lines"("fiscalYear");

-- CreateIndex
CREATE UNIQUE INDEX "budget_lines_fiscalYear_category_key" ON "budget_lines"("fiscalYear", "category");

-- CreateIndex
CREATE INDEX "resolutions_meetingId_status_idx" ON "resolutions"("meetingId", "status");

-- AddForeignKey
ALTER TABLE "property_ownerships" ADD CONSTRAINT "property_ownerships_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_ownerships" ADD CONSTRAINT "property_ownerships_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_access_requests" ADD CONSTRAINT "property_access_requests_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_access_requests" ADD CONSTRAINT "property_access_requests_requestedByUserId_fkey" FOREIGN KEY ("requestedByUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "directors" ADD CONSTRAINT "directors_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidates" ADD CONSTRAINT "candidates_electionId_fkey" FOREIGN KEY ("electionId") REFERENCES "elections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votes" ADD CONSTRAINT "votes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vote_choices" ADD CONSTRAINT "vote_choices_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resolutions" ADD CONSTRAINT "resolutions_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resolutions" ADD CONSTRAINT "resolutions_proposedBy_fkey" FOREIGN KEY ("proposedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
