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
      return { success: false, message: "Only professors can access availability" }
    }
    professorId = payload.userId
  } catch {
    setResponseStatus(event, 401)
    return { success: false, message: "Invalid or expired token" }
  }

  try {
    const slots = db.prepare("SELECT * FROM professor_av_time_slots WHERE professor_id = ? ORDER BY day_of_week, start_time").all(professorId)
    return { success: true, slots }
  } catch (err) {
    console.error("[availability list] Error:", err)
    return { success: false, message: "Failed to fetch availability" }
  }
})
