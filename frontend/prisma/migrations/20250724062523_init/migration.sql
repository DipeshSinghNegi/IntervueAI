-- CreateTable
CREATE TABLE "Interview" (
    "id" TEXT NOT NULL,
    "scenario" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "objective" TEXT NOT NULL,
    "resumeName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Interview_pkey" PRIMARY KEY ("id")
);
