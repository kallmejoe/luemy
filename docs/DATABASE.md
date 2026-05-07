# Database Schema

Luemy uses SQLite with the following data model. Database is initialized automatically in `server/utils/db.ts`.

## Tables

### users

Core user table with authentication data.

```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('professor', 'student', 'admin'))
);
```

| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER | Primary key |
| `name` | TEXT | Full name |
| `email` | TEXT | Unique email |
| `password` | TEXT | Hashed password (bcrypt) |
| `role` | TEXT | `professor`, `student`, or `admin` |

### professors_info

Extended profile for professors/instructors.

```sql
CREATE TABLE professors_info (
    user_id INTEGER PRIMARY KEY,
    department TEXT,
    phone TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE);
```

| Column | Type | Description |
|--------|------|-------------|
| `user_id` | INTEGER | FK to users.id |
| `department` | TEXT | Department name |
| `phone` | TEXT | Contact number |

### students_info

Extended profile for students.

```sql
CREATE TABLE students_info (
    user_id INTEGER PRIMARY KEY,
    major TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE);
```

| Column | Type | Description |
|--------|------|-------------|
| `user_id` | INTEGER | FK to users.id |
| `major` | TEXT | Major/subject |

### courses

Course catalog.

```sql
CREATE TABLE courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    professor_id INTEGER NOT NULL,
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (professor_id) REFERENCES professors_info(user_id) ON DELETE RESTRICT);
```

| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER | Primary key |
| `name` | TEXT | Course name |
| `description` | TEXT | Course description |
| `professor_id` | INTEGER | FK to users.id (professor) |
| `active` | INTEGER | 1 = active, 0 = inactive |
| `created_at` | TEXT | Creation timestamp |

### course_enrollments

Many-to-many relationship between students and courses.

```sql
CREATE TABLE course_enrollments (
    student_id INTEGER NOT NULL,
    course_id INTEGER NOT NULL,
    PRIMARY KEY (student_id, course_id),
    FOREIGN KEY (student_id) REFERENCES students_info(user_id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE);
```

| Column | Type | Description |
|--------|------|-------------|
| `student_id` | INTEGER | FK to users.id (student) |
| `course_id` | INTEGER | FK to courses.id |

### course_time_slots

Scheduled times for courses.

```sql
CREATE TABLE course_time_slots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_id INTEGER NOT NULL,
    day_of_week TEXT NOT NULL,
    start_time TEXT NOT NULL, 
    end_time TEXT NOT NULL,   
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE);
```

### professor_av_time_slots

Office hours for professors.

```sql
CREATE TABLE professor_av_time_slots (
    id INTEGER PRIMARY KEY AUTOINCREMENT, 
    professor_id INTEGER NOT NULL,
    day_of_week TEXT NOT NULL,
    start_time TEXT NOT NULL, 
    end_time TEXT NOT NULL,
    hall TEXT NOT NULL CHECK(hall IN ('1', '2', '3', '4', 'A', 'B')),
    FOREIGN KEY (professor_id) REFERENCES professors_info(user_id) ON DELETE CASCADE,
    UNIQUE(day_of_week, start_time, end_time, hall));
```

| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER | Primary key |
| `professor_id` | INTEGER | FK to users.id |
| `day_of_week` | TEXT | Day (Monday-Sunday) |
| `start_time` | TEXT | Start time (HH:MM) |
| `end_time` | TEXT | End time (HH:MM) |
| `hall` | TEXT | Location (`1`, `2`, `3`, `4`, `A`, `B`) |

### assignments

Course assignments.

```sql
CREATE TABLE assignments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    max_score REAL NOT NULL DEFAULT 100,
    due_date TEXT, 
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE);
```

| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER | Primary key |
| `course_id` | INTEGER | FK to courses.id |
| `title` | TEXT | Assignment title |
| `description` | TEXT | Instructions |
| `max_score` | REAL | Maximum points (default: 100) |
| `due_date` | TEXT | Due date (ISO 8601) |

### assignment_submissions

Student submissions for assignments.

```sql
CREATE TABLE assignment_submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    assignment_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    submission_date TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status TEXT NOT NULL DEFAULT 'Pending' CHECK(status IN ('Pending', 'Submitted', 'Graded')),
    FOREIGN KEY (student_id) REFERENCES students_info(user_id) ON DELETE CASCADE,
    FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE,
    UNIQUE(student_id, assignment_id));
```

| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER | Primary key |
| `student_id` | INTEGER | FK to users.id |
| `assignment_id` | INTEGER | FK to assignments.id |
| `content` | TEXT | Submission content |
| `submission_date` | TEXT | Submission timestamp |
| `status` | TEXT | `Pending`, `Submitted`, or `Graded` |

### assignment_grades

Grades for submissions.

```sql
CREATE TABLE assignment_grades (
    student_id INTEGER NOT NULL,
    assignment_id INTEGER NOT NULL,
    grade REAL,
    feedback TEXT,
    PRIMARY KEY (student_id, assignment_id),
    FOREIGN KEY (student_id) REFERENCES students_info(user_id) ON DELETE CASCADE,
    FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE);
```

| Column | Type | Description |
|--------|------|-------------|
| `student_id` | INTEGER | FK to users.id |
| `assignment_id` | INTEGER | FK to assignments.id |
| `grade` | REAL | Numeric grade |
| `feedback` | TEXT | Instructor feedback |

## Relationships

```
users
├── professors_info (1:1)
├── students_info (1:1)
└── courses (1:many)
    └── course_enrollments (many:many)
        └── students
    └── assignments (1:many)
        └── assignment_submissions (many:1)
            └── assignment_grades (1:1)
```

## Database Operations

### Reset Database

```bash
rm db/database.sqlite
# Restart dev server to reinitialize
```

### Access in Server Endpoints

```typescript
import { db } from "../../utils/db";

// Insert
const result = db.prepare("INSERT INTO table (col) VALUES (?)").run(value);
const newId = result.lastInsertRowid;

// Select single
const row = db.prepare("SELECT * FROM table WHERE id = ?").get(id);

// Select all
const rows = db.prepare("SELECT * FROM table").all();
```

### Transactions

Use for batch operations:

```typescript
const insertMany = db.transaction((items) => {
  for (const item of items) {
    db.prepare("INSERT INTO table (col) VALUES (?)").run(item);
  }
});

insertMany(itemList);
```