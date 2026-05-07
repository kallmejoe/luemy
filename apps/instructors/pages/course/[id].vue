<template>
  <div class="course-details-page">
    <div class="page-header">
      <router-link to="/courses" class="back-link">
        <span class="back-arrow">←</span> Back to Courses
      </router-link>
      <h1 class="page-title">{{ course?.name || "Course Details" }}</h1>
    </div>

    <div class="page-content">
      <div v-if="isLoading" class="loading-state">
        <p>Loading course details...</p>
      </div>

      <div v-else-if="error" class="error-state">
        <p>{{ error }}</p>
        <router-link to="/courses" class="btn btn--primary">
          Back to Courses
        </router-link>
      </div>

      <div v-else-if="course" class="details-container">
        <div class="course-header">
          <div class="course-meta">
            <div v-if="isTeaching" class="status-badge teaching">
              You are teaching this course
            </div>
            <div v-if="course.active === 1" class="status-badge active">
              Active
            </div>
            <div v-else class="status-badge inactive">
              Inactive
            </div>
          </div>
        </div>

        <div class="course-details">
          <section class="detail-section">
            <h2 class="section-title">Course Information</h2>
            <div class="detail-grid">
              <div class="detail-item">
                <label class="detail-label">Course Name</label>
                <p class="detail-value">{{ course.name }}</p>
              </div>
              <div class="detail-item">
                <label class="detail-label">Status</label>
                <p class="detail-value">
                  {{ course.active === 1 ? "Active" : "Inactive" }}
                </p>
              </div>
            </div>
          </section>

          <section class="detail-section">
            <h2 class="section-title">Description</h2>
            <div class="description-box">
              <p v-if="course.description" class="description-text">
                {{ course.description }}
              </p>
              <p v-else class="description-empty">
                No description provided
              </p>
            </div>
          </section>

          <section class="detail-section">
            <h2 class="section-title">Course Details</h2>
            <div class="detail-grid">
              <div class="detail-item">
                <label class="detail-label">Created</label>
                <p class="detail-value">{{ formatDate(course.created_at) }}</p>
              </div>
              <div class="detail-item">
                <label class="detail-label">Professor ID</label>
                <p class="detail-value">{{ course.professor_id }}</p>
              </div>
            </div>
          </section>

          <div v-if="isTeaching" class="actions">
            <router-link
              :to="`/edit-course/${course.id}`"
              class="btn btn--primary"
            >
              Edit Course
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue"
import { useRoute } from "vue-router"

definePageMeta({
  middleware: ["auth"]
})

interface Course {
  id: number
  name: string
  description: string
  active: number
  professor_id: number
  created_at: string
}

const route = useRoute()
const token = useCookie("token")

const course = ref<Course | null>(null)
const isLoading = ref(true)
const error = ref("")
const currentUserId = ref<number | null>(null)

const courseId = route.params.id as string

const isTeaching = computed(() => {
  return course.value && currentUserId.value === course.value.professor_id
})

onMounted(async () => {
  await Promise.all([fetchCourse(), getCurrentUser()])
})

const fetchCourse = async () => {
  isLoading.value = true
  error.value = ""

  try {
    const response = await $fetch(`/api/courses/${courseId}`, {
      headers: {
        Authorization: `Bearer ${token.value}`
      }
    })

    if (response.success) {
      course.value = response.course
    } else {
      error.value =
        (response as Record<string, unknown>).message ||
        "Failed to load course"
    }
  } catch (err: unknown) {
    console.error("Error fetching course:", err)
    const errorMessage =
      (err as { data?: Record<string, unknown> })?.data?.message ||
      "Failed to load course. Please try again."
    error.value = String(errorMessage)
  } finally {
    isLoading.value = false
  }
}

const getCurrentUser = async () => {
  try {
    const response = await $fetch("/api/auth/me", {
      headers: {
        Authorization: `Bearer ${token.value}`
      }
    })

    if ((response as Record<string, unknown>).success) {
      const user = (response as Record<string, unknown>).user as {
        id: number
      } | null
      currentUserId.value = user?.id || null
    }
  } catch (err: unknown) {
    console.error("Error fetching user:", err)
  }
}

const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  } catch {
    return dateString
  }
}
</script>

<style scoped>
.course-details-page {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  min-height: 100%;
  padding: var(--spacing-md);
}

.page-header {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--primary);
  text-decoration: none;
  font-weight: 500;
  width: fit-content;
  padding: var(--spacing-xs) 0;
  transition: all 0.2s ease;
}

.back-link:hover {
  color: var(--color-primary-dark);
  transform: translateX(-4px);
}

.back-arrow {
  font-size: 1.25rem;
}

.page-title {
  font-size: 2rem;
  font-weight: 700;
  color: var(--foreground);
  margin: 0;
  padding: var(--spacing-md) 0 0 0;
}

.page-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.loading-state {
  text-align: center;
  padding: var(--spacing-lg);
  color: var(--muted-foreground);
  font-size: 1rem;
}

.error-state {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  align-items: center;
  padding: var(--spacing-lg);
  background: color-mix(in oklab, var(--destructive), var(--card) 90%);
  border: 1px solid color-mix(in oklab, var(--destructive), var(--border) 70%);
  border-radius: 8px;
  color: var(--destructive);
  text-align: center;
}

.error-state p {
  margin: 0;
  font-size: 0.95rem;
}

.details-container {
  max-width: 900px;
  margin: 0 auto;
  width: 100%;
}

.course-header {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
}

.course-meta {
  display: flex;
  gap: var(--spacing-md);
  flex-wrap: wrap;
}

.status-badge {
  display: inline-block;
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
}

.status-badge.teaching {
  background: var(--primary);
  color: var(--card);
}

.status-badge.active {
  background: color-mix(in oklab, var(--success), var(--card) 90%);
  color: var(--success);
  border: 1px solid color-mix(in oklab, var(--success), var(--border) 70%);
}

.status-badge.inactive {
  background: color-mix(in oklab, var(--destructive), var(--card) 90%);
  color: var(--destructive);
  border: 1px solid color-mix(in oklab, var(--destructive), var(--border) 70%);
}

.course-details {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.detail-section {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: var(--spacing-lg);
}

.section-title {
  margin: 0 0 var(--spacing-md) 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--foreground);
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--spacing-md);
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.detail-label {
  font-weight: 600;
  color: var(--muted-foreground);
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.detail-value {
  margin: 0;
  color: var(--foreground);
  font-size: 0.95rem;
}

.description-box {
  background: var(--accent);
  border-left: 4px solid var(--primary);
  padding: var(--spacing-md);
  border-radius: 4px;
}

.description-text {
  margin: 0;
  color: var(--foreground);
  line-height: 1.6;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.description-empty {
  margin: 0;
  color: var(--muted-foreground);
  font-style: italic;
}

.actions {
  display: flex;
  gap: var(--spacing-md);
  margin-top: var(--spacing-lg);
}

.btn {
  display: inline-block;
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--primary);
  color: var(--card);
  text-decoration: none;
  border-radius: 6px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
}

.btn:hover {
  background: var(--color-primary-dark);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px color-mix(in oklab, var(--primary), transparent 70%);
}

.btn--primary {
  background: var(--primary);
}

@media (max-width: 640px) {
  .course-details-page {
    padding: var(--spacing-sm);
  }

  .page-title {
    font-size: 1.5rem;
  }

  .detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>
