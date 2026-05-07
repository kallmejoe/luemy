import { db } from "../../utils/db";

export default defineEventHandler(async (_event) => {
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
    return {
      success: false,
      message: "Error fetching students",
    };
  }
});
