import { jwtVerify } from "jose";
import { db } from "../../utils/db";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-secret-key-change-in-production"
);

export default defineEventHandler(async (event) => {
  const authHeader = getHeader(event, "authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    setResponseStatus(event, 401);
    return { success: false, message: "Unauthorized" };
  }

  const token = authHeader.substring(7);
  let studentId: number;

  try {
    const verified = await jwtVerify(token, JWT_SECRET);
    const payload = verified.payload as { userId: number; email: string; role: string };

    if (payload.role !== "student") {
      setResponseStatus(event, 403);
      return { success: false, message: "Forbidden: only students can submit assignments" };
    }

    studentId = payload.userId;
  } catch {
    setResponseStatus(event, 401);
    return { success: false, message: "Invalid or expired token" };
  }

  const body = await readBody(event);
  const { assignmentId, content } = body;

  if (!assignmentId || !content) {
    setResponseStatus(event, 400);
    return { success: false, message: "Missing required fields: assignmentId and content" };
  }

  try {
    // Check if assignment exists and student is enrolled
    const assignment = db.prepare(
      `SELECT a.id FROM assignments a
       JOIN course_enrollments ce ON a.course_id = ce.course_id
       WHERE a.id = ? AND ce.student_id = ?`
    ).get(assignmentId, studentId);

    if (!assignment) {
      setResponseStatus(event, 403);
      return { success: false, message: "Assignment not found or not enrolled in this course" };
    }

    // Insert or update submission
    const result = db.prepare(
      `INSERT INTO assignment_submissions (student_id, assignment_id, content, status)
       VALUES (?, ?, ?, 'Submitted')
       ON CONFLICT(student_id, assignment_id) DO UPDATE SET
       content = excluded.content,
       submission_date = CURRENT_TIMESTAMP,
       status = 'Submitted'`
    ).run(studentId, assignmentId, content);

    return { 
      success: true, 
      message: "Assignment submitted successfully",
      submissionId: result.lastInsertRowid 
    };
  } catch (err) {
    console.error("submit assignment Error:", err);
    setResponseStatus(event, 500);
    return { success: false, message: "Failed to submit assignment" };
  }
});
