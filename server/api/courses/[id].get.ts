import { jwtVerify } from "jose"
import { db } from "../../utils/db"

interface Course {
  id: number
  name: string
  description: string
  professor_id: number
  active: number
  created_at: string
}

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

  let userId: number
  let role: string

  try {
    const verified = await jwtVerify(token, JWT_SECRET)
    const payload = verified.payload as {
      userId: number
      email: string
      role: string
    }
    userId = payload.userId
    role = payload.role
  } catch (err) {
    console.error("[courses.id.get] JWT verification failed:", err)
    setResponseStatus(event, 401)
    return { success: false, message: "Invalid or expired token" }
  }

  const courseId = getRouterParam(event, "id")

  if (!courseId || isNaN(Number(courseId))) {
    setResponseStatus(event, 400)
    return { success: false, message: "Invalid course ID" }
  }

  try {
    console.log(`[courses.id.get] Fetching course ${courseId} for user ${userId} (${role})`)
    const course = db
      .prepare("SELECT * FROM courses WHERE id = ?")
      .get(courseId) as Course | null

    if (!course) {
      console.log(`[courses.id.get] Course ${courseId} not found`)
      setResponseStatus(event, 404)
      return { success: false, message: "Course not found" }
    }

    console.log(`[courses.id.get] Returning course ${courseId}`)
    return {
      success: true,
      course
    }
  } catch (err) {
    console.error("[courses.id.get] Error:", err)
    setResponseStatus(event, 500)
    return { success: false, message: "Failed to fetch course" }
  }
})
