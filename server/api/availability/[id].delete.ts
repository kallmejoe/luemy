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

  const slotId = getRouterParam(event, "id")

  if (!slotId) {
    setResponseStatus(event, 400)
    return { success: false, message: "Slot ID is required" }
  }

  try {
    // Verify the slot belongs to the professor
    const slot = db.prepare("SELECT * FROM professor_av_time_slots WHERE id = ? AND professor_id = ?").get(slotId, professorId)

    if (!slot) {
      setResponseStatus(event, 404)
      return { success: false, message: "Availability slot not found" }
    }

    db.prepare("DELETE FROM professor_av_time_slots WHERE id = ?").run(slotId)

    return { success: true, message: "Availability slot deleted" }
  } catch (err) {
    console.error("[availability delete] Error:", err)
    return { success: false, message: "Failed to delete availability slot" }
  }
})
