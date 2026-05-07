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
      return { success: false, message: "Forbidden" };
    }

    professorId = payload.userId;
  } catch {
    setResponseStatus(event, 401);
    return { success: false, message: "Invalid token" };
  }

  const courseId = getRouterParam(event, "id");

  if (!courseId || isNaN(Number(courseId))) {
    setResponseStatus(event, 400);
    return { success: false, message: "Invalid course ID" };
  }

  try {
    const course = db.prepare(
      `SELECT id
       FROM courses
       WHERE id = ? AND professor_id = ?`
     ).get(courseId, professorId);

    if (!course) {
      setResponseStatus(event, 404);
      return { success: false, message: "Course not found" };
    }

    const students = db.prepare(
      `SELECT u.id, u.name, u.email
       FROM users u
       JOIN students_info si ON u.id = si.user_id
       JOIN course_enrollments ce ON ce.student_id = u.id
       WHERE ce.course_id = ?
       ORDER BY u.name ASC`
    ).all(courseId) as Array<{ id: number; name: string; email: string }>;

    // Get all assignments for this course
    const assignments = db.prepare(
      `SELECT id, title, max_score FROM assignments WHERE course_id = ?`
    ).all(courseId) as Array<{ id: number; title: string; max_score: number }>;

    // Get submissions and grades for each student
    const studentData = students.map((student) => {
      const submissions = db.prepare(
        `SELECT a.id as assignment_id, a.title as assignment_title, a.max_score,
                s.status, s.submission_date,
                g.grade, g.feedback
         FROM assignments a
         LEFT JOIN assignment_submissions s ON s.assignment_id = a.id AND s.student_id = ?
         LEFT JOIN assignment_grades g ON g.assignment_id = a.id AND g.student_id = ?
         WHERE a.course_id = ?
         ORDER BY a.due_date ASC`
      ).all(student.id, student.id, courseId) as Array<{
        assignment_id: number
        assignment_title: string
        max_score: number
        status: string | null
        submission_date: string | null
        grade: number | null
        feedback: string | null
      }>;

      const gradedCount = submissions.filter((s) => s.grade !== null).length;
      const submittedCount = submissions.filter((s) => {
        const normalizedStatus = (s.status || "").toLowerCase();
        return normalizedStatus === "submitted" || normalizedStatus === "graded";
      }).length;

      return {
        ...student,
        student_id: String(student.id),
        enrollment_date: null,
        submissions,
        stats: {
          total_assignments: assignments.length,
          submitted: submittedCount,
          graded: gradedCount,
        },
      };
    });

    return { success: true, students: studentData };
  } catch (err) {
    console.error("[courses.id.students] Error:", err);
    setResponseStatus(event, 500);
    return { success: false, message: "Failed to fetch students" };
  }
});