-- CreateTable
CREATE TABLE "volleyball_matches" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "matchCode" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "league" TEXT NOT NULL,
    "matchNumber" INTEGER NOT NULL,
    "team1" TEXT NOT NULL,
    "team2" TEXT NOT NULL,
    "team1Score" INTEGER NOT NULL DEFAULT 0,
    "team2Score" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'waiting',
    "winner" TEXT,
    "scheduledTime" TEXT NOT NULL DEFAULT '',
    "startTime" TEXT NOT NULL DEFAULT '',
    "endTime" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "volleyball_rankings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "className" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "league" TEXT NOT NULL,
    "matches" INTEGER NOT NULL DEFAULT 0,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "pointDiff" INTEGER NOT NULL DEFAULT 0,
    "rank" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "volleyball_matches_matchCode_key" ON "volleyball_matches"("matchCode");

-- CreateIndex
CREATE UNIQUE INDEX "volleyball_rankings_className_gender_league_key" ON "volleyball_rankings"("className", "gender", "league");
