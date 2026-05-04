<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useAuth } from '@core/composables/useAuth'

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

      <div class="submission-section">
        <h2>Submission Status</h2>
        
        <div v-if="submission" class="submission-status">
          <div class="status-badge" :class="getStatusColor(submission.status)">
            {{ submission.status }}
          </div>
          <p class="submission-date">
            Submitted on: {{ formatDate(submission.submission_date) }}
          </p>
          
          <div class="submission-content">
            <h4>Your Submission:</h4>
            <div class="content-box">
              {{ submission.content }}
            </div>
          </div>

          <button 
            v-if="submission.status === 'Pending' || submission.status === 'Submitted'"
            @click="showSubmissionForm = !showSubmissionForm"
            class="btn btn-secondary"
          >
            {{ showSubmissionForm ? 'Cancel Editing' : 'Edit Submission' }}
          </button>
        </div>

        <div v-else class="no-submission">
          <p>You have not submitted this assignment yet.</p>
        </div>
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
  border: 1px dashed var(--border);
  border-radius: var(--radius);
}

.assignment-content {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
}

.assignment-info {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 1.5rem;
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
  font-weight: 600;
  color: var(--foreground);
}

.info-value {
  color: var(--muted-foreground);
}

.text-overdue {
  color: var(--destructive);
  font-weight: 600;
}

.assignment-description {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 1.5rem;
}

.assignment-description h3 {
  margin: 0 0 1rem;
  font-size: 1.1rem;
  color: var(--foreground);
}

.assignment-description p {
  margin: 0;
  color: var(--muted-foreground);
  line-height: 1.6;
}

.submission-section {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 1.5rem;
}

.submission-section h2 {
  margin: 0 0 1.5rem;
  font-size: 1.3rem;
  color: var(--foreground);
}

.submission-status {
  margin-bottom: 1.5rem;
}

.status-badge {
  display: inline-block;
  padding: 0.5rem 1rem;
  border-radius: 9999px;
  font-weight: 600;
  font-size: 0.9rem;
  margin-bottom: 1rem;
}

.status-pending {
  background: rgba(239, 193, 58, 0.1);
  color: hsl(47, 93%, 43%);
}

.status-submitted {
  background: rgba(59, 130, 246, 0.1);
  color: hsl(217, 97%, 44%);
}

.status-graded {
  background: rgba(34, 197, 94, 0.1);
  color: hsl(142, 72%, 29%);
}

.submission-date {
  margin: 0 0 1rem;
  color: var(--muted-foreground);
  font-size: 0.9rem;
}

.submission-content {
  margin: 1.5rem 0;
}

.submission-content h4 {
  margin: 0 0 0.75rem;
  font-size: 0.95rem;
  color: var(--foreground);
}

.content-box {
  background: var(--background);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 1rem;
  color: var(--muted-foreground);
  font-family: var(--font-mono);
  font-size: 0.875rem;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 300px;
  overflow-y: auto;
}

.no-submission {
  padding: 2rem;
  text-align: center;
  background: var(--background);
  border: 1px dashed var(--border);
  border-radius: var(--radius);
  color: var(--muted-foreground);
}

.submission-form-section {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 1.5rem;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: var(--radius);
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 1rem;
}

.btn-secondary {
  background: var(--secondary);
  color: var(--secondary-foreground);
}

.btn-secondary:hover {
  opacity: 0.8;
}

@media (max-width: 768px) {
  .page-title {
    font-size: 1.5rem;
  }

  .info-row {
    flex-direction: column;
    gap: 0.5rem;
  }
}
</style>
