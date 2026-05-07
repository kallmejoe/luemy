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
  const { specificDate, startTime, endTime, hall } = body

  if (!specificDate || !startTime || !endTime || !hall) {
    setResponseStatus(event, 400)
    return { success: false, message: "Missing required fields: specificDate, startTime, endTime, hall" }
  }

  const dateToCheck = new Date(specificDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  dateToCheck.setHours(0, 0, 0, 0)

  if (dateToCheck < today) {
    setResponseStatus(event, 400)
    return { success: false, message: "Cannot reserve availability for past dates" }
  }

  const validHalls = ["1", "2", "3", "4", "A", "B"]
  if (!validHalls.includes(hall)) {
    setResponseStatus(event, 400)
    return { success: false, message: `Invalid hall. Must be one of: ${validHalls.join(", ")}` }
  }

  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
  const dayOfWeek = dayNames[dateToCheck.getDay()]

  try {
    const result = db.prepare(
      "INSERT INTO professor_av_time_slots (professor_id, day_of_week, specific_date, start_time, end_time, hall) VALUES (?, ?, ?, ?, ?, ?)"
    ).run(professorId, dayOfWeek, specificDate, startTime, endTime, hall)

    return { success: true, id: result.lastInsertRowid }
  } catch (err) {
    console.error("[availability create] Error:", err)
    const errorMessage = err instanceof Error ? err.message : String(err)
    if (errorMessage.includes("UNIQUE constraint failed")) {
      return { success: false, message: "This hall is already reserved for this time slot on this date" }
    }
    return { success: false, message: "Failed to add availability slot" }
  }
})

