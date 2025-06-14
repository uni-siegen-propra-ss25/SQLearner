-- CreateTable
CREATE TABLE "fragen" (
    "id" SERIAL NOT NULL,
    "student_name" TEXT NOT NULL,
    "frage" TEXT NOT NULL,
    "antwort" TEXT,
    "erstellt_am" TIMESTAMP(6) NOT NULL,
    "ist_archiviert" BOOLEAN NOT NULL,
    "ist_angepinnt" BOOLEAN NOT NULL,
    "ist_geloescht" BOOLEAN NOT NULL,
    "ist_beantwortet" BOOLEAN NOT NULL,

    CONSTRAINT "fragen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hint" (
    "id" SERIAL NOT NULL,
    "text" TEXT NOT NULL,

    CONSTRAINT "hint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "todos" (
    "id" SERIAL NOT NULL,
    "text" TEXT NOT NULL,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "role" TEXT,

    CONSTRAINT "todos_pkey" PRIMARY KEY ("id")
);
