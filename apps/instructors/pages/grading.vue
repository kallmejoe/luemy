<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import UiButton from '@core/components/ui/Button.vue'
import { useAuth } from '@core/composables/useAuth'

definePageMeta({
  middleware: ['auth']
})

defineOptions({
  name: 'InstructorGradingPage'
})

const { token } = useAuth()

type Submission = {
  id: number
  student_id: number
  assignment_id: number
  student_name: string
  assignment_title: string
  course_name: string
  content: string
  submission_date: string
  status: string
  max_score: number
  grade: number | null
  feedback: string | null
}

const submissions = ref<Submission[]>([])
const loading = ref(true)
const error = ref('')
const success = ref('')

const gradeForms = ref<Record<number, { grade: string; feedback: string; saving: boolean }>>({})

const fetchSubmissions = async () => {
  try {
    loading.value = true
    error.value = ''
    const res = await $fetch('/api/assignments/submissions', {
      headers: {
        Authorization: `Bearer ${token.value}`
      }
    })

    if (!res.success) {
      error.value = res.message || 'Failed to load submissions'
      return
    }

    submissions.value = res.submissions
    const nextForms: Record<number, { grade: string; feedback: string; saving: boolean }> = {}
    for (const submission of res.submissions) {
      nextForms[submission.id] = {
        grade: submission.grade !== null && submission.grade !== undefined ? String(submission.grade) : '',
        feedback: submission.feedback || '',
        saving: false
      }
    }
    gradeForms.value = nextForms
  } catch (err) {
    console.error('Error fetching submissions:', err)
    error.value = 'Failed to load submissions'
  } finally {
    loading.value = false
  }
}

onMounted(fetchSubmissions)

const pendingSubmissions = computed(() => submissions.value.filter(s => s.status !== 'Graded'))
const gradedSubmissions = computed(() => submissions.value.filter(s => s.status === 'Graded'))

const formatDate = (dateString: string) => new Date(dateString).toLocaleString()

const saveGrade = async (submission: Submission) => {
  success.value = ''
  error.value = ''

  const form = gradeForms.value[submission.id]
  if (!form) return

  const numericGrade = Number(form.grade)
  if (Number.isNaN(numericGrade)) {
    error.value = 'Please enter a valid numeric grade.'
    return
  }

  if (numericGrade > submission.max_score) {
    error.value = `Grade for "${submission.assignment_title}" cannot exceed ${submission.max_score}.`
    return
  }

  if (numericGrade < 0) {
    error.value = 'Grade cannot be negative.'
    return
  }

  form.saving = true
  try {
    const res = await $fetch('/api/assignments/grade', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token.value}`
      },
      body: {
        assignmentId: submission.assignment_id,
        studentId: submission.student_id,
        grade: numericGrade,
        feedback: form.feedback
      }
    })

    if (!res.success) {
      error.value = res.message || 'Failed to save grade'
      return
    }

    success.value = `Saved grade for ${submission.student_name}.`
    await fetchSubmissions()
  } catch (err) {
    console.error('Error saving grade:', err)
    error.value = 'Failed to save grade'
  } finally {
    form.saving = false
  }
}
</script>

<template>
  <div class="grading-page">
    <div class="page-header">
      <h1 class="page-title">Grade Submissions</h1>
      <p class="page-subtitle">Assign numeric grades and optional feedback for submitted assignments.</p>
    </div>

    <div v-if="error" class="message error-message">{{ error }}</div>
    <div v-if="success" class="message success-message">{{ success }}</div>

    <div v-if="loading" class="state-card">Loading submissions...</div>

    <div v-else-if="submissions.length === 0" class="state-card">
      No submissions yet.
    </div>

    <div v-else class="sections">
      <section class="section-card">
        <h2>Needs Grading ({{ pendingSubmissions.length }})</h2>
        <div v-if="pendingSubmissions.length === 0" class="empty-note">All submissions are graded.</div>
        <div v-else class="submission-list">
          <article v-for="submission in pendingSubmissions" :key="submission.id" class="submission-item">
            <div class="submission-meta">
              <h3>{{ submission.assignment_title }}</h3>
              <p>{{ submission.student_name }} • {{ submission.course_name }}</p>
              <p class="submission-date">Submitted: {{ formatDate(submission.submission_date) }}</p>
            </div>

            <div class="content-box">{{ submission.content }}</div>

            <form class="grade-form" @submit.prevent="saveGrade(submission)">
              <div class="form-field score-field">
                <label :for="`grade-${submission.id}`">Grade (max {{ submission.max_score }})</label>
                <input
                  :id="`grade-${submission.id}`"
                  v-model="gradeForms[submission.id].grade"
                  type="number"
                  min="0"
                  step="0.1"
                  :max="submission.max_score"
                  required
                >
              </div>

              <div class="form-field">
                <label :for="`feedback-${submission.id}`">Feedback (optional)</label>
                <textarea
                  :id="`feedback-${submission.id}`"
                  v-model="gradeForms[submission.id].feedback"
                  rows="3"
                  placeholder="Share strengths and improvement points"
                />
              </div>

              <UiButton type="submit" :disabled="gradeForms[submission.id].saving">
                {{ gradeForms[submission.id].saving ? 'Saving...' : 'Save Grade' }}
              </UiButton>
            </form>
          </article>
        </div>
      </section>

      <section class="section-card">
        <h2>Graded ({{ gradedSubmissions.length }})</h2>
        <div v-if="gradedSubmissions.length === 0" class="empty-note">No graded submissions yet.</div>
        <div v-else class="submission-list compact">
          <article v-for="submission in gradedSubmissions" :key="submission.id" class="submission-item compact-item">
            <div class="graded-meta">
              <h3>{{ submission.assignment_title }}</h3>
              <p>{{ submission.student_name }} • {{ submission.course_name }}</p>
              <p v-if="submission.feedback" class="feedback-text">Feedback: {{ submission.feedback }}</p>
              <p v-else class="feedback-text muted">Feedback: No feedback provided.</p>
            </div>
            <p class="grade-pill">{{ submission.grade }} / {{ submission.max_score }}</p>
          </article>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.grading-page {
  padding-bottom: 2rem;
}

.page-header {
  margin-bottom: 1.25rem;
}

.page-title {
  margin: 0;
  font-size: 1.6rem;
  color: var(--foreground);
}

.page-subtitle {
  margin-top: 0.4rem;
  color: var(--muted-foreground);
}

.message {
  margin-bottom: 0.8rem;
  padding: 0.75rem 1rem;
  border-radius: 10px;
}

.error-message {
  background: color-mix(in srgb, var(--destructive) 18%, white);
  color: var(--destructive);
  border: 1px solid color-mix(in srgb, var(--destructive) 35%, white);
}

.success-message {
  background: color-mix(in srgb, var(--chart-2) 18%, white);
  color: var(--chart-2);
  border: 1px solid color-mix(in srgb, var(--chart-2) 35%, white);
}

.state-card,
.section-card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 1rem;
}

.sections {
  display: grid;
  gap: 1rem;
}

.section-card h2 {
  margin: 0 0 0.8rem;
  color: var(--foreground);
}

.submission-list {
  display: grid;
  gap: 0.9rem;
}

.submission-item {
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 0.9rem;
  background: var(--background);
}

.submission-meta h3 {
  margin: 0;
}

.submission-meta p,
.submission-date {
  margin: 0.2rem 0 0;
  color: var(--muted-foreground);
}

.content-box {
  margin: 0.8rem 0;
  padding: 0.7rem;
  border-radius: 8px;
  border: 1px dashed var(--border);
  white-space: pre-wrap;
}

.grade-form {
  display: grid;
  gap: 0.75rem;
}

.form-field {
  display: grid;
  gap: 0.35rem;
}

.form-field label {
  font-size: 0.875rem;
  color: var(--muted-foreground);
}

.form-field input,
.form-field textarea {
  width: 100%;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--background);
  color: var(--foreground);
  padding: 0.55rem 0.65rem;
}

.compact-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.75rem;
}

.graded-meta {
  display: grid;
  gap: 0.3rem;
}

.feedback-text {
  margin: 0;
  font-size: 0.875rem;
  color: var(--foreground);
  white-space: pre-wrap;
}

.feedback-text.muted {
  color: var(--muted-foreground);
}

.grade-pill {
  margin: 0;
  font-weight: 700;
}

.empty-note {
  color: var(--muted-foreground);
}

@media (min-width: 900px) {
  .sections {
    grid-template-columns: 1.4fr 1fr;
    align-items: start;
  }
}
</style>
