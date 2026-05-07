# API Reference

All backend endpoints with request/response schemas.

## Base URL

```
http://localhost:3000/api
```

## Authentication

All authenticated endpoints require a JWT token in the `Authorization` header:

```
Authorization: Bearer <token>
```

Token valid for 7 days. Obtain via `POST /api/auth/login`.

## Response Format

All endpoints return:

```json
{ "success": true, ...data }
```

On error:

```json
{ "success": false, "message": "Error description" }
```

HTTP status codes:
- `200` - Success
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not found
- `500` - Server error

---

## Authentication

### POST /api/auth/login

Authenticate with credentials.

**Request:**
```json
{ "email": "string", "password": "string" }
```

**Response:**
```json
{
  "success": true,
  "user": { "id": 1, "email": "string", "name": "string", "role": "string" },
  "token": "eyJhbGciOiJIUzI1NiJ9..."
}
```

---

### POST /api/auth/signup

Register a new user.

**Request:**
```json
{ "email": "string", "password": "string", "name": "string", "role": "string" }
```

`role` must be: `student`, `professor`, or `admin`

**Response:**
```json
{ "success": true, "userId": 1 }
```

---

### GET /api/auth/me

Get current user profile.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{ "success": true, "user": { "id": 1, "email": "string", "name": "string", "role": "string" } }
```

---

## Courses

### GET /api/courses

List active courses (public, no auth).

**Response:**
```json
{
  "success": true,
  "courses": [{
    "id": 1, "name": "string", "description": "string",
    "active": 1, "created_at": "string",
    "professor_id": 1, "professor_name": "string",
    "professor_email": "string", "professor_department": "string"
  }]
}
```

---

### POST /api/courses

Create a course (professor role required).

**Request:**
```json
{ "name": "string", "description": "string (optional)", "active": true (optional) }
```

**Response:**
```json
{ "success": true, "courseId": 1 }
```

---

### GET /api/courses/[id]

Get a single course.

**Response:**
```json
{ "success": true, "course": { "id": 1, "name": "string", "description": "string", "professor_id": 1, "active": 1, "created_at": "string" } }
```

---

### PUT /api/courses/[id]

Update a course (professor role required, must own the course).

**Request:**
```json
{ "name": "string (optional)", "description": "string (optional)", "active": true (optional) }
```

**Response:**
```json
{ "success": true, "message": "Course updated successfully", "course": { ... } }
```

---

### GET /api/courses/[id]/students

Get enrolled students with submissions (professor role required).

**Response:**
```json
{
  "success": true,
  "students": [{
    "id": 1, "name": "string", "email": "string",
    "student_id": "string", "enrollment_date": "string",
    "submissions": [...],
    "stats": { "total_assignments": 5, "submitted": 3, "graded": 2 }
  }]
}
```

---

### GET /api/courses/my-courses

Get professor's own courses (professor role required).

---

### GET /api/courses/list-courses

List all courses including inactive (public, no auth).

---

### GET /api/courses/student/[id]

Get course for student (student role required, must be enrolled).

---

## Assignments

### POST /api/assignments

Create an assignment (professor role required).

**Request:**
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
{ "success": true, "assignmentId": 1 }
```

---

### GET /api/assignments/[id]

Get assignment for student (student role required).

---

### GET /api/assignments/professor-assignments

Get all professor's assignments (professor role).

---

### GET /api/assignments/professor/[id]

Get assignment with all submissions (professor role).

**Response:**
```json
{
  "success": true,
  "assignment": { ... },
  "submissions": [...],
  "stats": { "total": 30, "submitted": 25, "graded": 20 }
}
```

---

### GET /api/assignments/student-assignments

Get student's assignments (student role).

---

### GET /api/assignments/submissions

Get all submissions for professor's courses (professor role).

---

### POST /api/assignments/submit

Submit assignment (student role required).

**Request:**
```json
{ "assignmentId": 1, "content": "string" }
```

Supports resubmission.

**Response:**
```json
{ "success": true, "message": "Assignment submitted successfully", "submissionId": 1 }
```

---

### GET /api/assignments/submission/[id]

Get student's submission for an assignment (student role).

---

### POST /api/assignments/grade

Grade a submission (professor role required).

**Request:**
```json
{ "assignmentId": 1, "studentId": 1, "grade": 85, "feedback": "string (optional)" }
```

**Response:**
```json
{ "success": true, "message": "Grade saved successfully" }
```

---

### GET /api/assignments/upcoming

Get upcoming assignments due within 30 days (student role).

---

## Availability

### POST /api/availability/add

Add office hours (professor role).

**Request:**
```json
{ "dayOfWeek": "Monday", "startTime": "09:00", "endTime": "10:00", "hall": "A" }
```

`hall`: `1`, `2`, `3`, `4`, `A`, or `B`

**Response:**
```json
{ "success": true, "id": 1 }
```

---

### GET /api/availability/list

List professor's availability slots.

---

### DELETE /api/availability/[id]

Delete availability slot (professor role, must own the slot).

---

## Staff

### GET /api/staff/students

List all students (public, no auth).

**Response:**
```json
{
  "success": true,
  "students": [{
    "id": 1, "name": "string", "email": "string",
    "role": "student", "major": "string", "enrolled_courses_count": 5
  }]
}
```

---

### GET /api/staff/directory

Get staff directory (student role required).

**Response:**
```json
{
  "success": true,
  "staff": [{
    "id": 1, "name": "string", "email": "string",
    "department": "string", "phone": "string",
    "assignedCourses": ["CS101", "CS201"],
    "officeHours": [{ "day": "Monday", "start": "09:00", "end": "10:00" }]
  }]
}
```

---

### POST /api/staff/office-hours

Set office hours (professor role).

**Request:**
```json
{ "day": "Monday", "start": "09:00", "end": "10:00" }
```

---

## Student

### GET /api/student/activeCourses

Get student's active courses.

---

### POST /api/student/enroll

Enroll in courses.

**Request:**
```json
{ "courseIds": [1, 2, 3] }
```

**Response:**
```json
{ "success": true, "message": "Successfully enrolled in 3 courses.", "addedCount": 3 }
```

---

## User

### PUT /api/user

Update user profile.

**Request:**
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

## Automation Examples

### Export Students to CSV

```bash
curl -s http://localhost:3000/api/staff/students \
  | jq -r '.students[] | [.id, .name, .email, .major, .enrolled_courses_count] | @csv' \
  > students.csv
```

### Login and Call API

```bash
# Login
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@luemy.edu", "password": "pass"}' \
  | jq -r '.token')

# Use token
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

### Bulk Enroll

```bash
#!/bin/bash
TOKEN="your-jwt-token"

for COURSE_ID in 1 2 3; do
  curl -s -X POST http://localhost:3000/api/student/enroll \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{\"courseIds\": [$COURSE_ID]}"
done
```