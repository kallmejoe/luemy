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
  let professorId: number;

  try {
    const verified = await jwtVerify(token, JWT_SECRET);
    const payload = verified.payload as { userId: number; email: string; role: string };

    if (payload.role !== "professor") {
      setResponseStatus(event, 403);
      return { success: false, message: "Forbidden: only professors can view assignment details" };
    }

    professorId = payload.userId;
  } catch {
    setResponseStatus(event, 401);
    return { success: false, message: "Invalid or expired token" };
  }

  const assignmentId = getRouterParam(event, "id");

  if (!assignmentId || isNaN(Number(assignmentId))) {
    setResponseStatus(event, 400);
    return { success: false, message: "Missing or invalid assignment ID" };
  }

  try {
    // Get assignment details and verify professor owns the course
    const assignment = db.prepare(
      `SELECT a.id, a.course_id, a.title, a.description, a.max_score, a.due_date, 
              c.name as course_name
       FROM assignments a
       JOIN courses c ON a.course_id = c.id
       WHERE a.id = ? AND c.professor_id = ?`
    ).get(assignmentId, professorId) as {
      id: number
      course_id: number
      title: string
      description: string
      max_score: number
      due_date: string
      course_name: string
    } | null;

    if (!assignment) {
      setResponseStatus(event, 404);
      return { success: false, message: "Assignment not found" };
    }

    // Get all submissions for this assignment
    const submissions = db.prepare(
      `SELECT s.id, s.student_id, s.content, s.submission_date, s.status,
              u.name as student_name, u.email as student_email,
              g.grade, g.feedback
       FROM assignment_submissions s
       JOIN users u ON s.student_id = u.id
       LEFT JOIN assignment_grades g ON g.student_id = s.student_id AND g.assignment_id = s.assignment_id
       WHERE s.assignment_id = ?
       ORDER BY s.submission_date DESC`
    ).all(assignmentId);

    // Get submission stats
    const stats = db.prepare(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'submitted' THEN 1 ELSE 0 END) as submitted,
        SUM(CASE WHEN status = 'graded' THEN 1 ELSE 0 END) as graded
       FROM assignment_submissions
       WHERE assignment_id = ?`
    ).get(assignmentId) as { total: number; submitted: number; graded: number };

    return {
      success: true,
      assignment,
      submissions,
      stats
    };
  } catch (err) {
    console.error("[professor/assignment.id.get] Error:", err);
    setResponseStatus(event, 500);
    return { success: false, message: "Failed to fetch assignment details" };
  }
});