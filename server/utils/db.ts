import Database from "better-sqlite3"
import path from "path"

const dbPath = path.resolve("./db/database.sqlite")
export const db = new Database(dbPath)

// Initialize schema immediately when db module is imported
try {
  db.exec(`
-- users table
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('professor', 'student', 'admin'))
);

-- proffesor information
CREATE TABLE IF NOT EXISTS professors_info (
    user_id INTEGER PRIMARY KEY,
    department TEXT,
    phone TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- student information 
CREATE TABLE IF NOT EXISTS students_info (
    user_id INTEGER PRIMARY KEY,
    major TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- courses
CREATE TABLE IF NOT EXISTS courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    professor_id INTEGER NOT NULL,
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (professor_id) REFERENCES professors_info(user_id) ON DELETE RESTRICT
);

-- course_time_slots
CREATE TABLE IF NOT EXISTS course_time_slots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_id INTEGER NOT NULL,
    day_of_week TEXT NOT NULL,
    start_time TEXT NOT NULL, 
    end_time TEXT NOT NULL,   
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS professor_av_time_slots (
    id INTEGER PRIMARY KEY AUTOINCREMENT, 
    professor_id INTEGER NOT NULL,
    day_of_week TEXT NOT NULL,
    start_time TEXT NOT NULL, 
    end_time TEXT NOT NULL,  
    FOREIGN KEY (professor_id) REFERENCES professors_info(user_id) ON DELETE CASCADE
);

-- courses students enrollments  
CREATE TABLE IF NOT EXISTS course_enrollments (
    student_id INTEGER NOT NULL,
    course_id INTEGER NOT NULL,
    PRIMARY KEY (student_id, course_id),
    FOREIGN KEY (student_id) REFERENCES students_info(user_id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS assignments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    max_score REAL NOT NULL DEFAULT 100,
    due_date TEXT, 
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS assignment_grades (
    student_id INTEGER NOT NULL,
    assignment_id INTEGER NOT NULL,
    grade REAL,
    feedback TEXT,
    PRIMARY KEY (student_id, assignment_id),
    FOREIGN KEY (student_id) REFERENCES students_info(user_id) ON DELETE CASCADE,
    FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS assignment_submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    assignment_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    submission_date TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status TEXT NOT NULL DEFAULT 'Pending' CHECK(status IN ('Pending', 'Submitted', 'Graded')),
    FOREIGN KEY (student_id) REFERENCES students_info(user_id) ON DELETE CASCADE,
    FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE,
    UNIQUE(student_id, assignment_id)
);
  `)

  try {
    db.exec("ALTER TABLE assignment_grades ADD COLUMN feedback TEXT")
  } catch {
    // Column already exists on initialized databases.
  }

  try {
    db.exec("ALTER TABLE professors_info ADD COLUMN phone TEXT")
  } catch {
    // Column already exists on initialized databases.
  }

  try {
    db.exec(`
      CREATE UNIQUE INDEX IF NOT EXISTS uq_professor_av_time_slots
      ON professor_av_time_slots (professor_id, day_of_week, start_time, end_time)
    `)
  } catch {
    // Index already exists on initialized databases.
  }

  console.log('[DB] Database initialized successfully')
} catch (err) {
  console.error('[DB] Schema initialization error:', err)
  throw err
}
