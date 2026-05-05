import { jwtVerify } from "jose";
import { db } from "../../utils/db";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-secret-key-change-in-production"
);

const VALID_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

interface OfficeHoursBody {
  day?: string;
  start?: string;
  end?: string;
}

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
      return { success: false, message: "Forbidden: only professors can add time slots" };
    }

    professorId = payload.userId;
  } catch {
    setResponseStatus(event, 401);
    return { success: false, message: "Invalid or expired token" };
  }

  const body = (await readBody(event)) as OfficeHoursBody;
  const day = body.day?.trim();
  const start = body.start?.trim();
  const end = body.end?.trim();

  if (!day || !start || !end) {
    setResponseStatus(event, 400);
    return { success: false, message: "Day, start time, and end time are required" };
  }

  if (!VALID_DAYS.includes(day)) {
    setResponseStatus(event, 400);
    return { success: false, message: "Invalid day of week" };
  }

  if (!TIME_PATTERN.test(start) || !TIME_PATTERN.test(end)) {
    setResponseStatus(event, 400);
    return { success: false, message: "Time must use HH:MM format" };
  }

  if (start >= end) {
    setResponseStatus(event, 400);
    return { success: false, message: "End time must be after start time" };
  }

  try {
    const existing = db
      .prepare(
        `SELECT id
         FROM professor_av_time_slots
         WHERE professor_id = ? AND day_of_week = ? AND start_time = ? AND end_time = ?`
      )
      .get(professorId, day, start, end) as { id: number } | undefined;

    if (existing) {
      setResponseStatus(event, 400);
      return { success: false, message: "This time slot already exists" };
    }

    const result = db
      .prepare(
        `INSERT INTO professor_av_time_slots (professor_id, day_of_week, start_time, end_time)
         VALUES (?, ?, ?, ?)`
      )
      .run(professorId, day, start, end);

    return {
      success: true,
      message: "Time slot added successfully",
      slot: {
        id: result.lastInsertRowid,
        day,
        start,
        end,
      },
    };
  } catch (err) {
    console.error("[staff office-hours] Error:", err);
    setResponseStatus(event, 500);
    return { success: false, message: "Failed to add time slot" };
  }
});
