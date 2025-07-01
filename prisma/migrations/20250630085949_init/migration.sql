-- CreateTable
CREATE TABLE "Board" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "visibility" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Shape" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "x" REAL,
    "y" REAL,
    "width" REAL,
    "height" REAL,
    "cx" REAL,
    "cy" REAL,
    "r" REAL,
    "content" TEXT,
    "fontSize" INTEGER,
    "fill" TEXT,
    "stroke" TEXT,
    "strokeWidth" REAL,
    "points" JSONB,
    "pathData" TEXT,
    "boardId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Shape_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "Board" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SharedBoard" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "boardId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "SharedBoard_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "Board" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "SharedBoard_boardId_userId_key" ON "SharedBoard"("boardId", "userId");
