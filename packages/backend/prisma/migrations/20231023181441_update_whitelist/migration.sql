/*
  Warnings:

  - You are about to drop the `Whitelist` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "Whitelist";

-- CreateTable
CREATE TABLE "whitelist" (
    "address" TEXT NOT NULL,

    CONSTRAINT "whitelist_pkey" PRIMARY KEY ("address")
);

-- CreateIndex
CREATE UNIQUE INDEX "whitelist_address_key" ON "whitelist"("address");
