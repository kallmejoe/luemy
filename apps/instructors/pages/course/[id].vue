<script setup lang="ts">
import { ref, onMounted, computed } from "vue"
import UiIcon from "@core/components/ui/Icon.vue"
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

interface StudentSubmission {
  assignment_id: number
  assignment_title: string
  max_score: number
  status: string | null
  submission_date: string | null
  grade: number | null
  feedback: string | null
}

interface Student {
  id: number
  name: string
  email: string
  student_id: string
  enrollment_date: string | null
  submissions: StudentSubmission[]
  stats: { total_assignments: number; submitted: number; graded: number }
}

type Tab = "info" | "assignments" | "students"

const router = useRouter()
const route = useRoute()
const token = useCookie("token")

const course = ref<Course | null>(null)
const assignments = ref<Assignment[]>([])
const students = ref<Student[]>([])
const loading = ref(true)
const error = ref("")
const activeTab = ref<Tab>("info")
const studentsLoading = ref(false)

const courseId = computed(() => route.params.id as string)

const fetchCourse = async () => {
  try {
    const res = await $fetch(`/api/courses/${courseId.value}`, {
      headers: { Authorization: `Bearer ${token.value}` },
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
      headers: { Authorization: `Bearer ${token.value}` },
    })
    if (res.success) {
      assignments.value = res.assignments.filter(
        (a: Assignment) => a.course_id === parseInt(courseId.value)
      )
    }
  } catch (err) {
    console.error(err)
  }
}

const fetchStudents = async () => {
  studentsLoading.value = true
  try {
    const res = await $fetch(`/api/courses/${courseId.value}/students`, {
      headers: { Authorization: `Bearer ${token.value}` },
    })
    if (res.success) {
      students.value = res.students
    }
  } catch (err) {
    console.error(err)
  } finally {
    studentsLoading.value = false
  }
}

const handleTabChange = (tab: Tab) => {
  activeTab.value = tab
  if (tab === "students" && students.value.length === 0) {
    fetchStudents()
  }
}

onMounted(async () => {
  await Promise.all([fetchCourse(), fetchAssignments()])
  loading.value = false
})

const handleBack = () => router.back()
const handleEditCourse = () => router.push(`/edit-course/${courseId.value}`)
const handleViewAssignment = (id: number) => router.push(`/assignment/${id}`)

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })

const isOverdue = (dueDate: string) => new Date(dueDate) < new Date()

const tabs: { key: Tab; label: string; icon: string }[] = [
  { key: "info", label: "Course Info", icon: "info" },
  { key: "assignments", label: "Assignments", icon: "assignment" },
  { key: "students", label: "Students", icon: "users" },
]

const submissionStatusClass = (status: string | null) => {
  const normalizedStatus = (status || "").toLowerCase()
  if (normalizedStatus === "graded") return "status-graded"
  if (normalizedStatus === "submitted") return "status-submitted"
  return "status-none"
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
      <div class="header-actions">
        <UiButton @click="() => router.push('/assignments')" variant="outline" size="sm">
          + Assignment
        </UiButton>
        <UiButton v-if="course" @click="handleEditCourse" variant="outline" size="sm">
          Edit
        </UiButton>
      </div>
    </div>

    <div v-if="error && !loading" class="error-banner">{{ error }}</div>
    <div v-if="loading" class="loading-state"><p>Loading course details...</p></div>

    <div v-else-if="course" class="course-content">
      <!-- Tabs -->
      <div class="tabs">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          class="tab-btn"
          :class="{ active: activeTab === tab.key }"
          @click="handleTabChange(tab.key)"
        >
          <UiIcon :name="tab.icon" />
          <span>{{ tab.label }}</span>
        </button>
      </div>

      <!-- Tab: Course Info -->
      <div v-if="activeTab === 'info'" class="tab-content">
        <div class="info-card">
          <div class="info-group">
            <label>Description</label>
            <p class="info-value">{{ course.description || "No description provided" }}</p>
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
            <div class="info-group">
              <label>Assignments</label>
              <p class="info-value">{{ assignments.length }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Tab: Assignments -->
      <div v-if="activeTab === 'assignments'" class="tab-content">
        <div v-if="assignments.length === 0" class="empty-state">
          <p>No assignments for this course yet</p>
          <UiButton @click="() => router.push('/assignments')">
            Create Assignment
          </UiButton>
        </div>

        <div v-else class="assignments-list">
          <div
            v-for="assignment in assignments"
            :key="assignment.id"
            class="assignment-card"
            :class="{ overdue: isOverdue(assignment.due_date) }"
            @click="handleViewAssignment(assignment.id)"
          >
            <div class="assignment-top">
              <h3>{{ assignment.title }}</h3>
              <span v-if="isOverdue(assignment.due_date)" class="overdue-tag">Overdue</span>
            </div>
            <p class="assignment-desc">{{ assignment.description }}</p>
            <div class="assignment-meta">
              <span class="meta-item">
                <span class="meta-label">Due:</span>
                <span class="meta-value">{{ formatDate(assignment.due_date) }}</span>
              </span>
              <span class="meta-item">
                <span class="meta-label">Max:</span>
                <span class="meta-value">{{ assignment.max_score }} pts</span>
              </span>
              <span class="meta-action">View Details →</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Tab: Students -->
      <div v-if="activeTab === 'students'" class="tab-content">
        <div v-if="studentsLoading" class="loading-state"><p>Loading students...</p></div>

        <div v-else-if="students.length === 0" class="empty-state">
          <p>No students enrolled in this course</p>
        </div>

        <div v-else class="students-list">
          <div
            v-for="student in students"
            :key="student.id"
            class="student-card"
          >
            <div class="student-header">
              <div class="student-avatar">{{ student.name.charAt(0).toUpperCase() }}</div>
              <div class="student-main">
                <h3>{{ student.name }}</h3>
                <p>{{ student.email }}</p>
              </div>
              <div class="student-stats">
                <span class="stat" title="Submitted">
                  <span class="stat-num">{{ student.stats.submitted }}</span>
                  <span class="stat-label">/{{ student.stats.total_assignments }}</span>
                </span>
              </div>
            </div>

            <div class="student-submissions">
              <div
                v-for="sub in student.submissions"
                :key="sub.assignment_id"
                class="submission-row"
              >
                <span class="sub-assignment">{{ sub.assignment_title }}</span>
                <span :class="['sub-status', submissionStatusClass(sub.status)]">
                  <UiIcon :name="(sub.status || '').toLowerCase() === 'graded' ? 'check' : ((sub.status || '').toLowerCase() === 'submitted' ? 'upload' : 'dash')" :size="16" />
                </span>
                <span v-if="sub.grade !== null" class="sub-grade">
                  {{ sub.grade }}/{{ sub.max_score }}
                </span>
                <span v-else class="sub-grade sub-grade-none">—</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

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
  position: sticky;
  top: 0;
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

.header-actions {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
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
  gap: 1.5rem;
}

/* Tabs */
.tabs {
  display: flex;
  gap: 0.25rem;
  background: var(--muted);
  border-radius: 8px;
  padding: 0.25rem;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--muted-foreground);
  font-size: 0.95rem;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tab-btn:hover {
  color: var(--foreground);
}

.tab-btn.active {
  background: var(--card);
  color: var(--foreground);
  box-shadow: 0 1px 3px color-mix(in oklab, var(--foreground), transparent 90%);
}

.tab-icon {
  font-size: 1.1rem;
}

.tab-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* Course Info Tab */
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
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
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

/* Empty State */
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

/* Assignments Tab */
.assignments-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.assignment-card {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1.25rem;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.assignment-card:hover {
  border-color: var(--primary);
  box-shadow: 0 2px 8px color-mix(in oklab, var(--foreground), transparent 92%);
}

.assignment-card.overdue {
  border-left: 4px solid var(--destructive);
}

.assignment-top {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.assignment-top h3 {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--color-text);
}

.overdue-tag {
  display: inline-block;
  padding: 0.2rem 0.5rem;
  background: color-mix(in oklab, var(--destructive), transparent 85%);
  color: var(--destructive);
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
}

.assignment-desc {
  margin: 0;
  font-size: 0.9rem;
  color: var(--muted-foreground);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.assignment-meta {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--border);
  margin-top: 0.25rem;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.meta-label {
  font-size: 0.8rem;
  color: var(--muted-foreground);
}

.meta-value {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-text);
}

.meta-action {
  margin-left: auto;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--primary);
}

/* Students Tab */
.students-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.student-card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
}

.student-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
}

.student-avatar {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--primary);
  color: var(--primary-foreground);
  border-radius: 50%;
  font-weight: 700;
  font-size: 1rem;
  flex-shrink: 0;
}

.student-main {
  flex: 1;
  min-width: 0;
}

.student-main h3 {
  margin: 0 0 0.15rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text);
}

.student-main p {
  margin: 0;
  font-size: 0.85rem;
  color: var(--muted-foreground);
}

.student-stats .stat {
  display: flex;
  align-items: baseline;
  gap: 0.15rem;
}

.stat-num {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--primary);
}

.stat-label {
  font-size: 0.9rem;
  color: var(--muted-foreground);
}

.student-submissions {
  border-top: 1px solid var(--border);
  background: color-mix(in oklab, var(--muted), transparent 50%);
}

.submission-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 1.25rem;
  font-size: 0.85rem;
}

.submission-row + .submission-row {
  border-top: 1px solid var(--border);
}

.sub-assignment {
  flex: 1;
  min-width: 0;
  color: var(--color-text);
  font-weight: 500;
}

.sub-status {
  font-size: 0.9rem;
  width: 20px;
  text-align: center;
}

.status-graded {
  color: var(--success);
}

.status-submitted {
  color: var(--info);
}

.status-none {
  color: var(--muted-foreground);
}

.sub-grade {
  font-weight: 600;
  min-width: 50px;
  text-align: right;
  color: var(--primary);
}

.sub-grade-none {
  color: var(--muted-foreground);
  font-weight: 400;
}

/* Responsive */
@media (max-width: 768px) {
  .detail-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .course-title {
    font-size: 1.5rem;
  }

  .header-actions {
    width: 100%;
    justify-content: flex-end;
  }

  .tabs {
    flex-direction: column;
  }

  .info-row {
    grid-template-columns: 1fr;
  }
}
</style>