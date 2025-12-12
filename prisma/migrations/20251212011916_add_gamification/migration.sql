-- AlterTable
ALTER TABLE "DailyLog" ADD COLUMN     "streakFrozen" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "workoutTime" TIMESTAMPTZ,
ADD COLUMN     "xpEarned" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "UserGamification" (
    "id" SERIAL NOT NULL,
    "totalXP" INTEGER NOT NULL DEFAULT 0,
    "currentLevel" INTEGER NOT NULL DEFAULT 1,
    "streakFreezes" INTEGER NOT NULL DEFAULT 0,
    "streakFreezesUsed" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "UserGamification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Achievement" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "nameKo" TEXT NOT NULL,
    "descriptionKo" TEXT NOT NULL,
    "iconEmoji" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "tier" TEXT NOT NULL DEFAULT 'bronze',
    "xpReward" INTEGER NOT NULL DEFAULT 0,
    "requirement" INTEGER NOT NULL DEFAULT 1,
    "freezeReward" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Achievement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserAchievement" (
    "id" SERIAL NOT NULL,
    "achievementId" INTEGER NOT NULL,
    "unlockedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notified" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "UserAchievement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Challenge" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "nameKo" TEXT NOT NULL,
    "descriptionKo" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "targetValue" INTEGER NOT NULL,
    "xpReward" INTEGER NOT NULL,
    "startDate" TIMESTAMPTZ NOT NULL,
    "endDate" TIMESTAMPTZ NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Challenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserChallenge" (
    "id" SERIAL NOT NULL,
    "challengeId" INTEGER NOT NULL,
    "currentValue" INTEGER NOT NULL DEFAULT 0,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMPTZ,
    "claimed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "XPTransaction" (
    "id" SERIAL NOT NULL,
    "amount" INTEGER NOT NULL,
    "source" TEXT NOT NULL,
    "sourceId" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "XPTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StreakFreezeLog" (
    "id" SERIAL NOT NULL,
    "usedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "savedStreak" INTEGER NOT NULL,

    CONSTRAINT "StreakFreezeLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Achievement_key_key" ON "Achievement"("key");

-- CreateIndex
CREATE UNIQUE INDEX "UserAchievement_achievementId_key" ON "UserAchievement"("achievementId");

-- CreateIndex
CREATE UNIQUE INDEX "Challenge_key_key" ON "Challenge"("key");

-- CreateIndex
CREATE UNIQUE INDEX "UserChallenge_challengeId_key" ON "UserChallenge"("challengeId");

-- AddForeignKey
ALTER TABLE "UserAchievement" ADD CONSTRAINT "UserAchievement_achievementId_fkey" FOREIGN KEY ("achievementId") REFERENCES "Achievement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserChallenge" ADD CONSTRAINT "UserChallenge_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "Challenge"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
