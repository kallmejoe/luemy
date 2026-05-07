<script setup lang="ts">
import { marked } from "marked"
import { ref } from "vue"

definePageMeta({
  middleware: ["auth"],
})

const markdown = `

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

Send a POST request to /api/auth/login with an admin email and password:

\`\`\`bash
curl -X POST http://localhost:3000/api/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"email": "admin@luemy.edu", "password": "your-password"}'
\`\`\`

### 2. Use the token for subsequent requests

Pass the token in the Authorization header:

\`\`\`bash
curl http://localhost:3000/api/auth/me \\
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiJ9..."
\`\`\`

---

## API Conventions

| Convention | Detail |
|---|---|
| **Base URL** | http://localhost:3000/api |
| **Auth** | Bearer token in Authorization header |
| **Response format** | Always { success: boolean, ... } |
| **Errors** | { success: false, message: string } |

---

## Authentication

### POST /api/auth/login

Authenticate with email and password. Returns a JWT token (7-day expiry).

**Request body:** { "email": "string", "password": "string" }

**Response:** { "success": true, "user": { "id", "email", "name", "role" }, "token": "string" }

### POST /api/auth/signup

Register a new user. Role can be "student", "professor", or "admin".

### GET /api/auth/me

Get the currently authenticated user's profile.

---

## Courses

### GET /api/courses

List all active courses (public, no auth needed).

### POST /api/courses

Create a new course (professor role required).

**Request body:** { "name": "string", "description": "string (optional)", "active": true (optional) }

### GET /api/courses/[id]

Get a single course by ID.

### PUT /api/courses/[id]

Update a course (professor role required, must own the course).

### GET /api/courses/[id]/students

Get students enrolled in a course with their submissions and grades (professor role required).

### GET /api/courses/my-courses

Get courses owned by the authenticated professor.

### GET /api/courses/student/[id]

Get course details for a student (student role required).

---

## Assignments

### POST /api/assignments

Create a new assignment (professor role required).

**Request body:** { "course_id": 1, "title": "string", "max_score": 100, "due_date": "2026-06-01T23:59:00Z" }

### GET /api/assignments/[id]

Get assignment details.

### GET /api/assignments/professor-assignments

Get all assignments for courses owned by the authenticated professor.

### GET /api/assignments/professor/[id]

Get assignment detail with all submissions and grades.

### GET /api/assignments/student-assignments

Get assignments for enrolled courses (student role).

### GET /api/assignments/submissions

Get all submissions for the professor's courses.

### POST /api/assignments/submit

Submit an assignment (student role required).

**Request body:** { "assignmentId": 1, "content": "string" }

### POST /api/assignments/grade

Grade a submission (professor role required).

**Request body:** { "assignmentId": 1, "studentId": 1, "grade": 85, "feedback": "string (optional)" }

### GET /api/assignments/upcoming

Get upcoming assignments due within 30 days (student role).

---

## Availability

### POST /api/availability/add

Add office hours slot (professor role).

**Request body:** { "dayOfWeek": "Monday", "startTime": "09:00", "endTime": "10:00", "hall": "A" }

hall must be: "1", "2", "3", "4", "A", or "B"

### GET /api/availability/list

List all availability slots.

### DELETE /api/availability/[id]

Delete a slot.

---

## Staff

### GET /api/staff/students

List all students (public, no auth).

**Response:** { "success": true, "students": [{ "id", "name", "email", "major", "enrolled_courses_count" }] }

### GET /api/staff/directory

Get staff directory with courses and office hours (student role).

### POST /api/staff/office-hours

Set office hours (professor role).

**Request body:** { "day": "Monday", "start": "09:00", "end": "10:00" }

---

## Student

### GET /api/student/activeCourses

Get active courses for the student.

### POST /api/student/enroll

Enroll in courses.

**Request body:** { "courseIds": [1, 2, 3] }

---

## User Profile

### PUT /api/user

Update profile.

**Request body:** { "name": "string", "email": "string", "currentPassword": "string", "newPassword": "string" }

---

## Automation Examples

### Export students to CSV

\`\`\`bash
curl -s http://localhost:3000/api/staff/students | jq -r '.students[] | @csv' > students.csv
\`\`\`

### Monitor submissions

\`\`\`bash
curl -s http://localhost:3000/api/courses/$COURSE_ID/students -H "Authorization: Bearer $TOKEN"
\`\`\`

---

## Notes

- All endpoints return { success: boolean }
- Tokens expire after 7 days
- Use jq for parsing JSON in scripts
- Prefer POST /api/courses (authenticated) over /api/courses/create

`

const html = ref("")

const renderDocs = async () => {
  try {
    html.value = await marked.parse(markdown)
  } catch (err) {
    console.error("Failed to parse markdown:", err)
    html.value = "<h1>Error</h1><p>Failed to render documentation.</p>"
  }
}

renderDocs()
</script>

<template>
  <div class="api-docs-page">
    <div class="api-docs-heading">
      <h1 class="page-title">API Documentation</h1>
      <p class="page-subtitle">Reference for all backend endpoints and automation guides</p>
    </div>
    <div class="markdown-body" v-html="html" /><!-- eslint-disable-line vue/no-v-html -->
  </div>
</template>

<style scoped>
.api-docs-page {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.api-docs-heading {
  position: sticky;
  top: 0;
  z-index: 5;
  padding-bottom: 0.75rem;
  background: var(--background);
}

.page-title {
  font-size: 1.875rem;
  font-weight: 700;
  color: var(--color-text);
  margin: 0 0 0.5rem 0;
}

.page-subtitle {
  font-size: 0.95rem;
  color: var(--muted-foreground);
  margin: 0;
}

.markdown-body {
  line-height: 1.7;
  color: var(--foreground);
}

.markdown-body :deep(h1),
.markdown-body :deep(h2),
.markdown-body :deep(h3),
.markdown-body :deep(h4) {
  color: var(--foreground);
  font-weight: 700;
  margin: 2rem 0 0.75rem;
  line-height: 1.3;
}

.markdown-body :deep(h1) {
  font-size: 2rem;
  border-bottom: 2px solid var(--border);
  padding-bottom: 0.5rem;
}

.markdown-body :deep(h2) {
  font-size: 1.5rem;
  border-bottom: 1px solid var(--border);
  padding-bottom: 0.4rem;
}

.markdown-body :deep(h3) {
  font-size: 1.2rem;
}

.markdown-body :deep(p) {
  margin: 0 0 1rem;
}

.markdown-body :deep(a) {
  color: var(--primary);
  text-decoration: none;
}

.markdown-body :deep(a:hover) {
  text-decoration: underline;
}

.markdown-body :deep(strong) {
  font-weight: 600;
}

.markdown-body :deep(code) {
  background: var(--muted);
  padding: 0.15em 0.4em;
  border-radius: var(--radius-sm);
  font-family: var(--font-mono);
  font-size: 0.875em;
  color: var(--foreground);
}

.markdown-body :deep(pre) {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 1rem;
  overflow-x: auto;
  margin: 0 0 1rem;
}

.markdown-body :deep(pre code) {
  background: none;
  padding: 0;
  border-radius: 0;
  font-size: 0.85rem;
  line-height: 1.6;
  color: var(--foreground);
}

.markdown-body :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 0 0 1rem;
  font-size: 0.9rem;
}

.markdown-body :deep(th) {
  text-align: left;
  padding: 0.6rem 0.75rem;
  font-weight: 600;
  background: var(--card);
  border-bottom: 2px solid var(--border);
  color: var(--muted-foreground);
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.markdown-body :deep(td) {
  padding: 0.6rem 0.75rem;
  border-bottom: 1px solid var(--border);
}

.markdown-body :deep(tr:last-child td) {
  border-bottom: none;
}

.markdown-body :deep(hr) {
  border: none;
  border-top: 1px solid var(--border);
  margin: 2rem 0;
}

.markdown-body :deep(ul),
.markdown-body :deep(ol) {
  margin: 0 0 1rem;
  padding-left: 1.5rem;
}

.markdown-body :deep(li) {
  margin: 0.25rem 0;
}

.markdown-body :deep(blockquote) {
  border-left: 3px solid var(--primary);
  margin: 0 0 1rem;
  padding: 0.5rem 1rem;
  background: var(--muted);
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
  color: var(--muted-foreground);
}

@media (max-width: 640px) {
  .page-title {
    font-size: 1.5rem;
  }

  .markdown-body :deep(pre) {
    padding: 0.75rem;
  }
}
</style>