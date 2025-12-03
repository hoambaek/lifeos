-- CreateTable
CREATE TABLE "UserConfig" (
    "id" SERIAL NOT NULL,
    "startWeight" DOUBLE PRECISION NOT NULL,
    "goalWeight" DOUBLE PRECISION NOT NULL,
    "startDate" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyLog" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "weight" DOUBLE PRECISION,
    "proteinAmount" INTEGER NOT NULL DEFAULT 0,
    "waterDone" BOOLEAN NOT NULL DEFAULT false,
    "cleanDiet" BOOLEAN NOT NULL DEFAULT false,
    "workoutDone" BOOLEAN NOT NULL DEFAULT false,
    "workoutPart" TEXT,
    "memo" TEXT,

    CONSTRAINT "DailyLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InBodyRecord" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "imagePath" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "skeletalMuscle" DOUBLE PRECISION NOT NULL,
    "bodyFatMass" DOUBLE PRECISION NOT NULL,
    "bodyFatPercent" DOUBLE PRECISION NOT NULL,
    "bmi" DOUBLE PRECISION NOT NULL,
    "visceralFat" INTEGER NOT NULL,
    "inbodyScore" INTEGER NOT NULL,
    "bmr" INTEGER NOT NULL,
    "bodyWater" DOUBLE PRECISION,
    "protein" DOUBLE PRECISION,
    "minerals" DOUBLE PRECISION,
    "segmentalMuscle" TEXT,
    "segmentalFat" TEXT,
    "aiAnalysis" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InBodyRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DailyLog_date_key" ON "DailyLog"("date");
