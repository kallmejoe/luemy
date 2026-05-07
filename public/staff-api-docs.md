# API Documentation

Complete reference for all backend endpoints. Staff members can use these APIs to automate administrative tasks.

---

## Table of Contents

- [Authentication](#authentication)
- [Courses](#courses)
- [Assignments](#assignments)
- [Availability (Office Hours)](#availability-office-hours)
- [Staff](#staff)
- [Students](#students)
- [User Profile](#user-profile)

---

## Quick Start: Automate with the API

### 1. Login and get a token

Send a `POST` request to `/api/auth/login` with an admin email and password:

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@luemy.edu", "password": "your-password"}'
```

**Response:**

```json
{
  "success": true,
  "user": { "id": 1, "email": "admin@luemy.edu", "name": "Admin", "role": "admin" },
  "token": "eyJhbGciOiJIUzI1NiJ9..."
}
```

### 2. Use the token for subsequent requests

Pass the token in the `Authorization` header:

```bash
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiJ9..."
```

### 3. Automate batch operations

Example: Create multiple courses via script:

```bash
#!/bin/bash
TOKEN="your-jwt-token"

for course in "CS101:Intro to CS" "CS201:Data Structures" "CS301:Algorithms"; do
  NAME=$(echo $course | cut -d: -f2)
  PROF_ID=$(echo $course | cut -d: -f1)

  curl -X POST http://localhost:3000/api/courses \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{\"name\": \"$NAME\", \"professorID\": $PROF_ID}"
done
```

---

## API Conventions

| Convention | Detail |
|---|---|
| **Base URL** | `http://localhost:3000/api` |
| **Auth** | Bearer token in `Authorization` header |
| **Response format** | Always `{ success: boolean, ... }` |
| **Errors** | `{ success: false, message: string }` |
| **Status codes** | `401` (unauthorized), `403` (forbidden), `404` (not found) |

---

## Authentication

### POST /api/auth/login

Authenticate with email and password. Returns a JWT token (7-day expiry).

**Request body:**

```json
{ "email": "string", "password": "string" }
```

**Response:**

```json
{
  "success": true,
  "user": { "id": 1, "email": "string", "name": "string", "role": "string" },
  "token": "string"
}
```

### POST /api/auth/signup

Register a new user. Role can be `"student"`, `"professor"`, or `"admin"`.

**Request body:**

```json
{ "email": "string", "password": "string", "name": "string", "role": "string" }
```

**Response:**

```json
{ "success": true, "userId": number }
```

### GET /api/auth/me

Get the currently authenticated user's profile.

**Headers:** `Authorization: Bearer <token>`

**Response:**

```json
{ "success": true, "user": { "id": 1, "email": "string", "name": "string", "role": "string" } }
```

---

## Courses

### GET /api/courses

List all active courses (public, no auth needed).

**Response:**

```json
{
  "success": true,
  "courses": [
    {
      "id": 1, "name": "string", "description": "string",
      "active": 1, "created_at": "string",
      "professor_id": 1, "professor_name": "string",
      "professor_email": "string", "professor_department": "string"
    }
  ]
}
```

### POST /api/courses

Create a new course (professor role required).

**Request body:**

```json
{ "name": "string", "description": "string (optional)", "active": true (optional) }
```

**Response:**

```json
{ "success": true, "courseId": number }
```

### GET /api/courses/list-courses

List all courses (public, no auth needed). Includes inactive courses.

**Response:**

```json
{
  "success": true,
  "courses": [
    { "id": 1, "name": "string", "professor_id": 1, "active": 1, "description": "string", "professor_name": "string" }
  ]
}
```

### GET /api/courses/[id]

Get a single course by ID (authenticated).

**Response:**

```json
{ "success": true, "course": { "id": 1, "name": "string", "description": "string", "professor_id": 1, "active": 1, "created_at": "string" } }
```

### PUT /api/courses/[id]

Update a course (professor role required, must own the course).

**Request body** (all optional):

```json
{ "name": "string", "description": "string", "active": boolean }
```

**Response:**

```json
{ "success": true, "message": "Course updated successfully", "course": { ... } }
```

### GET /api/courses/[id]/students

Get students enrolled in a course, with their submissions and grades (professor role required).

**Response:**

```json
{
  "success": true,
  "students": [
    {
      "id": 1, "name": "string", "email": "string",
      "student_id": "string", "enrollment_date": "string",
      "submissions": [
        { "assignment_id": 1, "assignment_title": "string", "max_score": 100,
          "status": "string", "submission_date": "string", "grade": 85, "feedback": "string" }
      ],
      "stats": { "total_assignments": 5, "submitted": 3, "graded": 2 }
    }
  ]
}
```

### GET /api/courses/my-courses

Get courses owned by the authenticated professor (professor role required).

### GET /api/courses/student/[id]

Get course details with assignments for a student (student role required, must be enrolled).

---

## Assignments

### POST /api/assignments

Create a new assignment (professor role required, must own the course).

**Request body:**

```json
{
  "course_id": 1,
  "title": "string",
  "description": "string (optional)",
  "max_score": 100,
  "due_date": "2026-06-01T23:59:00Z"
}
```

**Response:**

```json
{ "success": true, "assignmentId": number }
```

### GET /api/assignments/[id]

Get assignment details with the student's submission (student role required).

### GET /api/assignments/professor-assignments

Get all assignments for courses owned by the authenticated professor.

### GET /api/assignments/professor/[id]

Get full assignment detail with all submissions, grades, and stats (professor role required, must own course).

**Response:**

```json
{
  "success": true,
  "assignment": { "id": 1, "course_id": 1, "title": "string", "description": "string", "max_score": 100, "due_date": "string", "course_name": "string" },
  "submissions": [
    { "id": 1, "student_id": 1, "student_name": "string", "student_email": "string",
      "content": "string", "submission_date": "string", "status": "string",
      "grade": 85, "feedback": "string" }
  ],
  "stats": { "total": 30, "submitted": 25, "graded": 20 }
}
```

### GET /api/assignments/student-assignments

Get assignments for courses the authenticated student is enrolled in.

### GET /api/assignments/submissions

Get all submissions for courses owned by the professor (professor role required).

### POST /api/assignments/submit

Submit an assignment (student role required, must be enrolled).

**Request body:**

```json
{ "assignmentId": 1, "content": "string" }
```

Supports resubmission (upserts on student + assignment).

### GET /api/assignments/submission/[id]

Get the authenticated student's submission for a specific assignment (student role required).

### POST /api/assignments/grade

Grade a student's submission (professor role required, must own the course).

**Request body:**

```json
{ "assignmentId": 1, "studentId": 1, "grade": 85, "feedback": "string (optional)" }
```

### GET /api/assignments/upcoming

Get upcoming assignments (due within 30 days) for the authenticated student.

---

## Availability (Office Hours)

### POST /api/availability/add

Add an availability time slot (professor role required).

**Request body:**

```json
{ "dayOfWeek": "Monday", "startTime": "09:00", "endTime": "10:00", "hall": "A" }
```

`hall` must be one of: `"1"`, `"2"`, `"3"`, `"4"`, `"A"`, `"B"`.

### GET /api/availability/list

List all availability slots for the authenticated professor.

### DELETE /api/availability/[id]

Delete an availability slot (professor role required, must own the slot).

---

## Staff

### GET /api/staff/students

List all students with their majors and enrolled course counts (public, no auth needed).

**Response:**

```json
{
  "success": true,
  "students": [
    { "id": 1, "name": "string", "email": "string", "role": "student", "major": "string", "enrolled_courses_count": 5 }
  ]
}
```

Automation: Export student data to CSV.

```bash
curl -s http://localhost:3000/api/staff/students \
  | jq -r '.students[] | [.id, .name, .email, .major, .enrolled_courses_count] | @csv' \
  > students.csv
```

### GET /api/staff/directory

Get the staff directory with professors, their courses, and office hours (student role required).

**Response:**

```json
{
  "success": true,
  "staff": [
    {
      "id": 1, "name": "string", "email": "string",
      "department": "string", "phone": "string",
      "assignedCourses": ["CS101", "CS201"],
      "officeHours": [
        { "day": "Monday", "start": "09:00", "end": "10:00" }
      ]
    }
  ]
}
```

### POST /api/staff/office-hours

Add an office hours time slot (professor role required).

**Request body:**

```json
{ "day": "Monday", "start": "09:00", "end": "10:00" }
```

`day` must be a valid day of the week. Times in 24-hour format (`HH:MM`).

---

## Student Endpoints

### GET /api/student/activeCourses

Get active courses for the authenticated student.

### POST /api/student/enroll

Enroll in one or more courses (authenticated).

**Request body:**

```json
{ "courseIds": [1, 2, 3] }
```

Uses a DB transaction, skips already-enrolled courses.

---

## User Profile

### PUT /api/user

Update the authenticated user's profile (all fields optional).

**Request body:**

```json
{
  "name": "string (2-100 chars)",
  "email": "string (valid email)",
  "currentPassword": "string (required if changing password)",
  "newPassword": "string (min 8 chars)"
}
```

**Response:**

```json
{ "success": true, "message": "Profile updated successfully", "user": { "id": 1, "email": "string", "name": "string", "role": "string" } }
```

---

## Automation Examples for Staff

### Export all student data

```bash
#!/bin/bash
curl -s http://localhost:3000/api/staff/students \
  | jq -r '.students[] | [.id, .name, .email, .major, .enrolled_courses_count] | @csv' \
  > students_export.csv
echo "Exported $(wc -l < students_export.csv) students"
```

### Bulk-enroll students from CSV

```bash
#!/bin/bash
TOKEN="your-admin-token"
CSV="enrollments.csv"  # Format: student_id,course_id

while IFS=',' read -r STUDENT_ID COURSE_ID; do
  curl -s -X POST http://localhost:3000/api/student/enroll \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{\"courseIds\": [$COURSE_ID]}" \
    | jq '.message'
done < "$CSV"
```

### Monitor assignment submissions

```bash
#!/bin/bash
TOKEN="your-token"
COURSE_ID=$1

curl -s "http://localhost:3000/api/courses/$COURSE_ID/students" \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.students[] | { name: .name, stats: .stats }'
```

### Generate course report

```bash
#!/bin/bash
TOKEN="your-token"

for course in $(curl -s http://localhost:3000/api/courses/my-courses \
  -H "Authorization: Bearer $TOKEN" | jq -r '.courses[].id'); do

  echo "--- Course $course ---"
  curl -s "http://localhost:3000/api/courses/$course/students" \
    -H "Authorization: Bearer $TOKEN" \
    | jq '{ course: $course, student_count: (.students | length) }' \
    --arg course "$course"
done
```

---

## Notes & Tips

- All endpoints return `{ success: boolean }` — always check `success` before using the data
- Tokens expire after **7 days** — regenerate via `POST /api/auth/login`
- Use `jq` for parsing JSON responses in shell scripts
- For batch operations, prefer using a **DB transaction** when calling multiple endpoints
- The `courses/create.post.ts` endpoint is **unauthenticated** — avoid using it in production automation; prefer `POST /api/courses` instead
