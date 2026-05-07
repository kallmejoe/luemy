<script setup lang="ts">
import { ref } from 'vue'
import UiButton from '@core/components/ui/Button.vue'
import UiInput from '@core/components/ui/Input.vue'
import UiLabel from '@core/components/ui/Label.vue'
import UiTextarea from '@core/components/ui/Textarea.vue'
import { useUser } from '@core/composables/useUser'
import { useAuth } from '@core/composables/useAuth'

definePageMeta({
  middleware: ['auth']
})

const user = useUser()
const { token } = useAuth()

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
</script>

<template>
  <div class="dashboard">
    <div class="dashboard-header">
      <h1 class="dashboard-title">Instructor Dashboard</h1>
      <p class="dashboard-welcome">
        Welcome back, <strong>{{ user?.name }}</strong>
      </p>
    </div>

    <div class="dashboard-grid">
      <div class="dashboard-card">
        <h2>Account Info</h2>
        <p><strong>Email:</strong> {{ user?.email }}</p>
        <p><strong>Role:</strong> {{ user?.role }}</p>
      </div>

      <div class="dashboard-card dashboard-card--action">
        <h2>Quick Actions</h2>
        <p v-if="createTimeSlotSuccess" class="success-message">
          {{ createTimeSlotSuccess }}
        </p>
        <div class="action-buttons">
          <UiButton @click="showCreateCourseModal = true">
            Create Course
          </UiButton>
          <UiButton variant="outline" @click="navigateTo('/assignments')">
            Manage Assignments
          </UiButton>
          <UiButton variant="outline" @click="showAddTimeSlotModal = true">
            Add Time Slot
          </UiButton>
        </div>
      </div>
    </div>

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
  margin-bottom: var(--spacing-md);
}

.action-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}

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

@media (max-width: 640px) {
  .modal-actions {
    flex-direction: column-reverse;
  }
}
</style>
