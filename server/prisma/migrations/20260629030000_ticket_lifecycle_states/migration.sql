-- This migration is not transactional
-- PostgreSQL requires new enum values to be committed before they can be referenced.

ALTER TYPE "TicketStatus" ADD VALUE IF NOT EXISTS 'New';
ALTER TYPE "TicketStatus" ADD VALUE IF NOT EXISTS 'Processing';

ALTER TABLE "Ticket" ALTER COLUMN "status" SET DEFAULT 'New';

ALTER TABLE "Ticket" DROP COLUMN IF EXISTS "autoResolved";
