import { jwtVerify } from 'jose'
import { hash } from 'bcrypt'

interface User {
  id: number
  email: string
  name: string
  role: string
  password: string
}

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
)

// Validation rules
function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

function validateName(name: string): boolean {
  return name.length >= 2 && name.length <= 100 && /^[a-zA-Z\s'-]+$/.test(name)
}

function validatePassword(password: string): boolean {
  return password.length >= 8
}

export default defineEventHandler(async (event) => {
  const authHeader = getHeader(event, 'authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    setResponseStatus(event, 401)
    return { success: false, message: 'Unauthorized' }
  }

  const token = authHeader.substring(7)

  let userId: number
  try {
    const verified = await jwtVerify(token, JWT_SECRET)
    const payload = verified.payload as { userId: number; email: string; role: string }
    userId = payload.userId
  } catch {
    setResponseStatus(event, 401)
    return { success: false, message: 'Invalid or expired token' }
  }

  const body = await readBody(event)
  const { name, email, currentPassword, newPassword } = body

  try {
    // Get current user
    const currentUser = await db.prepare(
      'SELECT id, email, name, role, password FROM users WHERE id = ?'
    ).get(userId) as User | null

    if (!currentUser) {
      setResponseStatus(event, 404)
      return { success: false, message: 'User not found' }
    }

    // Prepare updates
    const updates: Record<string, unknown> = {}
    const updateFields: string[] = []

    // Validate and update name
    if (name !== undefined && name !== null) {
      if (!validateName(name)) {
        setResponseStatus(event, 400)
        return {
          success: false,
          message: 'Name must be 2-100 characters and contain only letters, spaces, hyphens, or apostrophes'
        }
      }
      updateFields.push('name = ?')
      updates.nameValue = name
    }

    // Validate and update email
    if (email !== undefined && email !== null) {
      if (!validateEmail(email)) {
        setResponseStatus(event, 400)
        return { success: false, message: 'Invalid email format' }
      }

      // Check if email already exists for another user
      const existingUser = await db.prepare(
        'SELECT id FROM users WHERE email = ? AND id != ?'
      ).get(email, userId) as { id: number } | null

      if (existingUser) {
        setResponseStatus(event, 400)
        return { success: false, message: 'Email already in use' }
      }

      updateFields.push('email = ?')
      updates.emailValue = email
    }

    // Handle password update
    if (newPassword !== undefined && newPassword !== null) {
      if (!currentPassword) {
        setResponseStatus(event, 400)
        return { success: false, message: 'Current password required to set new password' }
      }

      // Verify current password
      const bcrypt = await import('bcrypt')
      const isPasswordValid = await bcrypt.compare(currentPassword, currentUser.password)

      if (!isPasswordValid) {
        setResponseStatus(event, 401)
        return { success: false, message: 'Current password is incorrect' }
      }

      if (!validatePassword(newPassword)) {
        setResponseStatus(event, 400)
        return { success: false, message: 'New password must be at least 8 characters' }
      }

      const hashedPassword = await hash(newPassword, 10)
      updateFields.push('password = ?')
      updates.passwordValue = hashedPassword
    }

    // If no fields to update
    if (updateFields.length === 0) {
      return {
        success: true,
        message: 'No changes made',
        user: {
          id: currentUser.id,
          email: currentUser.email,
          name: currentUser.name,
          role: currentUser.role
        }
      }
    }

    // Build and execute update query
    const updateQuery = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`
    const values = [
      ...(updates.nameValue !== undefined ? [updates.nameValue] : []),
      ...(updates.emailValue !== undefined ? [updates.emailValue] : []),
      ...(updates.passwordValue !== undefined ? [updates.passwordValue] : []),
      userId
    ]

    await db.prepare(updateQuery).run(...values)

    // Get updated user data
    const updatedUser = await db.prepare(
      'SELECT id, email, name, role FROM users WHERE id = ?'
    ).get(userId) as Omit<User, 'password'> | null

    return {
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser
    }
  } catch (err) {
    console.error('[user.put] Error:', err)
    setResponseStatus(event, 500)
    return { success: false, message: 'Failed to update user profile' }
  }
})
