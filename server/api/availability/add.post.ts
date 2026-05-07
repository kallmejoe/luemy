import { jwtVerify } from "jose"
import { db } from "../../utils/db"

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-secret-key-change-in-production"
)

export default defineEventHandler(async (event) => {
  const authHeader = getHeader(event, "authorization")

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    setResponseStatus(event, 401)
    return { success: false, message: "Unauthorized" }
  }

  const token = authHeader.substring(7)

  let professorId: number
  try {
    const verified = await jwtVerify(token, JWT_SECRET)
    const payload = verified.payload as { userId: number; email: string; role: string }
    if (payload.role !== "professor") {
      setResponseStatus(event, 403)
      return { success: false, message: "Only professors can manage availability" }
    }
    professorId = payload.userId
  } catch {
    setResponseStatus(event, 401)
    return { success: false, message: "Invalid or expired token" }
  }

  const body = await readBody(event)
  const { dayOfWeek, startTime, endTime } = body

  if (!dayOfWeek || !startTime || !endTime) {
    setResponseStatus(event, 400)
    return { success: false, message: "Missing required fields: dayOfWeek, startTime, endTime" }
  }

  try {
    const result = db.prepare(
      "INSERT INTO professor_av_time_slots (professor_id, day_of_week, start_time, end_time) VALUES (?, ?, ?, ?)"
    ).run(professorId, dayOfWeek, startTime, endTime)

    return { success: true, id: result.lastInsertRowid }
  } catch (err) {
    console.error("[availability create] Error:", err)
    return { success: false, message: "Failed to add availability slot" }
  }
})
