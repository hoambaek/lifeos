-- CreateTable
CREATE TABLE "UserConfig" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "startWeight" REAL NOT NULL,
    "goalWeight" REAL NOT NULL,
    "startDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "DailyLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "weight" REAL,
    "proteinAmount" INTEGER NOT NULL DEFAULT 0,
    "waterDone" BOOLEAN NOT NULL DEFAULT false,
    "cleanDiet" BOOLEAN NOT NULL DEFAULT false,
    "workoutDone" BOOLEAN NOT NULL DEFAULT false,
    "workoutPart" TEXT,
    "memo" TEXT
);

-- CreateIndex
CREATE UNIQUE INDEX "DailyLog_date_key" ON "DailyLog"("date");
