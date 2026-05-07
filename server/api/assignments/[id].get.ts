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
      return { success: false, message: "Forbidden: only students can view assignments" };
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
    // Get assignment details and verify student is enrolled in the course
    const assignment = db.prepare(
      `SELECT a.id, a.course_id, a.title, a.description, a.max_score, a.due_date, 
              c.name as course_name, u.name as professor_name, u.email as professor_email
       FROM assignments a
       JOIN courses c ON a.course_id = c.id
       JOIN professors_info pi ON c.professor_id = pi.user_id
       JOIN users u ON pi.user_id = u.id
       JOIN course_enrollments ce ON c.id = ce.course_id
       WHERE a.id = ? AND ce.student_id = ?`
    ).get(assignmentId, studentId);

    if (!assignment) {
      setResponseStatus(event, 404);
      return { success: false, message: "Assignment not found or you are not enrolled in this course" };
    }

    // Get submission if exists
    const submission = db.prepare(
      `SELECT s.id, s.status, s.submission_date, s.content,
              g.grade, g.feedback
       FROM assignment_submissions s
       LEFT JOIN assignment_grades g
         ON g.student_id = s.student_id AND g.assignment_id = s.assignment_id
       WHERE s.student_id = ? AND s.assignment_id = ?`
    ).get(studentId, assignmentId);

    return {
      success: true,
      assignment,
      submission: submission || null
    };
  } catch (err) {
    console.error("[id] assignment get Error:", err);
    setResponseStatus(event, 500);
    return { success: false, message: "Failed to fetch assignment details" };
  }
});
