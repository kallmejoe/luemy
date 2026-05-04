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
      return { success: false, message: "Forbidden: only students can view course details" };
    }

    studentId = payload.userId;
  } catch {
    setResponseStatus(event, 401);
    return { success: false, message: "Invalid or expired token" };
  }

  const courseId = parseInt(event.context.params.id);

  if (!courseId) {
    setResponseStatus(event, 400);
    return { success: false, message: "Missing course ID" };
  }

  try {
    // Verify student is enrolled in the course
    const enrollment = db.prepare(
      `SELECT ce.student_id FROM course_enrollments ce
       WHERE ce.course_id = ? AND ce.student_id = ?`
    ).get(courseId, studentId);

    if (!enrollment) {
      setResponseStatus(event, 403);
      return { success: false, message: "You are not enrolled in this course" };
    }

    // Get course details with professor info
    const course = db.prepare(
      `SELECT c.id, c.name, c.description, c.created_at,
              u.name as professor_name, u.email as professor_email
       FROM courses c
       JOIN professors_info pi ON c.professor_id = pi.user_id
       JOIN users u ON pi.user_id = u.id
       WHERE c.id = ?`
    ).get(courseId);

    if (!course) {
      setResponseStatus(event, 404);
      return { success: false, message: "Course not found" };
    }

    // Get assignments for the course
    const assignments = db.prepare(
      `SELECT a.id, a.title, a.description, a.max_score, a.due_date
       FROM assignments a
       WHERE a.course_id = ?
       ORDER BY a.due_date ASC`
    ).all(courseId);

    // Get submission status for each assignment
    const assignmentsWithStatus = assignments.map((assignment: any) => {
      const submission = db.prepare(
        `SELECT id, status, submission_date
         FROM assignment_submissions
         WHERE student_id = ? AND assignment_id = ?`
      ).get(studentId, assignment.id);

      return {
        ...assignment,
        submission: submission || null
      };
    });

    return {
      success: true,
      course,
      assignments: assignmentsWithStatus
    };
  } catch (err) {
    console.error("course detail get Error:", err);
    setResponseStatus(event, 500);
    return { success: false, message: "Failed to fetch course details" };
  }
});
