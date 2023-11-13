-- CreateTable
CREATE TABLE "Whitelist" (
    "address" TEXT NOT NULL,

    CONSTRAINT "Whitelist_pkey" PRIMARY KEY ("address")
);

-- CreateIndex
CREATE UNIQUE INDEX "Whitelist_address_key" ON "Whitelist"("address");
