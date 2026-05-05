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

function validateCourseName(name: string): boolean {
  return name.length >= 2 && name.length <= 255
}

function validateCourseDescription(description: string): boolean {
  return description.length >= 0 && description.length <= 1000
}

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

  // Only professors can update courses
  if (role !== "professor") {
    setResponseStatus(event, 403)
    return {
      success: false,
      message: "Forbidden: only professors can update courses"
    }
  }

  const courseId = getRouterParam(event, "id")

  if (!courseId || isNaN(Number(courseId))) {
    setResponseStatus(event, 400)
    return { success: false, message: "Invalid course ID" }
  }

  const body = await readBody(event)
  const { name, description, active } = body

  try {
    // Check if course exists and belongs to the professor
    const course = db
      .prepare("SELECT * FROM courses WHERE id = ?")
      .get(courseId) as Course | null

    if (!course) {
      setResponseStatus(event, 404)
      return { success: false, message: "Course not found" }
    }

    if (course.professor_id !== userId) {
      setResponseStatus(event, 403)
      return {
        success: false,
        message: "Forbidden: you can only edit your own courses"
      }
    }

    // Prepare updates
    const updates: Record<string, unknown> = {}
    const updateFields: string[] = []

    // Validate and update name
    if (name !== undefined && name !== null) {
      if (!validateCourseName(name)) {
        setResponseStatus(event, 400)
        return {
          success: false,
          message: "Course name must be between 2 and 255 characters"
        }
      }
      updateFields.push("name = ?")
      updates.nameValue = name
    }

    // Validate and update description
    if (description !== undefined && description !== null) {
      if (!validateCourseDescription(description)) {
        setResponseStatus(event, 400)
        return {
          success: false,
          message: "Course description must be 1000 characters or less"
        }
      }
      updateFields.push("description = ?")
      updates.descriptionValue = description
    }

    // Update active status
    if (active !== undefined && active !== null) {
      const activeValue = active ? 1 : 0
      updateFields.push("active = ?")
      updates.activeValue = activeValue
    }

    // If no fields to update
    if (updateFields.length === 0) {
      return {
        success: true,
        message: "No changes made",
        course
      }
    }

    // Build and execute update query
    const updateQuery = `UPDATE courses SET ${updateFields.join(", ")} WHERE id = ?`
    const values = [
      ...(updates.nameValue !== undefined ? [updates.nameValue] : []),
      ...(updates.descriptionValue !== undefined
        ? [updates.descriptionValue]
        : []),
      ...(updates.activeValue !== undefined ? [updates.activeValue] : []),
      courseId
    ]

    db.prepare(updateQuery).run(...values)

    // Get updated course data
    const updatedCourse = db
      .prepare("SELECT * FROM courses WHERE id = ?")
      .get(courseId) as Course | null

    return {
      success: true,
      message: "Course updated successfully",
      course: updatedCourse
    }
  } catch (err) {
    console.error("[courses.put] Error:", err)
    setResponseStatus(event, 500)
    return { success: false, message: "Failed to update course" }
  }
})
