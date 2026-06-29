-- Add new lifecycle states to TicketStatus enum
ALTER TYPE "TicketStatus" ADD VALUE 'New';
ALTER TYPE "TicketStatus" ADD VALUE 'Processing';

-- Change column default to New for incoming tickets
ALTER TABLE "Ticket" ALTER COLUMN "status" SET DEFAULT 'New';

-- Drop autoResolved column (replaced by explicit status states)
ALTER TABLE "Ticket" DROP COLUMN IF EXISTS "autoResolved";
