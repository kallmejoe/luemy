import { jwtVerify } from "jose";
import { db } from "../../../utils/db";

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
      return { success: false, message: "Forbidden: only students can view their submissions" };
    }

    studentId = payload.userId;
  } catch {
    setResponseStatus(event, 401);
    return { success: false, message: "Invalid or expired token" };
  }

  const assignmentId = parseInt(event.context.params.id);

  if (!assignmentId) {
    setResponseStatus(event, 400);
    return { success: false, message: "Missing assignment ID" };
  }

  try {
    // Check if student is enrolled in the course
    const assignment = db.prepare(
      `SELECT a.id FROM assignments a
       JOIN course_enrollments ce ON a.course_id = ce.course_id
       WHERE a.id = ? AND ce.student_id = ?`
    ).get(assignmentId, studentId);

    if (!assignment) {
      setResponseStatus(event, 403);
      return { success: false, message: "Assignment not found or not enrolled in this course" };
    }

    // Fetch submission if it exists
    const submission = db.prepare(
      `SELECT id, content, submission_date, status
       FROM assignment_submissions
       WHERE student_id = ? AND assignment_id = ?`
    ).get(studentId, assignmentId);

    if (!submission) {
      return { success: true, submission: null };
    }

    return { success: true, submission };
  } catch (err) {
    console.error("fetch submission Error:", err);
    setResponseStatus(event, 500);
    return { success: false, message: "Failed to fetch submission" };
  }
});
