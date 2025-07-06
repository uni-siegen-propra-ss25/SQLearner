import { PrismaClient, Role, ExerciseType, Difficulty } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { Pool } from 'pg';

const prisma = new PrismaClient();

export async function main() {
  console.log('Starting seed...');

  // Clear existing data to ensure clean state
  console.log('Clearing existing data...');
  
  // Delete in correct order to respect foreign key constraints
  await prisma.submission.deleteMany({});
  await prisma.progress.deleteMany({});
  await prisma.bookmark.deleteMany({});
  await prisma.chatMessage.deleteMany({});
  await prisma.dbSession.deleteMany({});
  await prisma.answerOption.deleteMany({});
  await prisma.exercise.deleteMany({});
  await prisma.topic.deleteMany({});
  await prisma.chapter.deleteMany({});
  await prisma.user.deleteMany({});
  
  // Handle database cleanup - delete actual PostgreSQL databases
  const existingDatabases = await prisma.database.findMany();
  for (const db of existingDatabases) {
    if (db.schemaSql && db.schemaSql.startsWith('db_')) {
      try {
        const adminPool = new Pool({
          host: process.env.DB_HOST,
          port: parseInt(process.env.DB_PORT || '5432', 10),
          user: process.env.DB_USER,
          password: process.env.DB_PASSWORD,
          database: process.env.DB_NAME
        });

        // Terminate connections and drop database
        await adminPool.query(`
          SELECT pg_terminate_backend(pid) 
          FROM pg_stat_activity 
          WHERE datname = $1 AND pid <> pg_backend_pid()
        `, [db.schemaSql]);
        
        await adminPool.query(`DROP DATABASE IF EXISTS "${db.schemaSql}"`);
        console.log(`Dropped database: ${db.schemaSql}`);
        await adminPool.end();
      } catch (error) {
        console.warn(`Could not drop database ${db.schemaSql}:`, error.message);
      }
    }
  }
  
  await prisma.database.deleteMany({});
  await prisma.settings.deleteMany({});
  
  console.log('Data cleared successfully');

  const defaultPassword = await bcrypt.hash('password123', 10);

  // Create admin user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@sql.de' },
    update: {
      password: defaultPassword,
      firstName: 'Admin',
      lastName: 'System',
      role: Role.ADMIN,
    },
    create: {
      email: 'admin@sql.de',
      password: defaultPassword,
      firstName: 'Admin',
      lastName: 'System',
      role: Role.ADMIN,
    },
  });

  // Create tutor user
  const tutor = await prisma.user.upsert({
    where: { email: 'tutor@sql.de' },
    update: {
      password: defaultPassword,
      firstName: 'Default',
      lastName: 'Tutor',
      role: Role.TUTOR,
    },
    create: {
      email: 'tutor@sql.de',
      password: defaultPassword,
      firstName: 'Default',
      lastName: 'Tutor',
      role: Role.TUTOR,
    },
  });

  // Create student user
  const student = await prisma.user.upsert({
    where: { email: 'student@sql.de' },
    update: {
      password: defaultPassword,
      firstName: 'Default',
      lastName: 'Student',
      role: Role.STUDENT,
      matriculationNumber: 'S0000000',
    },
    create: {
      email: 'student@sql.de',
      password: defaultPassword,
      firstName: 'Default',
      lastName: 'Student',
      role: Role.STUDENT,
      matriculationNumber: 'S0000000',
    },
  });

  // Create second student user
  const student2 = await prisma.user.upsert({
    where: { email: 'student2@sql.de' },
    update: {
      password: defaultPassword,
      firstName: 'Max',
      lastName: 'Mustermann',
      role: Role.STUDENT,
      matriculationNumber: 'S1234567',
    },
    create: {
      email: 'student2@sql.de',
      password: defaultPassword,
      firstName: 'Max',
      lastName: 'Mustermann',
      role: Role.STUDENT,
      matriculationNumber: 'S1234567',
    },
  });

  // Create sample database - first create the record, then the actual database
  let sampleDb = await prisma.database.findFirst({
    where: { name: 'Universitätsdatenbank' }
  });

  if (!sampleDb) {
    // Create the database record first
    sampleDb = await prisma.database.create({
      data: {
        name: 'Universitätsdatenbank',
        description: 'Eine einfache Universitätsdatenbank mit Studenten, Kursen und Professoren',
        schemaSql: '', // Will be updated with actual database name
      },
    });

    // Now create the actual PostgreSQL database
    const dbName = `db_${sampleDb.id}_universitaetsdatenbank`;
    
    try {
      // Connect to default database to create new database
      const adminPool = new Pool({
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT || '5432', 10),
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
      });

      // Create the new database
      await adminPool.query(`CREATE DATABASE "${dbName}"`);
      console.log(`Database ${dbName} created successfully`);
      await adminPool.end();

      // Update the database record with the actual database name
      sampleDb = await prisma.database.update({
        where: { id: sampleDb.id },
        data: { 
          schemaSql: dbName // Store the actual database name
        }
      });

      // Now execute the initial schema in the new database
      const newDbPool = new Pool({
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT || '5432', 10),
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: dbName
      });

      const schemaSQL = `
        CREATE TABLE students (
          id SERIAL PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          email VARCHAR(100) UNIQUE NOT NULL,
          enrollment_date DATE NOT NULL
        );

        CREATE TABLE professors (
          id SERIAL PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          department VARCHAR(50) NOT NULL
        );

        CREATE TABLE courses (
          id SERIAL PRIMARY KEY,
          title VARCHAR(100) NOT NULL,
          credits INTEGER NOT NULL,
          professor_id INTEGER REFERENCES professors(id)
        );

        CREATE TABLE enrollments (
          student_id INTEGER REFERENCES students(id),
          course_id INTEGER REFERENCES courses(id),
          grade DECIMAL(3,2),
          PRIMARY KEY (student_id, course_id)
        );

        INSERT INTO professors VALUES (1, 'Dr. Schmidt', 'Informatik');
        INSERT INTO professors VALUES (2, 'Prof. Müller', 'Mathematik');
        
        INSERT INTO courses VALUES (1, 'Datenbanken', 6, 1);
        INSERT INTO courses VALUES (2, 'Algorithmen', 8, 1);
        INSERT INTO courses VALUES (3, 'Analysis', 9, 2);
        
        INSERT INTO students VALUES (1, 'Anna Beispiel', 'anna@uni.de', '2023-10-01');
        INSERT INTO students VALUES (2, 'Tom Test', 'tom@uni.de', '2023-10-01');
        INSERT INTO students VALUES (3, 'Lisa Probe', 'lisa@uni.de', '2022-10-01');
        
        INSERT INTO enrollments VALUES (1, 1, 1.7);
        INSERT INTO enrollments VALUES (1, 3, 2.0);
        INSERT INTO enrollments VALUES (2, 1, 1.3);
        INSERT INTO enrollments VALUES (2, 2, 2.3);
        INSERT INTO enrollments VALUES (3, 1, 1.0);
        INSERT INTO enrollments VALUES (3, 2, 1.7);
        INSERT INTO enrollments VALUES (3, 3, 2.7);
      `;

      await newDbPool.query(schemaSQL);
      console.log('Schema executed successfully in new database');
      await newDbPool.end();

    } catch (error) {
      console.error('Error creating database:', error);
      // Delete the database record if creation fails
      await prisma.database.delete({
        where: { id: sampleDb.id },
      });
      throw error;
    }
  }

  // Create chapters
  const basicChapter = await prisma.chapter.upsert({
    where: { title: 'SQL Grundlagen' },
    update: {
      description: 'Grundlegende SQL-Befehle und Konzepte',
      order: 1,
    },
    create: {
      title: 'SQL Grundlagen',
      description: 'Grundlegende SQL-Befehle und Konzepte',
      order: 1,
    },
  });

  const advancedChapter = await prisma.chapter.upsert({
    where: { title: 'Erweiterte SQL-Techniken' },
    update: {
      description: 'Joins, Subqueries und komplexere Datenbankoperationen',
      order: 2,
    },
    create: {
      title: 'Erweiterte SQL-Techniken',
      description: 'Joins, Subqueries und komplexere Datenbankoperationen',
      order: 2,
    },
  });

  // Create topics
  const selectTopic = await prisma.topic.upsert({
    where: { 
      chapterId_title: {
        chapterId: basicChapter.id,
        title: 'SELECT-Statements'
      }
    },
    update: {
      description: 'Grundlagen der Datenabfrage mit SELECT',
      order: 1,
    },
    create: {
      chapterId: basicChapter.id,
      title: 'SELECT-Statements',
      description: 'Grundlagen der Datenabfrage mit SELECT',
      order: 1,
    },
  });

  const filterTopic = await prisma.topic.upsert({
    where: { 
      chapterId_title: {
        chapterId: basicChapter.id,
        title: 'WHERE-Klauseln'
      }
    },
    update: {
      description: 'Filtern von Daten mit WHERE-Bedingungen',
      order: 2,
    },
    create: {
      chapterId: basicChapter.id,
      title: 'WHERE-Klauseln',
      description: 'Filtern von Daten mit WHERE-Bedingungen',
      order: 2,
    },
  });

  const joinTopic = await prisma.topic.upsert({
    where: { 
      chapterId_title: {
        chapterId: advancedChapter.id,
        title: 'JOIN-Operationen'
      }
    },
    update: {
      description: 'Verknüpfung mehrerer Tabellen',
      order: 1,
    },
    create: {
      chapterId: advancedChapter.id,
      title: 'JOIN-Operationen',
      description: 'Verknüpfung mehrerer Tabellen',
      order: 1,
    },
  });

  // Create exercises
  
  // Multiple Choice Exercise
  const multipleChoiceExercise = await prisma.exercise.upsert({
    where: { id: 1 },
    update: {
      topicId: selectTopic.id,
      title: 'SQL Grundlagen Quiz',
      description: 'Welche der folgenden Aussagen über SELECT-Statements sind korrekt?',
      type: ExerciseType.MULTIPLE_CHOICE,
      difficulty: Difficulty.EASY,
      order: 1,
    },
    create: {
      topicId: selectTopic.id,
      title: 'SQL Grundlagen Quiz',
      description: 'Welche der folgenden Aussagen über SELECT-Statements sind korrekt?',
      type: ExerciseType.MULTIPLE_CHOICE,
      difficulty: Difficulty.EASY,
      order: 1,
    },
  });

  // Create answer options for multiple choice
  await prisma.answerOption.upsert({
    where: { id: 1 },
    update: {
      exerciseId: multipleChoiceExercise.id,
      text: 'SELECT wird verwendet, um Daten aus einer Datenbank abzurufen',
      isCorrect: true,
      order: 1,
    },
    create: {
      exerciseId: multipleChoiceExercise.id,
      text: 'SELECT wird verwendet, um Daten aus einer Datenbank abzurufen',
      isCorrect: true,
      order: 1,
    },
  });

  await prisma.answerOption.upsert({
    where: { id: 2 },
    update: {
      exerciseId: multipleChoiceExercise.id,
      text: 'Mit SELECT * werden alle Spalten einer Tabelle ausgewählt',
      isCorrect: true,
      order: 2,
    },
    create: {
      exerciseId: multipleChoiceExercise.id,
      text: 'Mit SELECT * werden alle Spalten einer Tabelle ausgewählt',
      isCorrect: true,
      order: 2,
    },
  });

  await prisma.answerOption.upsert({
    where: { id: 3 },
    update: {
      exerciseId: multipleChoiceExercise.id,
      text: 'SELECT kann nur eine Spalte gleichzeitig auswählen',
      isCorrect: false,
      order: 3,
    },
    create: {
      exerciseId: multipleChoiceExercise.id,
      text: 'SELECT kann nur eine Spalte gleichzeitig auswählen',
      isCorrect: false,
      order: 3,
    },
  });

  await prisma.answerOption.upsert({
    where: { id: 4 },
    update: {
      exerciseId: multipleChoiceExercise.id,
      text: 'FROM ist optional in einem SELECT-Statement',
      isCorrect: false,
      order: 4,
    },
    create: {
      exerciseId: multipleChoiceExercise.id,
      text: 'FROM ist optional in einem SELECT-Statement',
      isCorrect: false,
      order: 4,
    },
  });

  // Single Choice Exercise
  const singleChoiceExercise = await prisma.exercise.upsert({
    where: { id: 2 },
    update: {
      topicId: filterTopic.id,
      title: 'WHERE-Klausel Verwendung',
      description: 'Wofür wird die WHERE-Klausel in SQL verwendet?',
      type: ExerciseType.SINGLE_CHOICE,
      difficulty: Difficulty.EASY,
      order: 1,
    },
    create: {
      topicId: filterTopic.id,
      title: 'WHERE-Klausel Verwendung',
      description: 'Wofür wird die WHERE-Klausel in SQL verwendet?',
      type: ExerciseType.SINGLE_CHOICE,
      difficulty: Difficulty.EASY,
      order: 1,
    },
  });

  // Create answer options for single choice
  await prisma.answerOption.upsert({
    where: { id: 5 },
    update: {
      exerciseId: singleChoiceExercise.id,
      text: 'Zum Sortieren der Ergebnisse',
      isCorrect: false,
      order: 1,
    },
    create: {
      exerciseId: singleChoiceExercise.id,
      text: 'Zum Sortieren der Ergebnisse',
      isCorrect: false,
      order: 1,
    },
  });

  await prisma.answerOption.upsert({
    where: { id: 6 },
    update: {
      exerciseId: singleChoiceExercise.id,
      text: 'Zum Filtern von Zeilen basierend auf Bedingungen',
      isCorrect: true,
      order: 2,
    },
    create: {
      exerciseId: singleChoiceExercise.id,
      text: 'Zum Filtern von Zeilen basierend auf Bedingungen',
      isCorrect: true,
      order: 2,
    },
  });

  await prisma.answerOption.upsert({
    where: { id: 7 },
    update: {
      exerciseId: singleChoiceExercise.id,
      text: 'Zum Gruppieren von Daten',
      isCorrect: false,
      order: 3,
    },
    create: {
      exerciseId: singleChoiceExercise.id,
      text: 'Zum Gruppieren von Daten',
      isCorrect: false,
      order: 3,
    },
  });

  await prisma.answerOption.upsert({
    where: { id: 8 },
    update: {
      exerciseId: singleChoiceExercise.id,
      text: 'Zum Erstellen neuer Tabellen',
      isCorrect: false,
      order: 4,
    },
    create: {
      exerciseId: singleChoiceExercise.id,
      text: 'Zum Erstellen neuer Tabellen',
      isCorrect: false,
      order: 4,
    },
  });

  // Query Exercise
  const queryExercise = await prisma.exercise.upsert({
    where: { id: 3 },
    update: {
      topicId: selectTopic.id,
      title: 'Alle Studenten anzeigen',
      description: 'Schreiben Sie eine SQL-Abfrage, die alle Studenten aus der students-Tabelle anzeigt.',
      type: ExerciseType.QUERY,
      difficulty: Difficulty.EASY,
      databaseId: sampleDb.id,
      solution: 'SELECT * FROM students;',
      order: 2,
    },
    create: {
      topicId: selectTopic.id,
      title: 'Alle Studenten anzeigen',
      description: 'Schreiben Sie eine SQL-Abfrage, die alle Studenten aus der students-Tabelle anzeigt.',
      type: ExerciseType.QUERY,
      difficulty: Difficulty.EASY,
      databaseId: sampleDb.id,
      solution: 'SELECT * FROM students;',
      order: 2,
    },
  });

  // More complex Query Exercise
  const complexQueryExercise = await prisma.exercise.upsert({
    where: { id: 4 },
    update: {
      topicId: joinTopic.id,
      title: 'Studenten mit ihren Kursen',
      description: 'Erstellen Sie eine Abfrage, die alle Studenten mit ihren eingeschriebenen Kursen anzeigt. Zeigen Sie den Namen des Studenten und den Titel des Kurses an.',
      type: ExerciseType.QUERY,
      difficulty: Difficulty.MEDIUM,
      databaseId: sampleDb.id,
      solution: 'SELECT s.name, c.title FROM students s JOIN enrollments e ON s.id = e.student_id JOIN courses c ON e.course_id = c.id;',
      order: 1,
    },
    create: {
      topicId: joinTopic.id,
      title: 'Studenten mit ihren Kursen',
      description: 'Erstellen Sie eine Abfrage, die alle Studenten mit ihren eingeschriebenen Kursen anzeigt. Zeigen Sie den Namen des Studenten und den Titel des Kurses an.',
      type: ExerciseType.QUERY,
      difficulty: Difficulty.MEDIUM,
      databaseId: sampleDb.id,
      solution: 'SELECT s.name, c.title FROM students s JOIN enrollments e ON s.id = e.student_id JOIN courses c ON e.course_id = c.id;',
      order: 1,
    },
  });

  // Freetext Exercise
  const freetextExercise = await prisma.exercise.upsert({
    where: { id: 5 },
    update: {
      topicId: joinTopic.id,
      title: 'JOIN-Typen erklären',
      description: 'Erklären Sie den Unterschied zwischen INNER JOIN, LEFT JOIN und RIGHT JOIN. Geben Sie jeweils ein Beispiel an.',
      type: ExerciseType.FREETEXT,
      difficulty: Difficulty.MEDIUM,
      order: 2,
    },
    create: {
      topicId: joinTopic.id,
      title: 'JOIN-Typen erklären',
      description: 'Erklären Sie den Unterschied zwischen INNER JOIN, LEFT JOIN und RIGHT JOIN. Geben Sie jeweils ein Beispiel an.',
      type: ExerciseType.FREETEXT,
      difficulty: Difficulty.MEDIUM,
      order: 2,
    },
  });

  // Create OpenAI API Key setting
  await prisma.settings.create({
    data: {
      name: 'OPENAI_API_KEY',
      value: process.env.OPENAI_API_KEY || '',
      description: 'OpenAI API Key for AI-powered features (SQL query assistance, feedback generation)'
    }
  });

  // Create some sample progress for the students
  await prisma.progress.createMany({
    data: [
      {
        userId: student.id,
        exerciseId: multipleChoiceExercise.id,
        attempts: 2,
        isPassed: true,
        passedAt: new Date()
      },
      {
        userId: student.id,
        exerciseId: queryExercise.id,
        attempts: 1,
        isPassed: true,
        passedAt: new Date()
      },
      {
        userId: student2.id,
        exerciseId: multipleChoiceExercise.id,
        attempts: 1,
        isPassed: false
      },
      {
        userId: student2.id,
        exerciseId: singleChoiceExercise.id,
        attempts: 3,
        isPassed: true,
        passedAt: new Date()
      }
    ]
  });

  // Create some sample bookmarks
  await prisma.bookmark.createMany({
    data: [
      {
        userId: student.id,
        exerciseId: complexQueryExercise.id
      },
      {
        userId: student.id,
        exerciseId: freetextExercise.id
      },
      {
        userId: student2.id,
        exerciseId: queryExercise.id
      }
    ]
  });

  // Create some sample submissions
  await prisma.submission.createMany({
    data: [
      {
        userId: student.id,
        exerciseId: queryExercise.id,
        answerText: 'SELECT * FROM students;',
        isCorrect: true,
        feedback: 'Perfekt! Diese Abfrage gibt alle Studenten zurück.'
      },
      {
        userId: student2.id,
        exerciseId: queryExercise.id,
        answerText: 'SELECT name FROM students;',
        isCorrect: false,
        feedback: 'Fast richtig! Die Aufgabe verlangt aber alle Spalten (*), nicht nur den Namen.'
      },
      {
        userId: student.id,
        exerciseId: complexQueryExercise.id,
        answerText: 'SELECT s.name, c.title FROM students s JOIN enrollments e ON s.id = e.student_id JOIN courses c ON e.course_id = c.id;',
        isCorrect: true,
        feedback: 'Exzellent! Sie haben die JOIN-Operation korrekt verwendet.'
      }
    ]
  });

  console.log({
    message: 'Seed completed successfully',
    users: {
      admin: { email: admin.email, role: admin.role },
      tutor: { email: tutor.email, role: tutor.role },
      student: { email: student.email, role: student.role },
      student2: { email: student2.email, role: student2.role },
    },
    database: {
      name: sampleDb.name,
      description: sampleDb.description,
      actualDbName: sampleDb.schemaSql,
    },
    chapters: [
      { id: basicChapter.id, title: basicChapter.title },
      { id: advancedChapter.id, title: advancedChapter.title },
    ],
    topics: [
      { id: selectTopic.id, title: selectTopic.title, chapter: basicChapter.title },
      { id: filterTopic.id, title: filterTopic.title, chapter: basicChapter.title },
      { id: joinTopic.id, title: joinTopic.title, chapter: advancedChapter.title },
    ],
    exercises: [
      { id: multipleChoiceExercise.id, title: multipleChoiceExercise.title, type: multipleChoiceExercise.type },
      { id: singleChoiceExercise.id, title: singleChoiceExercise.title, type: singleChoiceExercise.type },
      { id: queryExercise.id, title: queryExercise.title, type: queryExercise.type },
      { id: complexQueryExercise.id, title: complexQueryExercise.title, type: complexQueryExercise.type },
      { id: freetextExercise.id, title: freetextExercise.title, type: freetextExercise.type },
    ],
    additionalData: {
      settings: 2,
      progressEntries: 4,
      bookmarks: 3,
      submissions: 3
    }
  });
}

main()
  .catch((e) => {
    console.error('Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });