<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useAuth } from '@core/composables/useAuth'

definePageMeta({
  middleware: ['auth']
})

const { token } = useAuth()
const route = useRoute()
const courseId = computed(() => parseInt(route.params.id as string))
const course = ref<any>(null)
const assignments = ref<any[]>([])
const loading = ref(true)
const error = ref('')

const fetchCourseDetails = async () => {
  try {
    loading.value = true
    error.value = ''
    
    const res = await $fetch(`/api/courses/student/${courseId.value}`, {
      headers: {
        Authorization: `Bearer ${token.value}`
      }
    })

    if (res.success) {
      course.value = res.course
      assignments.value = res.assignments || []
    } else {
      error.value = res.message || 'Failed to load course'
    }
  } catch (err) {
    console.error('Error fetching course:', err)
    error.value = err instanceof Error ? err.message : 'Failed to load course details'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchCourseDetails()
})

const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString()
}

const getAssignmentStats = () => {
  const total = assignments.value.length
  const submitted = assignments.value.filter(a => a.submission?.status === 'Submitted').length
  const graded = assignments.value.filter(a => a.submission?.status === 'Graded').length
  const pending = total - submitted - graded

  return { total, submitted, graded, pending }
}
</script>

<template>
  <div class="course-detail">
    <div class="page-header">
      <NuxtLink to="/active-courses" class="back-link">&larr; Back to My Courses</NuxtLink>
      <h1 v-if="course" class="page-title">{{ course.name }}</h1>
    </div>

    <div v-if="loading" class="loading-state">
      Loading course details...
    </div>

    <div v-else-if="error" class="error-state">
      {{ error }}
    </div>

    <div v-else-if="!course" class="not-found-state">
      Course not found
    </div>

    <div v-else class="course-content">
      <!-- Course Info Card -->
      <div class="info-card">
        <div class="info-section">
          <h3 class="section-title">Course Information</h3>
          
          <div class="info-row">
            <span class="info-label">Instructor:</span>
            <span class="info-value">{{ course.professor_name }}</span>
          </div>

          <div class="info-row">
            <span class="info-label">Email:</span>
            <span class="info-value">
              <a :href="`mailto:${course.professor_email}`" class="email-link">
                {{ course.professor_email }}
              </a>
            </span>
          </div>

          <div class="info-row">
            <span class="info-label">Created:</span>
            <span class="info-value">{{ formatDate(course.created_at) }}</span>
          </div>
        </div>

        <div v-if="course.description" class="info-section">
          <h3 class="section-title">Description</h3>
          <p class="description-text">{{ course.description }}</p>
        </div>
      </div>

      <!-- Assignment Stats -->
      <div v-if="assignments.length > 0" class="stats-card">
        <div class="stat-item">
          <span class="stat-label">Total Assignments</span>
          <span class="stat-value total">{{ getAssignmentStats().total }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Submitted</span>
          <span class="stat-value submitted">{{ getAssignmentStats().submitted }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Graded</span>
          <span class="stat-value graded">{{ getAssignmentStats().graded }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Pending</span>
          <span class="stat-value pending">{{ getAssignmentStats().pending }}</span>
        </div>
      </div>

      <!-- Assignments Section -->
      <div class="assignments-section">
        <h2 class="section-heading">Assignments</h2>
        <CompactAssignmentList :assignments="assignments" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.course-detail {
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
.error-state,
.not-found-state {
  padding: 3rem;
  text-align: center;
  border: 1px dashed var(--border);
  border-radius: var(--radius);
  color: var(--muted-foreground);
  background: var(--card);
}

.course-content {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
}

.info-card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: var(--spacing-lg);
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--spacing-xl);
}

.info-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.section-title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--foreground);
  padding-bottom: var(--spacing-md);
  border-bottom: 1px solid var(--border);
}

.info-row {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.info-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--muted-foreground);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-value {
  font-size: 0.95rem;
  color: var(--foreground);
  word-break: break-word;
}

.email-link {
  color: var(--primary);
  text-decoration: none;
  transition: opacity 0.2s;
}

.email-link:hover {
  opacity: 0.8;
  text-decoration: underline;
}

.description-text {
  margin: 0;
  color: var(--muted-foreground);
  line-height: 1.6;
  font-size: 0.95rem;
}

.stats-card {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: var(--spacing-md);
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: var(--spacing-lg);
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  background: var(--background);
  border-radius: var(--radius);
  text-align: center;
}

.stat-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--muted-foreground);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--foreground);
}

.stat-value.total {
  color: var(--foreground);
}

.stat-value.submitted {
  color: var(--info);
}

.stat-value.graded {
  color: var(--success);
}

.stat-value.pending {
  color: var(--warning);
}

.assignments-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.section-heading {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--foreground);
  padding-bottom: var(--spacing-md);
  border-bottom: 2px solid var(--border);
}

@media (max-width: 768px) {
  .page-title {
    font-size: 1.5rem;
  }

  .info-card {
    grid-template-columns: 1fr;
  }

  .stat-value {
    font-size: 1.5rem;
  }
}
</style>
