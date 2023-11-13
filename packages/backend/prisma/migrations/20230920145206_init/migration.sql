-- CreateTable
CREATE TABLE "ballots" (
    "address" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "published_at" TIMESTAMP(3),
    "votes" JSONB NOT NULL DEFAULT '[]',

    CONSTRAINT "ballots_pkey" PRIMARY KEY ("address")
);

-- CreateTable
CREATE TABLE "likes" (
    "id" TEXT NOT NULL,
    "addresses" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "last_updated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "likes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ballots_address_key" ON "ballots"("address");

-- CreateIndex
CREATE UNIQUE INDEX "likes_id_key" ON "likes"("id");
