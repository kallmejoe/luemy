import { jwtVerify } from "jose";
import { db } from "../utils/db";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-secret-key-change-in-production"
);

const ALLOWED_APP_SOURCES = new Set(["student", "staff", "instructor"]);

export default defineEventHandler(async (event) => {
  const authHeader = getHeader(event, "authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    setResponseStatus(event, 401);
    return { success: false, message: "Unauthorized" };
  }

  const token = authHeader.substring(7);

  let userId: number;
  try {
    const verified = await jwtVerify(token, JWT_SECRET);
    const payload = verified.payload as { userId: number; email: string; role: string };
    userId = payload.userId;
  } catch {
    setResponseStatus(event, 401);
    return { success: false, message: "Invalid or expired token" };
  }

  const body = await readBody(event);

  const app = typeof body?.app === "string" ? body.app.trim().toLowerCase() : "";
  const subject = typeof body?.subject === "string" ? body.subject.trim() : "";
  const details = typeof body?.details === "string" ? body.details.trim() : "";
  const pagePath = typeof body?.pagePath === "string" ? body.pagePath.trim() : "";

  if (!ALLOWED_APP_SOURCES.has(app)) {
    setResponseStatus(event, 400);
    return {
      success: false,
      message: "Invalid app source. Expected one of: student, staff, instructor"
    };
  }

  if (!subject) {
    setResponseStatus(event, 400);
    return { success: false, message: "Subject is required" };
  }

  if (!details) {
    setResponseStatus(event, 400);
    return { success: false, message: "Details are required" };
  }

  try {
    const result = db.prepare(
      `INSERT INTO bug_feedback (user_id, app_source, subject, details, page_path)
       VALUES (?, ?, ?, ?, ?)`
    ).run(userId, app, subject, details, pagePath || null);

    return {
      success: true,
      id: result.lastInsertRowid,
      message: "Feedback submitted successfully"
    };
  } catch (err) {
    console.error("[feedback.post] Error:", err);
    setResponseStatus(event, 500);
    return { success: false, message: "Failed to submit feedback" };
  }
});
