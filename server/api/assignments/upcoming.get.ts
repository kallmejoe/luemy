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
      return { success: false, message: "Forbidden: only students can view upcoming deadlines" };
    }

    studentId = payload.userId;
  } catch {
    setResponseStatus(event, 401);
    return { success: false, message: "Invalid or expired token" };
  }

  try {
    const assignments = db.prepare(
      `SELECT
         a.id,
         a.course_id,
         a.title,
         a.description,
         a.max_score,
         a.due_date,
         c.name AS course_name,
         c.description AS course_description
       FROM assignments a
       JOIN courses c ON a.course_id = c.id
       JOIN course_enrollments ce ON ce.course_id = c.id
       WHERE ce.student_id = ?
         AND a.due_date IS NOT NULL
         AND date(a.due_date) BETWEEN date('now') AND date('now', '+30 days')
       ORDER BY datetime(a.due_date) ASC, a.id ASC`
    ).all(studentId);

    return {
      success: true,
      assignments
    };
  } catch (err) {
    console.error("upcoming assignments get Error:", err);
    setResponseStatus(event, 500);
    return { success: false, message: "Failed to fetch upcoming assignments" };
  }
});
