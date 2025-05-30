-- AlterTable
ALTER TABLE "Workflow" ADD COLUMN "agentId" TEXT;
ALTER TABLE "Workflow" ADD COLUMN "agentInput" JSONB;
ALTER TABLE "Workflow" ADD COLUMN "outputConfiguration" JSONB;
ALTER TABLE "Workflow" ADD COLUMN "outputPipedreamAppSlug" TEXT;
ALTER TABLE "Workflow" ADD COLUMN "outputPipedreamConnectedAccountId" TEXT;
