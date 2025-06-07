-- CreateTable
CREATE TABLE "softball_matches" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "matchCode" TEXT NOT NULL,
    "round" INTEGER NOT NULL,
    "matchNumber" INTEGER NOT NULL,
    "team1" TEXT NOT NULL,
    "team2" TEXT NOT NULL,
    "team1Scores" TEXT NOT NULL,
    "team2Scores" TEXT NOT NULL,
    "team1Total" INTEGER NOT NULL DEFAULT 0,
    "team2Total" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'waiting',
    "winner" TEXT,
    "scheduledTime" TEXT NOT NULL DEFAULT '',
    "startTime" TEXT NOT NULL DEFAULT '',
    "endTime" TEXT NOT NULL DEFAULT '',
    "isJankenNeeded" BOOLEAN NOT NULL DEFAULT false,
    "jankenWinner" TEXT,
    "isHomeFirst" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "softball_rankings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "className" TEXT NOT NULL,
    "rank" INTEGER,
    "rankText" TEXT,
    "eliminatedAt" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "basketball_matches" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "matchCode" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "round" INTEGER NOT NULL,
    "matchNumber" INTEGER NOT NULL,
    "team1" TEXT NOT NULL,
    "team2" TEXT NOT NULL,
    "team1FirstHalf" INTEGER NOT NULL DEFAULT 0,
    "team1SecondHalf" INTEGER NOT NULL DEFAULT 0,
    "team1FreeThrow" INTEGER NOT NULL DEFAULT 0,
    "team2FirstHalf" INTEGER NOT NULL DEFAULT 0,
    "team2SecondHalf" INTEGER NOT NULL DEFAULT 0,
    "team2FreeThrow" INTEGER NOT NULL DEFAULT 0,
    "team1Total" INTEGER NOT NULL DEFAULT 0,
    "team2Total" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'waiting',
    "winner" TEXT,
    "scheduledTime" TEXT NOT NULL DEFAULT '',
    "startTime" TEXT NOT NULL DEFAULT '',
    "endTime" TEXT NOT NULL DEFAULT '',
    "isFreeThrowNeeded" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "basketball_rankings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "className" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "rank" INTEGER,
    "rankText" TEXT,
    "eliminatedAt" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "tabletennis_matches" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "matchCode" TEXT NOT NULL,
    "round" INTEGER NOT NULL,
    "matchNumber" INTEGER NOT NULL,
    "team1" TEXT NOT NULL,
    "team2" TEXT NOT NULL,
    "menSinglesTeam1Set1" INTEGER NOT NULL DEFAULT 0,
    "menSinglesTeam1Set2" INTEGER NOT NULL DEFAULT 0,
    "menSinglesTeam1Set3" INTEGER NOT NULL DEFAULT 0,
    "menSinglesTeam2Set1" INTEGER NOT NULL DEFAULT 0,
    "menSinglesTeam2Set2" INTEGER NOT NULL DEFAULT 0,
    "menSinglesTeam2Set3" INTEGER NOT NULL DEFAULT 0,
    "menSinglesWinner" TEXT,
    "womenSinglesTeam1Set1" INTEGER NOT NULL DEFAULT 0,
    "womenSinglesTeam1Set2" INTEGER NOT NULL DEFAULT 0,
    "womenSinglesTeam1Set3" INTEGER NOT NULL DEFAULT 0,
    "womenSinglesTeam2Set1" INTEGER NOT NULL DEFAULT 0,
    "womenSinglesTeam2Set2" INTEGER NOT NULL DEFAULT 0,
    "womenSinglesTeam2Set3" INTEGER NOT NULL DEFAULT 0,
    "womenSinglesWinner" TEXT,
    "menDoublesTeam1Set1" INTEGER NOT NULL DEFAULT 0,
    "menDoublesTeam1Set2" INTEGER NOT NULL DEFAULT 0,
    "menDoublesTeam1Set3" INTEGER NOT NULL DEFAULT 0,
    "menDoublesTeam2Set1" INTEGER NOT NULL DEFAULT 0,
    "menDoublesTeam2Set2" INTEGER NOT NULL DEFAULT 0,
    "menDoublesTeam2Set3" INTEGER NOT NULL DEFAULT 0,
    "menDoublesWinner" TEXT,
    "womenDoublesTeam1Set1" INTEGER NOT NULL DEFAULT 0,
    "womenDoublesTeam1Set2" INTEGER NOT NULL DEFAULT 0,
    "womenDoublesTeam1Set3" INTEGER NOT NULL DEFAULT 0,
    "womenDoublesTeam2Set1" INTEGER NOT NULL DEFAULT 0,
    "womenDoublesTeam2Set2" INTEGER NOT NULL DEFAULT 0,
    "womenDoublesTeam2Set3" INTEGER NOT NULL DEFAULT 0,
    "womenDoublesWinner" TEXT,
    "mixedDoublesTeam1Set1" INTEGER NOT NULL DEFAULT 0,
    "mixedDoublesTeam1Set2" INTEGER NOT NULL DEFAULT 0,
    "mixedDoublesTeam1Set3" INTEGER NOT NULL DEFAULT 0,
    "mixedDoublesTeam2Set1" INTEGER NOT NULL DEFAULT 0,
    "mixedDoublesTeam2Set2" INTEGER NOT NULL DEFAULT 0,
    "mixedDoublesTeam2Set3" INTEGER NOT NULL DEFAULT 0,
    "mixedDoublesWinner" TEXT,
    "team1Wins" INTEGER NOT NULL DEFAULT 0,
    "team2Wins" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'waiting',
    "winner" TEXT,
    "scheduledTime" TEXT NOT NULL DEFAULT '',
    "startTime" TEXT NOT NULL DEFAULT '',
    "endTime" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "tabletennis_rankings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "className" TEXT NOT NULL,
    "rank" INTEGER,
    "rankText" TEXT,
    "eliminatedAt" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "soccer_matches" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "matchCode" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "round" INTEGER NOT NULL,
    "matchNumber" INTEGER NOT NULL,
    "team1" TEXT NOT NULL,
    "team2" TEXT NOT NULL,
    "team1FirstHalf" INTEGER NOT NULL DEFAULT 0,
    "team1SecondHalf" INTEGER NOT NULL DEFAULT 0,
    "team2FirstHalf" INTEGER NOT NULL DEFAULT 0,
    "team2SecondHalf" INTEGER NOT NULL DEFAULT 0,
    "team1Total" INTEGER NOT NULL DEFAULT 0,
    "team2Total" INTEGER NOT NULL DEFAULT 0,
    "team1PkScore" INTEGER,
    "team2PkScore" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'waiting',
    "winner" TEXT,
    "scheduledTime" TEXT NOT NULL DEFAULT '',
    "startTime" TEXT NOT NULL DEFAULT '',
    "endTime" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "soccer_rankings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "className" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "rank" INTEGER,
    "rankText" TEXT,
    "eliminatedAt" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "softball_matches_matchCode_key" ON "softball_matches"("matchCode");

-- CreateIndex
CREATE UNIQUE INDEX "softball_rankings_className_key" ON "softball_rankings"("className");

-- CreateIndex
CREATE UNIQUE INDEX "basketball_matches_matchCode_key" ON "basketball_matches"("matchCode");

-- CreateIndex
CREATE UNIQUE INDEX "basketball_rankings_className_gender_key" ON "basketball_rankings"("className", "gender");

-- CreateIndex
CREATE UNIQUE INDEX "tabletennis_matches_matchCode_key" ON "tabletennis_matches"("matchCode");

-- CreateIndex
CREATE UNIQUE INDEX "tabletennis_rankings_className_key" ON "tabletennis_rankings"("className");

-- CreateIndex
CREATE UNIQUE INDEX "soccer_matches_matchCode_key" ON "soccer_matches"("matchCode");

-- CreateIndex
CREATE UNIQUE INDEX "soccer_rankings_className_gender_key" ON "soccer_rankings"("className", "gender");
