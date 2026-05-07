<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useAuth } from '@core/composables/useAuth'
import UiButton from '@core/components/ui/Button.vue'

definePageMeta({
  middleware: ['auth']
})

const { token } = useAuth()
const route = useRoute()
const assignmentId = computed(() => parseInt(route.params.id as string))
const assignment = ref<any>(null)
const submission = ref<any>(null)
const loading = ref(true)
const error = ref('')
const showSubmissionForm = ref(false)

const fetchAssignmentDetails = async () => {
  try {
    loading.value = true
    error.value = ''

    const res = await $fetch(`/api/assignments/${assignmentId.value}`, {
      headers: {
        Authorization: `Bearer ${token.value}`
      }
    })

    if (res.success) {
      assignment.value = res.assignment
      submission.value = res.submission || null
    } else {
      error.value = res.message || 'Failed to load assignment'
    }
  } catch (err) {
    console.error('Error fetching assignment:', err)
    error.value = err instanceof Error ? err.message : 'Failed to load assignment details'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchAssignmentDetails()
})

const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleString()
}

const isOverdue = (dateString: string) => {
  if (!dateString) return false
  return new Date(dateString) < new Date()
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Submitted':
      return 'status-submitted'
    case 'Graded':
      return 'status-graded'
    default:
      return 'status-pending'
  }
}

const handleSubmissionComplete = async (event: any) => {
  if (event.success) {
    showSubmissionForm.value = false
    // Refresh submission
    await fetchAssignmentDetails()
  }
}
</script>

<template>
  <div class="assignment-detail">
    <div class="page-header">
      <NuxtLink to="/assignments" class="back-link">&larr; Back to Assignments</NuxtLink>
      <h1 v-if="assignment" class="page-title">{{ assignment.title }}</h1>
    </div>

    <div v-if="loading" class="loading-state">
      Loading assignment details...
    </div>

    <div v-else-if="error" class="error-state">
      {{ error }}
    </div>

    <div v-else-if="!assignment" class="error-state">
      Assignment not found
    </div>

    <div v-else class="assignment-content">
      <div class="assignment-info">
        <div class="info-row">
          <span class="info-label">Course:</span>
          <span class="info-value">{{ assignment.course_name }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Due Date:</span>
          <span class="info-value" :class="{ 'text-overdue': isOverdue(assignment.due_date) }">
            {{ formatDate(assignment.due_date) }}
          </span>
        </div>
        <div class="info-row">
          <span class="info-label">Max Score:</span>
          <span class="info-value">{{ assignment.max_score }} points</span>
        </div>
      </div>

      <div v-if="assignment.description" class="assignment-description">
        <h3>Description</h3>
        <p>{{ assignment.description }}</p>
      </div>

      <div v-if="submission" class="submission-section">
        <div class="submission-top">
          <h2>Your Submission</h2>
          <span 
            :class="['status-badge', getStatusColor(submission.status)]"
          >
            {{ submission.status }}
          </span>
        </div>
        <p class="submission-date">{{ formatDate(submission.submission_date) }}</p>

        <div v-if="submission.grade !== null && submission.grade !== undefined" class="grade-box">
          <div class="grade-row">
            <span class="grade-label">Your Grade</span>
            <span class="grade-value">{{ submission.grade }} / {{ assignment.max_score }}</span>
          </div>
          <p v-if="submission.feedback" class="feedback-text">{{ submission.feedback }}</p>
        </div>
        
        <div class="content-box">
          {{ submission.content }}
        </div>

        <UiButton
          v-if="submission.status === 'Pending' || submission.status === 'Submitted'"
          variant="outline"
          @click="showSubmissionForm = !showSubmissionForm"
        >
          {{ showSubmissionForm ? 'Cancel' : 'Edit' }}
        </UiButton>
      </div>

      <div v-if="!submission || showSubmissionForm" class="submission-form-section">
        <AssignmentSubmission 
          :assignment-id="assignmentId"
          @submitted="handleSubmissionComplete"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.assignment-detail {
  padding-bottom: 2rem;
}

.page-header {
  margin-bottom: 2rem;
}

.back-link {
  display: inline-block;
  margin-bottom: 1rem;
  color: var(--primary);
  text-decoration: none;
  font-weight: 500;
  transition: opacity 0.2s;
  font-size: 0.95rem;
}

.back-link:hover {
  opacity: 0.8;
}

.page-title {
  margin: 0;
  font-size: 2rem;
  font-weight: 700;
  color: var(--foreground);
}

.loading-state,
.error-state {
  padding: 3rem;
  text-align: center;
  color: var(--muted-foreground);
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 8px;
}

.assignment-content {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

.assignment-info {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 1.25rem;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 0.75rem 0;
  border-bottom: 1px solid var(--border);
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  font-weight: 500;
  color: var(--muted-foreground);
  font-size: 0.9rem;
}

.info-value {
  color: var(--foreground);
  font-weight: 500;
}

.text-overdue {
  color: var(--destructive);
  font-weight: 600;
}

.assignment-description {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 1.25rem;
}

.assignment-description h3 {
  margin: 0 0 0.75rem;
  font-size: 1rem;
  color: var(--foreground);
  font-weight: 600;
}

.assignment-description p {
  margin: 0;
  color: var(--muted-foreground);
  line-height: 1.6;
  font-size: 0.95rem;
}

.submission-section {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 1rem;
}

.submission-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.5rem;
}

.submission-top h2 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--foreground);
}

.submission-date {
  margin: 0 0 1rem;
  font-size: 0.8rem;
  color: var(--muted-foreground);
  font-weight: 500;
}

.grade-box {
  margin-bottom: 0.875rem;
  padding: 0.75rem;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: color-mix(in oklab, var(--success), transparent 92%);
}

.grade-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.grade-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--muted-foreground);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.grade-value {
  font-size: 1rem;
  font-weight: 700;
  color: var(--success);
}

.feedback-text {
  margin: 0.625rem 0 0;
  color: var(--foreground);
  font-size: 0.9rem;
  line-height: 1.5;
  white-space: pre-wrap;
}

.content-box {
  background: var(--background);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 0.875rem;
  margin-bottom: 0.75rem;
  color: var(--foreground);
  font-family: 'Courier New', monospace;
  font-size: 0.85rem;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
}

.content-box::-webkit-scrollbar {
  display: none;
}

.empty-submission {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem;
  text-align: center;
  background: var(--background);
  border: 1px dashed var(--border);
  border-radius: 6px;
}

.empty-content p {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--foreground);
}

.empty-content span {
  font-size: 0.75rem;
  color: var(--muted-foreground);
}

.empty-content {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-weight: 600;
  font-size: 0.7rem;
  border: none;
  cursor: default;
  white-space: nowrap;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  flex-shrink: 0;
}

.status-pending {
  background: color-mix(in oklab, var(--warning), transparent 86%);
  color: var(--warning-foreground);
}

.status-submitted {
  background: color-mix(in oklab, var(--info), transparent 86%);
  color: var(--primary);
}

.status-graded {
  background: color-mix(in oklab, var(--success), transparent 86%);
  color: var(--success);
}

.submission-form-section {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 1.25rem;
}

.btn {
  padding: 0.625rem 1.25rem;
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-secondary {
  background: var(--primary);
  color: var(--card);
}

.btn-secondary:hover {
  opacity: 0.9;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px oklch(0.25 0.025 252 / 10%);
}

.btn-secondary:active {
  transform: translateY(0);
}

@media (max-width: 768px) {
  .page-title {
    font-size: 1.5rem;
  }

  .info-row {
    flex-direction: column;
    gap: 0.5rem;
  }

  .submission-top {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }
}
</style>
