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
  } catch {
    setResponseStatus(event, 401)
    return { success: false, message: "Invalid or expired token" }
  }

  const courseId = getRouterParam(event, "id")

  if (!courseId || isNaN(Number(courseId))) {
    setResponseStatus(event, 400)
    return { success: false, message: "Invalid course ID" }
  }

  try {
    const course = db
      .prepare("SELECT * FROM courses WHERE id = ?")
      .get(courseId) as Course | null

    if (!course) {
      setResponseStatus(event, 404)
      return { success: false, message: "Course not found" }
    }

    // Professors can only view their own courses
    if (role === "professor" && course.professor_id !== userId) {
      setResponseStatus(event, 403)
      return {
        success: false,
        message: "Forbidden: you can only view your own courses"
      }
    }

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
