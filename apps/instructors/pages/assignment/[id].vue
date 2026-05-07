<script setup lang="ts">
import { ref, onMounted, computed } from "vue"
import { useRouter, useRoute } from "vue-router"
import UiButton from "@core/components/ui/Button.vue"
import UiIcon from "@core/components/ui/Icon.vue"

interface Assignment {
  id: number
  course_id: number
  title: string
  description: string
  max_score: number
  due_date: string
  course_name: string
}

interface Submission {
  id: number
  student_id: number
  content: string
  submission_date: string
  status: string
  student_name: string
  student_email: string
  grade: number | null
  feedback: string | null
}

interface Stats {
  total: number
  submitted: number
  graded: number
}

const router = useRouter()
const route = useRoute()
const token = useCookie("token")

const assignment = ref<Assignment | null>(null)
const submissions = ref<Submission[]>([])
const stats = ref<Stats | null>(null)
const loading = ref(true)
const error = ref("")
const selectedSubmission = ref<Submission | null>(null)
const gradingModal = ref(false)
const gradeForm = ref({ grade: 0, feedback: "" })
const submitting = ref(false)

const assignmentId = computed(() => route.params.id as string)

const fetchAssignment = async () => {
  try {
    const res = await $fetch(`/api/assignments/professor/${assignmentId.value}`, {
      headers: {
        Authorization: `Bearer ${token.value}`,
      },
    })

    if (res.success) {
      assignment.value = res.assignment
      submissions.value = res.submissions
      stats.value = res.stats
    } else {
      error.value = res.message || "Failed to load assignment"
    }
  } catch (err) {
    console.error(err)
    error.value = "Failed to load assignment details"
  }
}

onMounted(async () => {
  await fetchAssignment()
  loading.value = false
})

const handleBack = () => {
  router.back()
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

const isOverdue = (dueDate: string) => {
  return new Date(dueDate) < new Date()
}

const openGradingModal = (submission: Submission) => {
  selectedSubmission.value = submission
  gradeForm.value = {
    grade: submission.grade || 0,
    feedback: submission.feedback || "",
  }
  gradingModal.value = true
}

const closeGradingModal = () => {
  gradingModal.value = false
  selectedSubmission.value = null
  gradeForm.value = { grade: 0, feedback: "" }
}

const submitGrade = async () => {
  if (!selectedSubmission.value) return

  submitting.value = true
  try {
    const res = await $fetch("/api/assignments/grade", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token.value}`,
      },
      body: {
        assignmentId: assignment.value?.id,
        studentId: selectedSubmission.value.student_id,
        grade: gradeForm.value.grade,
        feedback: gradeForm.value.feedback,
      },
    })

    if (res.success) {
      // Update local submission data
      const index = submissions.value.findIndex(
        (s) => s.id === selectedSubmission.value?.id
      )
      if (index !== -1) {
        submissions.value[index].grade = gradeForm.value.grade
        submissions.value[index].feedback = gradeForm.value.feedback
        const prevStatus = submissions.value[index].status || ""
        submissions.value[index].status = "Graded"
        // Update stats: if previous was 'Submitted', decrement submitted; increment graded
        if (stats.value) {
          const prev = (prevStatus || "").toLowerCase()
          if (prev === "submitted") {
            stats.value.submitted = Math.max(0, (stats.value.submitted || 0) - 1)
          }
          if (prev !== "graded") {
            stats.value.graded = (stats.value.graded || 0) + 1
          }
        }
      }
      closeGradingModal()
    }
  } catch (err) {
    console.error(err)
  } finally {
    submitting.value = false
  }
}

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case "graded":
      return "status-graded"
    case "submitted":
      return "status-submitted"
    default:
      return "status-pending"
  }
}
</script>

<template>
  <div class="assignment-detail">
    <!-- Header -->
    <div class="detail-header">
      <button class="back-button" @click="handleBack">
        <span class="back-icon">←</span>
      </button>
      <div class="header-content">
        <p v-if="assignment" class="course-name">{{ assignment.course_name }}</p>
        <h1 v-if="assignment" class="assignment-title">{{ assignment.title }}</h1>
        <h1 v-else class="assignment-title">Loading...</h1>
      </div>
    </div>

    <!-- Error State -->
    <div v-if="error && !loading" class="error-banner">
      {{ error }}
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <p>Loading assignment details...</p>
    </div>

    <!-- Content -->
    <div v-else-if="assignment" class="assignment-content">
      <!-- Stats Cards -->
      <div class="stats-grid">
        <div class="stat-card">
          <span class="stat-value">{{ stats?.total || 0 }}</span>
          <span class="stat-label">Total Students</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">{{ stats?.submitted || 0 }}</span>
          <span class="stat-label">Submitted</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">{{ stats?.graded || 0 }}</span>
          <span class="stat-label">Graded</span>
        </div>
      </div>

      <!-- Assignment Info -->
      <section class="info-section">
        <div class="section-header">
          <h2>Assignment Details</h2>
        </div>
        <div class="info-card">
          <div class="info-group">
            <label>Description</label>
            <p class="info-value">
              {{ assignment.description || "No description provided" }}
            </p>
          </div>
          <div class="info-row">
            <div class="info-group">
              <label>Max Score</label>
              <p class="info-value score-value">{{ assignment.max_score }} pts</p>
            </div>
            <div class="info-group">
              <label>Due Date</label>
              <p class="info-value" :class="{ 'overdue-date': isOverdue(assignment.due_date) }">
                {{ formatDate(assignment.due_date) }}
                <span v-if="isOverdue(assignment.due_date)" class="overdue-badge">Overdue</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- Submissions Section -->
      <section class="submissions-section">
        <div class="section-header">
          <h2>Submissions</h2>
          <span v-if="submissions.length > 0" class="count-badge">
            {{ submissions.length }}
          </span>
        </div>

        <div v-if="submissions.length === 0" class="empty-state">
          <p>No submissions yet</p>
        </div>

        <div v-else class="submissions-list">
          <div
            v-for="submission in submissions"
            :key="submission.id"
            class="submission-item"
          >
            <div class="submission-left">
              <div class="student-info">
                <h3>{{ submission.student_name }}</h3>
                <p>{{ submission.student_email }}</p>
              </div>
              <p class="submission-content">{{ submission.content }}</p>
              <div class="submission-meta">
                <span :class="['status-badge', getStatusColor(submission.status)]">
                  <UiIcon :name="(submission.status || '').toLowerCase() === 'graded' ? 'check' : ((submission.status || '').toLowerCase() === 'submitted' ? 'upload' : 'dash')" :size="14" />
                  <span style="margin-left:0.5rem">{{ submission.status }}</span>
                </span>
                <span class="submission-date">
                  Submitted {{ formatDate(submission.submission_date) }}
                </span>
              </div>
            </div>

            <div class="submission-right">
              <div v-if="submission.grade !== null" class="grade-display">
                <span class="grade-label">Grade</span>
                <span class="grade-value">{{ submission.grade }}/{{ assignment.max_score }}</span>
              </div>
              <UiButton
                @click="openGradingModal(submission)"
                size="sm"
                :variant="submission.grade !== null ? 'outline' : 'default'"
              >
                {{ submission.grade !== null ? "Update Grade" : "Grade" }}
              </UiButton>
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- Not Found State -->
    <div v-else class="not-found">
      <p>Assignment not found</p>
      <UiButton @click="handleBack">Go Back</UiButton>
    </div>

    <!-- Grading Modal -->
    <div v-if="gradingModal" class="modal-overlay" @click.self="closeGradingModal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Grade Submission</h2>
          <button class="close-btn" @click="closeGradingModal">×</button>
        </div>
        <div class="modal-body">
          <p class="student-label">
            Student: <strong>{{ selectedSubmission?.student_name }}</strong>
          </p>

          <div class="form-group">
            <label>Grade (out of {{ assignment?.max_score }})</label>
            <input
              v-model.number="gradeForm.grade"
              type="number"
              min="0"
              :max="assignment?.max_score"
              class="grade-input"
            />
          </div>

          <div class="form-group">
            <label>Feedback (optional)</label>
            <textarea
              v-model="gradeForm.feedback"
              class="feedback-input"
              rows="4"
              placeholder="Provide feedback to the student..."
            ></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <UiButton @click="closeGradingModal" variant="outline">Cancel</UiButton>
          <UiButton @click="submitGrade" :disabled="submitting">
            {{ submitting ? "Submitting..." : "Submit Grade" }}
          </UiButton>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.assignment-detail {
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

.course-name {
  margin: 0 0 0.25rem 0;
  font-size: 0.9rem;
  color: var(--muted-foreground);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.assignment-title {
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

.assignment-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.stat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 1.25rem;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 8px;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--primary);
}

.stat-label {
  font-size: 0.85rem;
  color: var(--muted-foreground);
}

.info-section,
.submissions-section {
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
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.score-value {
  font-weight: 600;
  color: var(--primary);
}

.overdue-date {
  color: var(--destructive);
}

.overdue-badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  background: color-mix(in oklab, var(--destructive), transparent 85%);
  color: var(--destructive);
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: var(--card);
  border: 1px dashed var(--border);
  border-radius: 8px;
  text-align: center;
  color: var(--muted-foreground);
}

.submissions-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.submission-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  padding: 1.25rem;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 8px;
}

.submission-left {
  flex: 1;
  min-width: 0;
}

.student-info h3 {
  margin: 0 0 0.25rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text);
}

.student-info p {
  margin: 0;
  font-size: 0.85rem;
  color: var(--muted-foreground);
}

.submission-content {
  margin: 0.5rem 0 0;
  color: var(--foreground);
  line-height: 1.5;
  white-space: pre-wrap;
}

.submission-meta {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-top: 0.75rem;
}

.status-badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.status-submitted {
  background: color-mix(in oklab, var(--info), transparent 85%);
  color: var(--info);
}

.status-graded {
  background: color-mix(in oklab, var(--success), transparent 85%);
  color: var(--success);
}

.status-pending {
  background: var(--muted);
  color: var(--muted-foreground);
}

.submission-date {
  font-size: 0.85rem;
  color: var(--muted-foreground);
}

.submission-right {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  flex-shrink: 0;
}

.grade-display {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.25rem;
}

.grade-label {
  font-size: 0.8rem;
  color: var(--muted-foreground);
  text-transform: uppercase;
}

.grade-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--primary);
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--overlay);
  z-index: 100;
}

.modal-content {
  width: 100%;
  max-width: 500px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 12px;
  box-shadow: var(--shadow-lg);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--border);
}

.modal-header h2 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text);
}

.close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: var(--muted-foreground);
  font-size: 1.5rem;
  cursor: pointer;
  border-radius: 4px;
}

.close-btn:hover {
  background: var(--accent);
  color: var(--foreground);
}

.modal-body {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.student-label {
  margin: 0;
  font-size: 0.95rem;
  color: var(--muted-foreground);
}

.student-label strong {
  color: var(--foreground);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--foreground);
}

.grade-input,
.feedback-input {
  padding: 0.75rem;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--input);
  color: var(--foreground);
  font-size: 1rem;
  font-family: inherit;
}

.grade-input:focus,
.feedback-input:focus {
  outline: none;
  border-color: var(--ring);
}

.feedback-input {
  resize: vertical;
  min-height: 100px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1.25rem 1.5rem;
  border-top: 1px solid var(--border);
}

/* Responsive */
@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .submission-item {
    flex-direction: column;
    align-items: flex-start;
  }

  .submission-right {
    width: 100%;
    justify-content: space-between;
  }

  .assignment-title {
    font-size: 1.5rem;
  }
}
</style>