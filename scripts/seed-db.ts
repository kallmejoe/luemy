import Database from "better-sqlite3"
import path from "path"
import crypto from "crypto"

const dbPath = path.resolve("./db/database.sqlite")
const db = new Database(dbPath)

// Hash password function
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex')
}

try {
  console.log('Starting database seeding...\n')

  // 1. Create professor user
  console.log('Creating professor account...')
  const profPassword = 'professor123'
  const profHashedPassword = hashPassword(profPassword)
  
  const profResult = db.prepare(
    `INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)`
  ).run('Dr. Ahmed Hassan', 'prof.ahmed@university.edu', profHashedPassword, 'professor')
  
  const professorId = profResult.lastInsertRowid
  console.log(`✓ Professor created: ID ${professorId}`)
  console.log(`  Email: prof.ahmed@university.edu`)
  console.log(`  Password: ${profPassword}\n`)

  // 2. Add professor info
  console.log('Adding professor info...')
  db.prepare(
    `INSERT INTO professors_info (user_id, department) VALUES (?, ?)`
  ).run(professorId, 'Computer Science')
  console.log(`✓ Professor info added\n`)

  // 3. Create courses
  console.log('Creating courses...')
  const courses = [
    {
      name: 'Web Development Fundamentals',
      description: 'Learn the basics of HTML, CSS, and JavaScript for building modern web applications.'
    },
    {
      name: 'Advanced React & Vue',
      description: 'Master frontend frameworks with hands-on projects and best practices.'
    },
    {
      name: 'Database Design & SQL',
      description: 'Learn relational database design, SQL queries, and optimization techniques.'
    }
  ]

  const courseIds: number[] = []
  
  courses.forEach((course, index) => {
    const result = db.prepare(
      `INSERT INTO courses (name, description, professor_id, active, created_at) 
       VALUES (?, ?, ?, 1, datetime('now'))`
    ).run(course.name, course.description, professorId)
    
    courseIds.push(result.lastInsertRowid as number)
    console.log(`✓ Course ${index + 1}: ${course.name} (ID ${courseIds[index]})`)
  })
  console.log()

  // 4. Create assignments for each course
  console.log('Creating assignments...')
  const assignments = [
    // Course 1 assignments
    {
      courseId: courseIds[0],
      title: 'HTML & CSS Basics',
      description: 'Build a simple portfolio website with HTML5 and CSS3. Include proper semantic HTML and responsive design.',
      dueDate: '2024-05-20T23:59:59'
    },
    {
      courseId: courseIds[0],
      title: 'JavaScript Fundamentals',
      description: 'Write JavaScript programs covering variables, functions, loops, and DOM manipulation. Create an interactive calculator.',
      dueDate: '2024-05-27T23:59:59'
    },
    {
      courseId: courseIds[0],
      title: 'Build a Todo App',
      description: 'Create a fully functional todo application with add, delete, and mark complete features using vanilla JavaScript.',
      dueDate: '2024-06-03T23:59:59'
    },
    // Course 2 assignments
    {
      courseId: courseIds[1],
      title: 'React Component Design',
      description: 'Create reusable React components with proper props and state management. Build a weather app that fetches data from an API.',
      dueDate: '2024-05-18T23:59:59'
    },
    {
      courseId: courseIds[1],
      title: 'Vue.js State Management',
      description: 'Build a shopping cart application using Vue.js with Vuex for state management. Implement cart operations.',
      dueDate: '2024-05-25T23:59:59'
    },
    {
      courseId: courseIds[1],
      title: 'Full Stack Project',
      description: 'Combine React frontend with a backend API. Build a social media feed application with posts and comments.',
      dueDate: '2024-06-08T23:59:59'
    },
    // Course 3 assignments
    {
      courseId: courseIds[2],
      title: 'Database Schema Design',
      description: 'Design a normalized database schema for an e-commerce platform. Include all necessary tables and relationships.',
      dueDate: '2024-05-19T23:59:59'
    },
    {
      courseId: courseIds[2],
      title: 'SQL Queries & Joins',
      description: 'Write complex SQL queries using inner joins, left joins, aggregations, and subqueries on a provided database.',
      dueDate: '2024-05-26T23:59:59'
    },
    {
      courseId: courseIds[2],
      title: 'Performance Optimization',
      description: 'Analyze slow queries, create appropriate indexes, and optimize a poorly performing database. Document your improvements.',
      dueDate: '2024-06-02T23:59:59'
    }
  ]

  assignments.forEach((assignment, index) => {
    db.prepare(
      `INSERT INTO assignments (course_id, title, description, max_score, due_date) 
       VALUES (?, ?, ?, 100, ?)`
    ).run(assignment.courseId, assignment.title, assignment.description, assignment.dueDate)
    
    if ((index + 1) % 3 === 0) {
      console.log(`✓ Course ${Math.ceil((index + 1) / 3)}: 3 assignments created`)
    }
  })
  console.log()

  // Summary
  console.log('='.repeat(60))
  console.log('DATABASE SEEDING COMPLETED SUCCESSFULLY!')
  console.log('='.repeat(60))
  console.log(`\nCreated:`)
  console.log(`  • 1 Professor account`)
  console.log(`  • 3 Courses`)
  console.log(`  • 9 Assignments`)
  console.log(`\nProfessor Login Credentials:`)
  console.log(`  Email:    prof.ahmed@university.edu`)
  console.log(`  Password: ${profPassword}`)
  console.log(`\nCourses Created:`)
  courses.forEach((course, i) => {
    console.log(`  ${i + 1}. ${course.name}`)
  })

} catch (err) {
  console.error('Error seeding database:', err)
  process.exit(1)
} finally {
  db.close()
  console.log('\n✓ Database connection closed')
}
