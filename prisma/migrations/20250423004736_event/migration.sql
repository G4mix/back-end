/*
  Warnings:

  - A unique constraint covering the columns `[eventId]` on the table `Post` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "EventFrequency" AS ENUM ('DAILY', 'MONTHLY', 'WEEKLY', 'YEARLY');

-- AlterTable
ALTER TABLE "Link" ALTER COLUMN "url" SET DATA TYPE VARCHAR(700);

-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "eventId" TEXT;

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "subject" VARCHAR(255) NOT NULL,
    "description" VARCHAR(255),
    "location" VARCHAR(1000),
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "frequency" "EventFrequency",

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Post_eventId_key" ON "Post"("eventId");
