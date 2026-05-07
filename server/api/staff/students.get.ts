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

  try {
    const verified = await jwtVerify(token, JWT_SECRET);
    const payload = verified.payload as { userId: number; email: string; role: string };

    if (payload.role !== "admin") {
      setResponseStatus(event, 403);
      return { success: false, message: "Forbidden" };
    }
  } catch {
    setResponseStatus(event, 401);
    return { success: false, message: "Invalid or expired token" };
  }

  try {
    const students = db
      .prepare(
        `SELECT u.id, u.name, u.email, u.role, s.major,
         (SELECT COUNT(*) FROM course_enrollments ce WHERE ce.student_id = u.id) as enrolled_courses_count
       FROM users u
       LEFT JOIN students_info s ON u.id = s.user_id
       WHERE u.role = 'student'
       ORDER BY u.name`,
      )
      .all();

    return {
      success: true,
      students,
    };
  } catch (error) {
    console.error(error);
    setResponseStatus(event, 500);
    return {
      success: false,
      message: "Error fetching students",
    };
  }
});
