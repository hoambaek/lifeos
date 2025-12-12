-- AlterTable
ALTER TABLE "UserGamification" ADD COLUMN     "cognitiveShieldLevel" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "morningWorkoutCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "perfectRoutineDays" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "pressureRecoveries" INTEGER NOT NULL DEFAULT 0;
