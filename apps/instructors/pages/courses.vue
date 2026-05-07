<script setup lang="ts">
import { ref, onMounted } from "vue"
import { useRouter } from "vue-router"
import UiButton from "@core/components/ui/Button.vue"

interface Course {
  id: number
  name: string
  description?: string
  professor_name?: string
  professor_id: number
}

const courses = ref<Course[]>([])
const myCourseIds = ref<number[]>([])

const fetchCourses = async () => {
  try {
    const res = await $fetch("/api/courses/list-courses")
    if (res.success) {
      courses.value = res.courses
    }
  } catch (error) {
    console.error(error)
  }
}

const fetchMyCourses = async () => {
  try {
    const res = await $fetch("/api/courses/my-courses", {
      headers: {
        Authorization: `Bearer ${token.value}`,
      },
    })

    if (res.success) {
      myCourseIds.value = res.courses.map((course: Course) => course.id)
    }
  } catch (error) {
    console.error(error)
  }
}

onMounted(async () => {
  await Promise.all([fetchCourses(), fetchMyCourses()])
})

const isTeaching = (courseId: number) => myCourseIds.value.includes(courseId)

const handleCourseClick = (courseId: number) => {
  router.push(`/course/${courseId}`)
}

const handleEditClick = (courseId: number, event: Event) => {
  event.stopPropagation()
  router.push(`/edit-course/${courseId}`)
}

const handleCreateCourse = () => {
  router.push('/create-course')
}
</script>

<template>
  <div class="courses-page">
    <div class="courses-heading">
      <div class="heading-content">
        <div>
          <h1 class="page-title">All Courses</h1>
          <p class="page-subtitle">
            View available courses. Courses marked as "Teaching" are yours.
          </p>
        </div>
        <UiButton @click="handleCreateCourse">
          Create Course
        </UiButton>
      </div>
    </div>

    <div class="course-list">
      <div
        v-for="course in courses"
        :key="course.id"
        class="course-card"
        :class="{ teaching: isTeaching(course.id) }"
        @click="handleCourseClick(course.id)"
      >
        <div class="course-row">
          <div class="course-indicator">
            <span v-if="isTeaching(course.id)" class="badge badge--teaching"
              >Teaching</span
            >
          </div>

          <div class="course-info">
            <div class="course-title-row">
              <h3>{{ course.name }}</h3>
            </div>
            <p v-if="course.professor_name">{{ course.professor_name }}</p>
          </div>

          <div v-if="isTeaching(course.id)" class="course-actions">
            <UiButton
              size="sm"
              variant="outline"
              title="Edit course"
              @click="handleEditClick(course.id, $event)"
            >
              Edit
            </UiButton>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.courses-page {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-height: 100%;
}

.courses-heading {
  position: sticky;
  top: 0;
  z-index: 5;
  padding-bottom: 0.75rem;
  background: var(--background);
}

.heading-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.page-title {
  font-size: 1.875rem;
  font-weight: 700;
  color: var(--color-text);
  margin: 0 0 0.5rem 0;
}

.page-subtitle {
  font-size: 0.95rem;
  color: var(--muted-foreground);
  margin: 0;
}

.course-list {
  display: grid;
  gap: 0.75rem;
}

.course-card {
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 1rem;
  background: var(--card);
  transition: all 0.2s ease;
  cursor: pointer;
}

.course-card:hover {
  border-color: var(--primary);
  background: var(--accent);
}

.course-card.teaching {
  border-color: var(--primary);
  background: var(--accent);
}

.course-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  list-style: none;
  padding: 0;
  margin: 0;
}

.course-indicator {
  min-width: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.course-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  margin-left: auto;
}

.course-info {
  flex: 1;
  min-width: 0;
}

.course-title-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.25rem;
}

.course-title-row h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--color-text);
}

.course-info p {
  margin: 0;
  font-size: 0.9rem;
  color: var(--muted-foreground);
}

.badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
  background: var(--primary);
  color: var(--card);
}

.badge--teaching {
  background: var(--primary);
  color: var(--card);
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.85rem;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  background: var(--primary);
  color: var(--card);
  font-family: inherit;
}

.btn:hover {
  background: var(--color-primary-dark);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px color-mix(in oklab, var(--primary), transparent 70%);
}

.btn--edit {
  background: var(--primary);
  color: var(--card);
}
</style>
