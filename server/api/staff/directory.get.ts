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

  try {
    await jwtVerify(token, JWT_SECRET);
  } catch {
    setResponseStatus(event, 401);
    return { success: false, message: "Invalid or expired token" };
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

    const staffWithDetails = staff.map((member) => ({
      id: member.id,
      name: member.name,
      email: member.email,
      department: member.department,
      phone: member.phone,
      assignedCourses: courses
        .filter((course) => course.professor_id === member.id)
        .map((course) => course.name),
      officeHours: officeHours
        .filter((slot) => slot.professor_id === member.id)
        .map((slot) => ({
          day: slot.day_of_week,
          start: slot.start_time,
          end: slot.end_time,
        })),
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
