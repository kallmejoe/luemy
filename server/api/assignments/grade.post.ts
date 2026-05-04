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
  let professorId: number;

  try {
    const verified = await jwtVerify(token, JWT_SECRET);
    const payload = verified.payload as { userId: number; email: string; role: string };

    if (payload.role !== "professor") {
      setResponseStatus(event, 403);
      return { success: false, message: "Forbidden: only professors can grade submissions" };
    }

    professorId = payload.userId;
  } catch {
    setResponseStatus(event, 401);
    return { success: false, message: "Invalid or expired token" };
  }

  const body = await readBody(event);
  const assignmentId = Number(body.assignmentId);
  const studentId = Number(body.studentId);
  const grade = Number(body.grade);
  const feedback = typeof body.feedback === "string" ? body.feedback.trim() : "";

  if (!assignmentId || !studentId || Number.isNaN(grade)) {
    setResponseStatus(event, 400);
    return { success: false, message: "Missing required fields: assignmentId, studentId, and grade" };
  }

  if (!Number.isFinite(grade) || grade < 0) {
    setResponseStatus(event, 400);
    return { success: false, message: "Grade must be a valid non-negative number" };
  }

  try {
    const assignment = db.prepare(
      `SELECT a.max_score
       FROM assignments a
       JOIN courses c ON a.course_id = c.id
       WHERE a.id = ? AND c.professor_id = ?`
    ).get(assignmentId, professorId) as { max_score: number } | undefined;

    if (!assignment) {
      setResponseStatus(event, 404);
      return { success: false, message: "Assignment not found" };
    }

    if (grade > Number(assignment.max_score)) {
      setResponseStatus(event, 400);
      return { success: false, message: `Grade cannot exceed max score (${assignment.max_score})` };
    }

    const submission = db.prepare(
      `SELECT id
       FROM assignment_submissions
       WHERE assignment_id = ? AND student_id = ?`
    ).get(assignmentId, studentId);

    if (!submission) {
      setResponseStatus(event, 404);
      return { success: false, message: "Submission not found" };
    }

    db.prepare(
      `INSERT INTO assignment_grades (student_id, assignment_id, grade, feedback)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(student_id, assignment_id) DO UPDATE SET
       grade = excluded.grade,
       feedback = excluded.feedback`
    ).run(studentId, assignmentId, grade, feedback || null);

    db.prepare(
      `UPDATE assignment_submissions
       SET status = 'Graded'
       WHERE assignment_id = ? AND student_id = ?`
    ).run(assignmentId, studentId);

    return { success: true, message: "Grade saved successfully" };
  } catch (err) {
    console.error("grade assignment Error:", err);
    setResponseStatus(event, 500);
    return { success: false, message: "Failed to save grade" };
  }
});
