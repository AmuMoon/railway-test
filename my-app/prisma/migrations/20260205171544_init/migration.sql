-- CreateTable
CREATE TABLE "Player" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "steamId" TEXT NOT NULL,
    "name" TEXT,
    "avatar" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Match" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "matchId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "heroId" INTEGER NOT NULL,
    "heroName" TEXT NOT NULL,
    "kills" INTEGER NOT NULL,
    "deaths" INTEGER NOT NULL,
    "assists" INTEGER NOT NULL,
    "result" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "gameMode" TEXT NOT NULL,
    "lobbyType" TEXT NOT NULL,
    "startTime" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Match_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PlayerCache" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "steamId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "personaname" TEXT,
    "avatar" TEXT,
    "rankTier" INTEGER,
    "competitiveRank" TEXT,
    "win" INTEGER NOT NULL DEFAULT 0,
    "lose" INTEGER NOT NULL DEFAULT 0,
    "winRate" INTEGER NOT NULL DEFAULT 0,
    "totalGames" INTEGER NOT NULL DEFAULT 0,
    "estimatedMmr" INTEGER,
    "recentMatches" TEXT,
    "lastUpdated" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "Player_steamId_key" ON "Player"("steamId");

-- CreateIndex
CREATE UNIQUE INDEX "Match_matchId_key" ON "Match"("matchId");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerCache_steamId_key" ON "PlayerCache"("steamId");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerCache_accountId_key" ON "PlayerCache"("accountId");

-- CreateIndex
CREATE INDEX "PlayerCache_steamId_idx" ON "PlayerCache"("steamId");

-- CreateIndex
CREATE INDEX "PlayerCache_rankTier_idx" ON "PlayerCache"("rankTier");

-- CreateIndex
CREATE INDEX "PlayerCache_lastUpdated_idx" ON "PlayerCache"("lastUpdated");
