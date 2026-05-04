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
      return { success: false, message: "Forbidden: only professors can view submissions" };
    }

    professorId = payload.userId;
  } catch {
    setResponseStatus(event, 401);
    return { success: false, message: "Invalid or expired token" };
  }

  try {
    const submissions = db.prepare(
      `SELECT s.id, s.student_id, s.assignment_id, s.content, s.submission_date, s.status,
              a.title AS assignment_title, a.max_score, c.name AS course_name,
              u.name AS student_name, g.grade, g.feedback
       FROM assignment_submissions s
       JOIN assignments a ON s.assignment_id = a.id
       JOIN courses c ON a.course_id = c.id
       JOIN users u ON s.student_id = u.id
       LEFT JOIN assignment_grades g ON g.student_id = s.student_id AND g.assignment_id = s.assignment_id
       WHERE c.professor_id = ?
       ORDER BY s.submission_date DESC`
    ).all(professorId);

    return { success: true, submissions };
  } catch (err) {
    console.error("submissions get Error:", err);
    setResponseStatus(event, 500);
    return { success: false, message: "Failed to fetch submissions" };
  }
});
