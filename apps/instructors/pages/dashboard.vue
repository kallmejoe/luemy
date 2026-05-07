<script setup lang="ts">
import { ref, onMounted } from 'vue'
import UiButton from '@core/components/ui/Button.vue'
import UiInput from '@core/components/ui/Input.vue'
import UiLabel from '@core/components/ui/Label.vue'
import UiTextarea from '@core/components/ui/Textarea.vue'
import { useUser } from '@core/composables/useUser'
import { useAuth } from '@core/composables/useAuth'
import {
  BookOpen,
  GraduationCap,
  CalendarClock,
  ArrowRight,
} from 'lucide-vue-next'

interface Assignment {
  id: number
  course_id: number
  title: string
  course_name: string
  due_date: string | null
}

interface Course {
  id: number
  name: string
}

interface CoursesResponse {
  success: boolean
  courses: Course[]
}

interface AssignmentsResponse {
  success: boolean
  assignments: Assignment[]
}

definePageMeta({
  middleware: ['auth']
})

const user = useUser()
const { token } = useAuth()

const coursesCount = ref(0)
const assignmentsCount = ref(0)
const recentAssignments = ref<Assignment[]>([])

onMounted(async () => {
  try {
    const [coursesRes, assignmentsRes] = await Promise.all([
      $fetch<CoursesResponse>('/api/courses/my-courses', {
        headers: { Authorization: `Bearer ${token.value}` }
      }),
      $fetch<AssignmentsResponse>('/api/assignments/professor-assignments', {
        headers: { Authorization: `Bearer ${token.value}` }
      })
    ])

    if (coursesRes.success) {
      coursesCount.value = coursesRes.courses.length
    }
    if (assignmentsRes.success) {
      assignmentsCount.value = assignmentsRes.assignments.length
      recentAssignments.value = assignmentsRes.assignments.slice(0, 5)
    }
  } catch {
    // Silently fail — dashboard is non-critical
  }
})

const showCreateCourseModal = ref(false)
const showAddTimeSlotModal = ref(false)

const courseForm = ref({
  name: '',
  description: '',
  active: true
})

const creatingCourse = ref(false)
const createCourseError = ref('')

const timeSlotForm = ref({
  day: 'Monday',
  start: '',
  end: ''
})

const creatingTimeSlot = ref(false)
const createTimeSlotError = ref('')
const createTimeSlotSuccess = ref('')

async function createCourse() {
  creatingCourse.value = true
  createCourseError.value = ''

  try {
    const response = await $fetch('/api/courses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token.value}`
      },
      body: {
        name: courseForm.value.name,
        description: courseForm.value.description,
        active: courseForm.value.active
      }
    })

    if (response.success) {
      showCreateCourseModal.value = false
      courseForm.value = {
        name: '',
        description: '',
        active: true
      }
      coursesCount.value++
    } else {
      createCourseError.value = response.message || 'Failed to create course'
    }
  } catch {
    createCourseError.value = 'Failed to create course'
  } finally {
    creatingCourse.value = false
  }
}

function resetTimeSlotForm() {
  timeSlotForm.value = {
    day: 'Monday',
    start: '',
    end: ''
  }
}

function closeTimeSlotModal() {
  showAddTimeSlotModal.value = false
  createTimeSlotError.value = ''
  resetTimeSlotForm()
}

async function createTimeSlot() {
  creatingTimeSlot.value = true
  createTimeSlotError.value = ''
  createTimeSlotSuccess.value = ''

  try {
    const response = await $fetch<{ success: boolean; message?: string }>(
      '/api/staff/office-hours',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token.value}`
        },
        body: {
          day: timeSlotForm.value.day,
          start: timeSlotForm.value.start,
          end: timeSlotForm.value.end
        }
      }
    )

    if (response.success) {
      closeTimeSlotModal()
      createTimeSlotSuccess.value = 'Time slot added successfully.'
    } else {
      createTimeSlotError.value = response.message || 'Failed to add time slot'
    }
  } catch (error: unknown) {
    const fetchError = error as { data?: { message?: string } }
    createTimeSlotError.value =
      fetchError.data?.message || 'Failed to add time slot'
  } finally {
    creatingTimeSlot.value = false
  }
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return 'No due date'
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
</script>

<template>
  <div class="dashboard">
    <div class="dashboard-header">
      <div>
        <h1 class="dashboard-title">Instructor Dashboard</h1>
        <p class="dashboard-welcome">
          Welcome back, <strong>{{ user?.name }}</strong>
        </p>
      </div>
    </div>

    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-icon stat-icon--courses">
          <BookOpen />
        </div>
        <div>
          <p class="stat-value">{{ coursesCount }}</p>
          <p class="stat-label">Courses</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon stat-icon--assignments">
          <GraduationCap />
        </div>
        <div>
          <p class="stat-value">{{ assignmentsCount }}</p>
          <p class="stat-label">Assignments</p>
        </div>
      </div>
      <div class="stat-card stat-card--action">
        <p class="stat-label">Quick Actions</p>
        <p v-if="createTimeSlotSuccess" class="success-message">{{ createTimeSlotSuccess }}</p>
        <div class="action-buttons">
          <UiButton @click="showCreateCourseModal = true">Create Course</UiButton>
          <UiButton variant="outline" @click="navigateTo('/assignments')">Manage Assignments</UiButton>
          <UiButton variant="outline" @click="showAddTimeSlotModal = true">Add Time Slot</UiButton>
        </div>
      </div>
    </div>

    <div class="dashboard-grid">
      <div class="dashboard-card dashboard-card--info">
        <h2>Account Info</h2>
        <div class="info-rows">
          <div class="info-row">
            <span class="info-label">Email</span>
            <span class="info-value">{{ user?.email }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Role</span>
            <span class="info-value role-badge">{{ user?.role }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">User ID</span>
            <span class="info-value">#{{ user?.id }}</span>
          </div>
        </div>
      </div>

      <div class="dashboard-card dashboard-card--assignments">
        <div class="card-header">
          <h2>Recent Assignments</h2>
          <button class="card-link" @click="navigateTo('/assignments')">
            View all <ArrowRight class="inline-icon" />
          </button>
        </div>
        <div v-if="recentAssignments.length === 0" class="empty-list">
          No assignments yet. Create your first one!
        </div>
        <div v-else class="assignment-list">
          <div
            v-for="assignment in recentAssignments"
            :key="assignment.id"
            class="assignment-row"
          >
            <div class="assignment-info">
              <p class="assignment-title">{{ assignment.title }}</p>
              <p class="assignment-course">{{ assignment.course_name }}</p>
            </div>
            <div class="assignment-meta">
              <CalendarClock class="meta-icon" />
              <span :class="['due-date', { 'is-overdue': assignment.due_date && new Date(assignment.due_date) < new Date() }]">
                {{ formatDate(assignment.due_date) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Course Modal -->
    <div
      v-if="showCreateCourseModal"
      class="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-course-title"
    >
      <div class="modal-content">
        <div class="modal-header">
          <h2 id="create-course-title">Create Course</h2>
          <UiButton
            type="button"
            aria-label="Close dialog"
            class="modal-close"
            variant="ghost"
            size="icon"
            @click="showCreateCourseModal = false"
          >
            x
          </UiButton>
        </div>

        <form class="modal-form" @submit.prevent="createCourse">
          <div v-if="createCourseError" class="error-message">
            {{ createCourseError }}
          </div>

          <div class="form-field">
            <UiLabel for="course-name">Course Name</UiLabel>
            <UiInput
              id="course-name"
              v-model="courseForm.name"
              type="text"
              required
            />
          </div>

          <div class="form-field">
            <UiLabel for="course-description">Description</UiLabel>
            <UiTextarea
              id="course-description"
              v-model="courseForm.description"
            />
          </div>

          <div class="form-field form-field--checkbox">
            <input
              id="course-active"
              v-model="courseForm.active"
              type="checkbox"
              name="active"
            >
            <UiLabel for="course-active">Active</UiLabel>
          </div>

          <div class="modal-actions">
            <UiButton
              type="button"
              variant="outline"
              @click="showCreateCourseModal = false"
            >
              Cancel
            </UiButton>

            <UiButton type="submit" :disabled="creatingCourse">
              {{ creatingCourse ? 'Creating...' : 'Create Course' }}
            </UiButton>
          </div>
        </form>
      </div>
    </div>

    <!-- Add Time Slot Modal -->
    <div
      v-if="showAddTimeSlotModal"
      class="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-time-slot-title"
    >
      <div class="modal-content">
        <div class="modal-header">
          <h2 id="add-time-slot-title">Add Availability Time Slot</h2>
          <UiButton
            type="button"
            aria-label="Close dialog"
            class="modal-close"
            variant="ghost"
            size="icon"
            @click="closeTimeSlotModal"
          >
            x
          </UiButton>
        </div>

        <form class="modal-form" @submit.prevent="createTimeSlot">
          <div v-if="createTimeSlotError" class="error-message">
            {{ createTimeSlotError }}
          </div>

          <div class="form-field">
            <UiLabel for="slot-day">Day</UiLabel>
            <select id="slot-day" v-model="timeSlotForm.day" required>
              <option value="Monday">Monday</option>
              <option value="Tuesday">Tuesday</option>
              <option value="Wednesday">Wednesday</option>
              <option value="Thursday">Thursday</option>
              <option value="Friday">Friday</option>
              <option value="Saturday">Saturday</option>
              <option value="Sunday">Sunday</option>
            </select>
          </div>

          <div class="form-field">
            <UiLabel for="slot-start">Start Time</UiLabel>
            <UiInput
              id="slot-start"
              v-model="timeSlotForm.start"
              type="time"
              required
            />
          </div>

          <div class="form-field">
            <UiLabel for="slot-end">End Time</UiLabel>
            <UiInput
              id="slot-end"
              v-model="timeSlotForm.end"
              type="time"
              required
            />
          </div>

          <div class="modal-actions">
            <UiButton type="button" variant="outline" @click="closeTimeSlotModal">
              Cancel
            </UiButton>

            <UiButton type="submit" :disabled="creatingTimeSlot">
              {{ creatingTimeSlot ? 'Adding...' : 'Add Time Slot' }}
            </UiButton>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-sm);
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

.stat-card {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-lg);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--card);
  box-shadow: var(--shadow-sm);
}

.stat-card--action {
  flex-direction: column;
  align-items: stretch;
  gap: var(--spacing-sm);
}

.stat-card--action .stat-label {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 720;
  color: var(--foreground);
}

.stat-icon {
  display: grid;
  width: 3rem;
  height: 3rem;
  place-items: center;
  border-radius: var(--radius-md);
  flex-shrink: 0;
}

.stat-icon svg {
  width: 1.5rem;
  height: 1.5rem;
}

.stat-icon--courses {
  background: color-mix(in oklab, var(--primary), transparent 88%);
  color: var(--primary);
}

.stat-icon--assignments {
  background: color-mix(in oklab, var(--chart-5), transparent 88%);
  color: var(--chart-5);
}

.stat-value {
  margin: 0;
  font-size: 1.75rem;
  font-weight: 780;
  color: var(--foreground);
  line-height: 1.2;
}

.stat-label {
  margin: 0;
  font-size: 0.85rem;
  color: var(--muted-foreground);
  font-weight: 600;
}

.action-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}

.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-md);
}

.dashboard-card--info .info-rows {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-sm) 0;
  border-bottom: 1px solid var(--border);
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  font-size: 0.85rem;
  color: var(--muted-foreground);
  font-weight: 600;
}

.info-value {
  font-size: 0.9rem;
  color: var(--foreground);
  font-weight: 600;
}

.role-badge {
  display: inline-block;
  padding: 0.2rem 0.6rem;
  border-radius: 999rem;
  background: color-mix(in oklab, var(--chart-5), transparent 88%);
  color: var(--chart-5);
  font-size: 0.8rem;
  text-transform: capitalize;
}

.dashboard-card--assignments {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-header h2 {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 720;
  color: var(--foreground);
}

.card-link {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  background: none;
  border: none;
  color: var(--primary);
  font-size: 0.85rem;
  font-weight: 650;
  cursor: pointer;
  padding: 0;
}

.card-link:hover {
  text-decoration: underline;
  text-underline-offset: 2px;
}

.inline-icon {
  width: 0.9rem;
  height: 0.9rem;
}

.empty-list {
  padding: var(--spacing-lg);
  text-align: center;
  color: var(--muted-foreground);
  font-size: 0.9rem;
}

.assignment-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.assignment-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  transition: background-color 0.15s ease;
}

.assignment-row:hover {
  background: var(--accent);
}

.assignment-info {
  flex: 1;
  min-width: 0;
}

.assignment-title {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 650;
  color: var(--foreground);
}

.assignment-course {
  margin: 0.15rem 0 0;
  font-size: 0.78rem;
  color: var(--muted-foreground);
}

.assignment-meta {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  flex-shrink: 0;
}

.meta-icon {
  width: 0.85rem;
  height: 0.85rem;
  color: var(--muted-foreground);
}

.due-date {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--muted-foreground);
}

.due-date.is-overdue {
  color: var(--destructive);
}

.success-message {
  padding: var(--spacing-xs) var(--spacing-sm);
  background: color-mix(in oklab, var(--success), transparent 90%);
  border: 1px solid var(--success);
  border-radius: var(--radius);
  color: var(--success);
  font-size: 0.85rem;
  font-weight: 600;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--overlay);
  padding: var(--spacing-md);
}

.modal-content {
  width: 100%;
  max-width: 28rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--card);
  box-shadow: var(--shadow-lg);
  padding: var(--spacing-lg);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-lg);
}

.modal-header h2 {
  margin: 0;
  color: var(--foreground);
  font-size: 1.2rem;
  font-weight: 700;
}

.modal-close {
  flex: 0 0 auto;
}

.modal-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.form-field--checkbox {
  flex-direction: row;
  align-items: center;
}

.form-field--checkbox input {
  width: 1rem;
  height: 1rem;
  accent-color: var(--primary);
}

.form-field select {
  min-height: 2.5rem;
  border: 1px solid var(--input);
  border-radius: var(--radius-md);
  background: var(--card);
  color: var(--foreground);
  padding: 0 var(--spacing-sm);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-sm);
  padding-top: var(--spacing-xs);
}

@media (max-width: 860px) {
  .stats-row {
    grid-template-columns: 1fr 1fr;
  }

  .stat-card--action {
    grid-column: 1 / -1;
  }

  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .stats-row {
    grid-template-columns: 1fr;
  }

  .dashboard-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-sm);
  }

  .assignment-row {
    flex-direction: column;
    align-items: flex-start;
  }

  .modal-actions {
    flex-direction: column-reverse;
  }
}
</style>
