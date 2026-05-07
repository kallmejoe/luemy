<script setup lang="ts">
import { ref, onMounted, computed } from "vue"
import { useRouter, useRoute } from "vue-router"
import UiButton from "@core/components/ui/Button.vue"

interface Course {
  id: number
  name: string
  description: string
  professor_id: number
  active: number
  created_at: string
}

interface Assignment {
  id: number
  course_id: number
  title: string
  description: string
  max_score: number
  due_date: string
  course_name: string
}

const router = useRouter()
const route = useRoute()
const token = useCookie("token")

const course = ref<Course | null>(null)
const assignments = ref<Assignment[]>([])
const loading = ref(true)
const error = ref("")

const courseId = computed(() => route.params.id as string)

const fetchCourse = async () => {
  try {
    const res = await $fetch(`/api/courses/${courseId.value}`, {
      headers: {
        Authorization: `Bearer ${token.value}`,
      },
    })

    if (res.success) {
      course.value = res.course
    } else {
      error.value = res.message || "Failed to load course"
    }
  } catch (err) {
    console.error(err)
    error.value = "Failed to load course details"
  }
}

const fetchAssignments = async () => {
  try {
    const res = await $fetch("/api/assignments/professor-assignments", {
      headers: {
        Authorization: `Bearer ${token.value}`,
      },
    })

    if (res.success) {
      // Filter assignments for this course
      assignments.value = res.assignments.filter(
        (a: Assignment) => a.course_id === parseInt(courseId.value)
      )
    }
  } catch (err) {
    console.error(err)
  }
}

onMounted(async () => {
  await Promise.all([fetchCourse(), fetchAssignments()])
  loading.value = false
})

const handleBack = () => {
  router.back()
}

const handleEditCourse = () => {
  router.push(`/edit-course/${courseId.value}`)
}

const handleViewAssignment = (assignmentId: number) => {
  router.push(`/assignment/${assignmentId}`)
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

const isOverdue = (dueDate: string) => {
  return new Date(dueDate) < new Date()
}
</script>

<template>
  <div class="course-detail">
    <!-- Header -->
    <div class="detail-header">
      <button class="back-button" @click="handleBack">
        <span class="back-icon">←</span>
      </button>
      <div class="header-content">
        <h1 v-if="course" class="course-title">{{ course.name }}</h1>
        <h1 v-else class="course-title">Loading...</h1>
      </div>
      <UiButton v-if="course" @click="handleEditCourse" variant="outline" size="sm">
        Edit Course
      </UiButton>
    </div>

    <!-- Error State -->
    <div v-if="error && !loading" class="error-banner">
      {{ error }}
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <p>Loading course details...</p>
    </div>

    <!-- Content -->
    <div v-else-if="course" class="course-content">
      <!-- Course Info Card -->
      <section class="info-section">
        <div class="section-header">
          <h2>Course Information</h2>
        </div>
        <div class="info-card">
          <div class="info-group">
            <label>Description</label>
            <p class="info-value">
              {{ course.description || "No description provided" }}
            </p>
          </div>
          <div class="info-row">
            <div class="info-group">
              <label>Status</label>
              <p class="info-value">
                <span class="status-badge" :class="{ active: course.active }">
                  {{ course.active ? "Active" : "Inactive" }}
                </span>
              </p>
            </div>
            <div class="info-group">
              <label>Created</label>
              <p class="info-value">{{ formatDate(course.created_at) }}</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Assignments Section -->
      <section class="assignments-section">
        <div class="section-header">
          <h2>Assignments</h2>
          <span v-if="assignments.length > 0" class="count-badge">
            {{ assignments.length }}
          </span>
        </div>

        <div v-if="assignments.length === 0" class="empty-state">
          <p>No assignments for this course yet</p>
          <UiButton @click="() => router.push('/create-assignment')" variant="outline">
            Create Assignment
          </UiButton>
        </div>

        <div v-else class="assignments-list">
          <div
            v-for="assignment in assignments"
            :key="assignment.id"
            class="assignment-item"
            :class="{ overdue: isOverdue(assignment.due_date) }"
          >
            <div class="assignment-left">
              <div class="assignment-header">
                <h3>{{ assignment.title }}</h3>
                <span v-if="isOverdue(assignment.due_date)" class="overdue-badge">
                  Overdue
                </span>
              </div>
              <p class="assignment-description">
                {{ assignment.description }}
              </p>
            </div>
            <div class="assignment-right">
              <div class="due-date">
                <span class="label">Due:</span>
                <span class="value">{{ formatDate(assignment.due_date) }}</span>
              </div>
              <div class="max-score">
                <span class="label">Max Score:</span>
                <span class="value">{{ assignment.max_score }}</span>
              </div>
              <UiButton
                @click="handleViewAssignment(assignment.id)"
                size="sm"
                variant="outline"
              >
                View Details
              </UiButton>
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- Not Found State -->
    <div v-else class="not-found">
      <p>Course not found</p>
      <UiButton @click="handleBack">Go Back</UiButton>
    </div>
  </div>
</template>

<style scoped>
.course-detail {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  min-height: 100%;
  padding-bottom: 2rem;
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid var(--border);
  sticky: top;
  background: var(--background);
  z-index: 10;
}

.back-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--card);
  color: var(--foreground);
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 1.25rem;
  flex-shrink: 0;
}

.back-button:hover {
  border-color: var(--primary);
  background: var(--accent);
}

.back-icon {
  display: block;
  line-height: 1;
}

.header-content {
  flex: 1;
  min-width: 0;
}

.course-title {
  margin: 0;
  font-size: 1.875rem;
  font-weight: 700;
  color: var(--color-text);
  word-break: break-word;
}

.error-banner {
  padding: 1rem;
  background: color-mix(in oklab, var(--destructive), transparent 90%);
  border: 1px solid var(--destructive);
  border-radius: 6px;
  color: var(--destructive-foreground);
  font-size: 0.95rem;
}

.loading-state,
.not-found {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 3rem 2rem;
  text-align: center;
  color: var(--muted-foreground);
}

.course-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.info-section,
.assignments-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.section-header h2 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text);
}

.count-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 24px;
  padding: 0 0.5rem;
  background: var(--primary);
  color: var(--primary-foreground);
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 600;
}

.info-card {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 1.5rem;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 8px;
}

.info-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.info-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.info-group label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--muted-foreground);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-value {
  margin: 0;
  font-size: 1rem;
  color: var(--foreground);
  line-height: 1.5;
}

.status-badge {
  display: inline-block;
  padding: 0.375rem 0.75rem;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 500;
  background: var(--muted);
  color: var(--muted-foreground);
  width: fit-content;
}

.status-badge.active {
  background: color-mix(in oklab, var(--success), transparent 85%);
  color: var(--success);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 2rem;
  background: var(--card);
  border: 1px dashed var(--border);
  border-radius: 8px;
  text-align: center;
  color: var(--muted-foreground);
}

.assignments-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.assignment-item {
  display: flex;
  align-items: stretch;
  gap: 1.5rem;
  padding: 1.25rem;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 8px;
  transition: all 0.2s ease;
}

.assignment-item:hover {
  border-color: var(--primary);
  background: var(--accent);
}

.assignment-item.overdue {
  border-left: 4px solid var(--destructive);
}

.assignment-left {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.assignment-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.assignment-header h3 {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--color-text);
}

.overdue-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background: color-mix(in oklab, var(--destructive), transparent 85%);
  color: var(--destructive);
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
}

.assignment-description {
  margin: 0;
  font-size: 0.9rem;
  color: var(--muted-foreground);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.assignment-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.75rem;
  flex-shrink: 0;
}

.due-date,
.max-score {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.25rem;
}

.due-date .label,
.max-score .label {
  font-size: 0.8rem;
  color: var(--muted-foreground);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 600;
}

.due-date .value,
.max-score .value {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text);
}

/* Responsive Design */
@media (max-width: 768px) {
  .detail-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .course-title {
    font-size: 1.5rem;
  }

  .assignment-item {
    flex-direction: column;
    gap: 1rem;
  }

  .assignment-right {
    width: 100%;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }

  .due-date,
  .max-score {
    align-items: flex-start;
  }

  .info-row {
    grid-template-columns: 1fr;
  }
}
</style>
