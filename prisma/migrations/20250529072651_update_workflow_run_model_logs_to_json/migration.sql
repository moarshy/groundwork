/*
  Warnings:

  - You are about to drop the column `endedAt` on the `WorkflowRun` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `WorkflowRun` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `WorkflowRun` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_WorkflowRun" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workflowId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "bullJobId" TEXT,
    "agentInput" JSONB,
    "agentOutput" JSONB,
    "logs" JSONB,
    "errorMessage" TEXT,
    "enqueuedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" DATETIME,
    "completedAt" DATETIME,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WorkflowRun_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "Workflow" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_WorkflowRun" ("id", "logs", "startedAt", "status", "workflowId") SELECT "id", "logs", "startedAt", "status", "workflowId" FROM "WorkflowRun";
DROP TABLE "WorkflowRun";
ALTER TABLE "new_WorkflowRun" RENAME TO "WorkflowRun";
CREATE UNIQUE INDEX "WorkflowRun_bullJobId_key" ON "WorkflowRun"("bullJobId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
