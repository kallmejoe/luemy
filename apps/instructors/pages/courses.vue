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

const router = useRouter()
const token = useCookie("token")

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
          <h1 class="page-title">Courses</h1>
          <p class="page-subtitle">
            Manage your courses and view available offerings
          </p>
        </div>
        <UiButton @click="handleCreateCourse" class="create-btn">
          + New Course
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
        <!-- Teaching Badge -->
        <div v-if="isTeaching(course.id)" class="card-badge">
          <span class="badge-icon">✓</span>
          <span>Teaching</span>
        </div>

        <!-- Main Content -->
        <div class="card-content">
          <div class="card-main">
            <h3 class="course-name">{{ course.name }}</h3>
            <p v-if="course.professor_name" class="professor-name">
              {{ course.professor_name }}
            </p>
          </div>

          <!-- Edit Button (Only for teaching courses) -->
          <div v-if="isTeaching(course.id)" class="card-actions">
            <button
              class="edit-btn"
              title="Edit course"
              @click="handleEditClick(course.id, $event)"
            >
              <span class="edit-icon">✎</span>
            </button>
          </div>
        </div>

        <!-- Hover Overlay -->
        <div class="card-overlay">
          <span class="view-text">View Course</span>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="courses.length === 0" class="empty-state">
      <div class="empty-icon">📚</div>
      <h2>No courses available</h2>
      <p>Create your first course to get started</p>
      <UiButton @click="handleCreateCourse">Create Course</UiButton>
    </div>
  </div>
</template>

<style scoped>
.courses-page {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
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

.create-btn {
  background: var(--primary);
  color: var(--primary-foreground);
  font-weight: 600;
}

.course-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1rem;
}

.course-card {
  position: relative;
  display: flex;
  flex-direction: column;
  padding: 1.5rem;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.25s ease;
  overflow: hidden;
}

.course-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: transparent;
  transition: background 0.25s ease;
}

.course-card:hover {
  border-color: var(--primary);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px color-mix(in oklab, var(--foreground), transparent 90%);
}

.course-card:hover::before {
  background: var(--primary);
}

.course-card.teaching {
  border-color: color-mix(in oklab, var(--primary), transparent 50%);
  background: linear-gradient(135deg, var(--card) 0%, color-mix(in oklab, var(--primary), transparent 3%) 100%);
}

.course-card.teaching::before {
  background: var(--primary);
}

.card-badge {
  position: absolute;
  top: 0;
  right: 0;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.375rem 0.75rem;
  background: var(--primary);
  color: var(--primary-foreground);
  font-size: 0.75rem;
  font-weight: 600;
  border-bottom-left-radius: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.badge-icon {
  font-size: 0.65rem;
}

.card-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-top: 0.5rem;
}

.card-main {
  flex: 1;
  min-width: 0;
}

.course-name {
  margin: 0 0 0.5rem 0;
  font-size: 1.15rem;
  font-weight: 600;
  color: var(--color-text);
  line-height: 1.3;
}

.professor-name {
  margin: 0;
  font-size: 0.9rem;
  color: var(--muted-foreground);
}

.card-actions {
  flex-shrink: 0;
}

.edit-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--card);
  color: var(--muted-foreground);
  cursor: pointer;
  transition: all 0.2s ease;
}

.edit-btn:hover {
  border-color: var(--primary);
  background: var(--accent);
  color: var(--primary);
}

.edit-icon {
  font-size: 1rem;
}

.card-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--primary);
  opacity: 0;
  transition: opacity 0.25s ease;
  pointer-events: none;
}

.course-card:hover .card-overlay {
  opacity: 0.1;
}

.view-text {
  padding: 0.75rem 1.5rem;
  background: var(--primary);
  color: var(--primary-foreground);
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.9rem;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 4rem 2rem;
  text-align: center;
}

.empty-icon {
  font-size: 4rem;
  opacity: 0.5;
}

.empty-state h2 {
  margin: 0;
  font-size: 1.5rem;
  color: var(--color-text);
}

.empty-state p {
  margin: 0 0 1rem 0;
  color: var(--muted-foreground);
}

@media (max-width: 640px) {
  .course-list {
    grid-template-columns: 1fr;
  }

  .heading-content {
    flex-direction: column;
  }

  .page-title {
    font-size: 1.5rem;
  }
}
</style>
