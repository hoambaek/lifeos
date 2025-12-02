-- CreateTable
CREATE TABLE "InBodyRecord" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "imagePath" TEXT NOT NULL,
    "weight" REAL NOT NULL,
    "skeletalMuscle" REAL NOT NULL,
    "bodyFatMass" REAL NOT NULL,
    "bodyFatPercent" REAL NOT NULL,
    "bmi" REAL NOT NULL,
    "visceralFat" INTEGER NOT NULL,
    "inbodyScore" INTEGER NOT NULL,
    "bmr" INTEGER NOT NULL,
    "bodyWater" REAL,
    "protein" REAL,
    "minerals" REAL,
    "segmentalMuscle" TEXT,
    "segmentalFat" TEXT,
    "aiAnalysis" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
