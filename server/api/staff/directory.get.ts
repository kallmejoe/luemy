import { jwtVerify } from "jose";
import { db } from "../../utils/db";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-secret-key-change-in-production"
);

interface StaffRow {
  id: number;
  name: string;
  email: string;
  department: string | null;
  phone: string | null;
}

interface OfficeHourRow {
  professor_id: number;
  day_of_week: string;
  start_time: string;
  end_time: string;
}

interface CourseRow {
  professor_id: number;
  name: string;
}

export default defineEventHandler(async (event) => {
  const authHeader = getHeader(event, "authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    setResponseStatus(event, 401);
    return { success: false, message: "Unauthorized" };
  }

  const token = authHeader.substring(7);
  let role: string | undefined;

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    role = typeof payload.role === "string" ? payload.role : undefined;
  } catch {
    setResponseStatus(event, 401);
    return { success: false, message: "Invalid or expired token" };
  }

  if (role !== "student") {
    setResponseStatus(event, 403);
    return { success: false, message: "Forbidden" };
  }

  try {
    const staff = db
      .prepare(
        `SELECT u.id, u.name, u.email, pi.department, pi.phone
         FROM users u
         JOIN professors_info pi ON pi.user_id = u.id
         WHERE u.role = 'professor'
         ORDER BY u.name ASC`
      )
      .all() as StaffRow[];

    const courses = db
      .prepare(
        `SELECT professor_id, name
         FROM courses
         WHERE active = 1
         ORDER BY name ASC`
      )
      .all() as CourseRow[];

    const officeHours = db
      .prepare(
        `SELECT professor_id, day_of_week, start_time, end_time
         FROM professor_av_time_slots
         ORDER BY professor_id, day_of_week, start_time`
      )
      .all() as OfficeHourRow[];

    const coursesByProfessor = new Map<number, string[]>();
    for (const course of courses) {
      const assignedCourses = coursesByProfessor.get(course.professor_id) ?? [];
      assignedCourses.push(course.name);
      coursesByProfessor.set(course.professor_id, assignedCourses);
    }

    const officeHoursByProfessor = new Map<
      number,
      { day: string; start: string; end: string }[]
    >();
    for (const slot of officeHours) {
      const professorOfficeHours =
        officeHoursByProfessor.get(slot.professor_id) ?? [];
      professorOfficeHours.push({
        day: slot.day_of_week,
        start: slot.start_time,
        end: slot.end_time,
      });
      officeHoursByProfessor.set(slot.professor_id, professorOfficeHours);
    }

    const staffWithDetails = staff.map((member) => ({
      id: member.id,
      name: member.name,
      email: member.email,
      department: member.department,
      phone: member.phone,
      assignedCourses: coursesByProfessor.get(member.id) ?? [],
      officeHours: officeHoursByProfessor.get(member.id) ?? [],
    }));

    return {
      success: true,
      staff: staffWithDetails,
    };
  } catch (err) {
    console.error("[staff directory] Error:", err);
    setResponseStatus(event, 500);
    return { success: false, message: "Failed to fetch staff directory" };
  }
});
