<script setup lang="ts">
import { ref, onMounted } from "vue"

interface Course {
  id: number
  name: string
  description?: string
  professor_name?: string
  professor_id: number
  active: number
}

defineOptions({ name: "StaffCourses" })

definePageMeta({
  middleware: ["auth"],
})

const courses = ref<Course[]>([])

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

onMounted(fetchCourses)
</script>

<template>
  <div class="courses-page">
    <div class="courses-heading">
      <h1 class="page-title">Courses</h1>
      <p class="page-subtitle">View all courses in the system</p>
    </div>

    <div class="course-list">
      <div
        v-for="course in courses"
        :key="course.id"
        class="course-card"
      >
        <div class="card-content">
          <div class="card-main">
            <h3 class="course-name">{{ course.name }}</h3>
            <p v-if="course.professor_name" class="professor-name">
              {{ course.professor_name }}
            </p>
            <p v-if="course.description" class="course-description">
              {{ course.description }}
            </p>
          </div>
          <div class="card-status" :class="{ active: course.active }">
            {{ course.active ? "Active" : "Inactive" }}
          </div>
        </div>
      </div>
    </div>

    <div v-if="courses.length === 0" class="empty-state">
      <h2>No courses available</h2>
      <p>There are no courses in the system yet.</p>
    </div>
  </div>
</template>

<style scoped>
.courses-page {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.courses-heading {
  position: sticky;
  top: 0;
  z-index: 5;
  padding-bottom: 0.75rem;
  background: var(--background);
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
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1rem;
}

.course-card {
  display: flex;
  flex-direction: column;
  padding: 1.5rem;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 10px;
  transition: all 0.25s ease;
  overflow: hidden;
}

.course-card:hover {
  border-color: var(--primary);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px color-mix(in oklab, var(--foreground), transparent 90%);
}

.card-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
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
  margin: 0 0 0.25rem 0;
  font-size: 0.9rem;
  color: var(--muted-foreground);
}

.course-description {
  margin: 0;
  font-size: 0.85rem;
  color: var(--muted-foreground);
  line-height: 1.5;
}

.card-status {
  flex-shrink: 0;
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  background: color-mix(in oklab, var(--muted-foreground), transparent 80%);
  color: var(--muted-foreground);
}

.card-status.active {
  background: color-mix(in oklab, var(--primary), transparent 80%);
  color: var(--primary);
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

.empty-state h2 {
  margin: 0;
  font-size: 1.5rem;
  color: var(--color-text);
}

.empty-state p {
  margin: 0;
  color: var(--muted-foreground);
}

@media (max-width: 640px) {
  .course-list {
    grid-template-columns: 1fr;
  }

  .page-title {
    font-size: 1.5rem;
  }
}
</style>
