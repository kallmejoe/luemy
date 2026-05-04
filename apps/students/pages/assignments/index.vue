<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuth } from '@core/composables/useAuth'

definePageMeta({
  middleware: ['auth']
})

const { token } = useAuth()

const assignments = ref<any[]>([])
const loading = ref(true)

const fetchAssignments = async () => {
  try {
    const res = await $fetch('/api/assignments/student-assignments', {
      headers: {
        Authorization: `Bearer ${token.value}`
      }
    })
    if (res.success) {
      assignments.value = res.assignments
    }
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchAssignments()
})

const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleString();
}

const isOverdue = (dateString: string) => {
  if (!dateString) return false;
  return new Date(dateString) < new Date();
}
</script>

<template>
  <div class="assignments-page">
    <div v-if="loading" class="loading-state">
      Loading assignments...
    </div>
    
    <div v-else-if="assignments.length === 0" class="empty-state">
      You have no assignments due at this time.
    </div>

    <div v-else class="assignment-grid">
      <NuxtLink
        v-for="assignment in assignments"
        :key="assignment.id"
        :to="`/assignments/${assignment.id}`"
        class="assignment-card"
        :class="{ 'is-overdue': isOverdue(assignment.due_date) }"
      >
        <div class="assignment-header">
          <span class="course-badge">{{ assignment.course_name }}</span>
          <span class="due-date" :class="{ 'text-destructive': isOverdue(assignment.due_date) }">
            {{ isOverdue(assignment.due_date) ? 'Overdue: ' : 'Due: ' }}{{ formatDate(assignment.due_date) }}
          </span>
        </div>
        
        <h3 class="assignment-title">{{ assignment.title }}</h3>
        
        <p v-if="assignment.description" class="assignment-desc">
          {{ assignment.description }}
        </p>
        
        <div class="assignment-footer">
          <span class="max-score">Max Score: {{ assignment.max_score }}</span>
          <span class="view-link">View Details →</span>
        </div>
      </NuxtLink>
    </div>
  </div>
</template>

<style scoped>
.assignments-page {
  padding-bottom: 2rem;
}

.loading-state,
.empty-state {
  padding: 3rem;
  text-align: center;
  color: var(--muted-foreground);
  background: var(--card);
  border: 1px dashed var(--border);
  border-radius: var(--radius);
}

.assignment-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.25rem;
}

.assignment-card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  transition: box-shadow 0.2s, border-color 0.2s;
  text-decoration: none;
  color: inherit;
}

.assignment-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  border-color: var(--primary);
}

.assignment-card.is-overdue {
  border-color: rgba(239, 68, 68, 0.3);
  background: rgba(239, 68, 68, 0.02);
}

.assignment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.course-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
  background: var(--primary);
  color: var(--primary-foreground);
  font-size: 0.75rem;
  font-weight: 600;
}

.due-date {
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--muted-foreground);
}

.text-destructive {
  color: var(--destructive);
  font-weight: 600;
}

.assignment-title {
  margin: 0 0 0.5rem;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--foreground);
}

.assignment-desc {
  margin: 0 0 1.25rem;
  color: var(--muted-foreground);
  font-size: 0.875rem;
  line-height: 1.5;
  flex: 1;
}

.assignment-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 1rem;
  border-top: 1px solid var(--border);
}

.max-score {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--foreground);
}

.view-link {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--primary);
  transition: opacity 0.2s;
}

.assignment-card:hover .view-link {
  opacity: 0.8;
}
</style>
