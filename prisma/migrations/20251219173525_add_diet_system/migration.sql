-- CreateTable
CREATE TABLE "DietConfig" (
    "id" SERIAL NOT NULL,
    "startDate" TIMESTAMPTZ NOT NULL,
    "currentWeek" INTEGER NOT NULL DEFAULT 1,
    "currentPhase" TEXT NOT NULL DEFAULT 'fat_burning',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "DietConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DietPlan" (
    "id" SERIAL NOT NULL,
    "dayNumber" INTEGER NOT NULL,
    "week" INTEGER NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "breakfast" TEXT NOT NULL,
    "breakfastTime" TEXT NOT NULL DEFAULT '08:00-09:00',
    "lunch" TEXT NOT NULL,
    "lunchTime" TEXT NOT NULL DEFAULT '13:00-14:00',
    "snack" TEXT,
    "snackTime" TEXT DEFAULT '15:30-16:30',
    "dinner" TEXT NOT NULL,
    "dinnerTime" TEXT NOT NULL DEFAULT '18:00-19:00',
    "isFastingDay" BOOLEAN NOT NULL DEFAULT false,
    "weekNotes" TEXT,
    "allowedFoods" TEXT,
    "forbiddenFoods" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DietPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DietLog" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMPTZ NOT NULL,
    "dayNumber" INTEGER NOT NULL,
    "week" INTEGER NOT NULL,
    "breakfastDone" BOOLEAN NOT NULL DEFAULT false,
    "lunchDone" BOOLEAN NOT NULL DEFAULT false,
    "snackDone" BOOLEAN NOT NULL DEFAULT false,
    "dinnerDone" BOOLEAN NOT NULL DEFAULT false,
    "fastingComplete" BOOLEAN NOT NULL DEFAULT false,
    "sleepHours" DOUBLE PRECISION,
    "waterCups" INTEGER NOT NULL DEFAULT 0,
    "exerciseDone" BOOLEAN NOT NULL DEFAULT false,
    "noAlcohol" BOOLEAN NOT NULL DEFAULT true,
    "noFlour" BOOLEAN NOT NULL DEFAULT true,
    "noSugar" BOOLEAN NOT NULL DEFAULT true,
    "memo" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DietLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DietRule" (
    "id" SERIAL NOT NULL,
    "ruleNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DietRule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DietPlan_week_dayOfWeek_key" ON "DietPlan"("week", "dayOfWeek");

-- CreateIndex
CREATE UNIQUE INDEX "DietLog_date_key" ON "DietLog"("date");

-- CreateIndex
CREATE UNIQUE INDEX "DietRule_ruleNumber_key" ON "DietRule"("ruleNumber");
