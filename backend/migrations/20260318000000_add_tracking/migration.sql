-- AlterEnum: add 'packed' and 'dispatched' to OrderStatus
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'packed';
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'dispatched';
