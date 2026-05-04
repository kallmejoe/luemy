<template>
  <div class="compact-assignment-list">
    <div v-if="assignments.length === 0" class="empty-state">
      <p>No assignments for this course yet.</p>
    </div>

    <div v-else class="assignments">
      <NuxtLink
        v-for="assignment in assignments"
        :key="assignment.id"
        :to="`/assignments/${assignment.id}`"
        class="assignment-row"
        :class="[
          { 'has-submission': assignment.submission },
          `status-${getStatusClass(assignment.submission?.status)}`
        ]"
      >
        <div class="assignment-left">
          <div class="status-indicator" :class="`status-dot-${getStatusClass(assignment.submission?.status)}`"></div>
          <div class="assignment-info">
            <h4 class="assignment-title">{{ assignment.title }}</h4>
            <p v-if="assignment.description" class="assignment-description">
              {{ truncateText(assignment.description, 60) }}
            </p>
          </div>
        </div>

        <div class="assignment-right">
          <span v-if="assignment.submission" class="status-badge" :class="`badge-${getStatusClass(assignment.submission.status)}`">
            {{ assignment.submission.status }}
          </span>
          <span v-else class="status-badge badge-pending">
            Not Submitted
          </span>
          <span class="due-date">
            {{ formatDueDate(assignment.due_date) }}
          </span>
        </div>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Assignment {
  id: number
  title: string
  description: string
  max_score: number
  due_date: string
  submission?: {
    id: number
    status: string
    submission_date: string
  }
}

interface Props {
  assignments: Assignment[]
}

withDefaults(defineProps<Props>(), {})

const formatDueDate = (dateString: string) => {
  if (!dateString) return 'No due date'
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = date.getTime() - now.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays < 0) {
    return 'Overdue'
  } else if (diffDays === 0) {
    return 'Due today'
  } else if (diffDays === 1) {
    return 'Due tomorrow'
  } else if (diffDays <= 7) {
    return `Due in ${diffDays} days`
  } else {
    return date.toLocaleDateString()
  }
}

const truncateText = (text: string, length: number) => {
  if (!text || text.length <= length) return text
  return text.substring(0, length) + '...'
}

const getStatusClass = (status?: string) => {
  if (!status) return 'pending'
  return status.toLowerCase()
}
</script>

<style scoped>
.compact-assignment-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.empty-state {
  padding: var(--spacing-lg);
  text-align: center;
  background: var(--card);
  border: 1px dashed var(--border);
  border-radius: var(--radius);
  color: var(--muted-foreground);
  font-size: 0.95rem;
}

.assignments {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.assignment-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md) var(--spacing-lg);
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  text-decoration: none;
  color: inherit;
  transition: all 0.2s;
  gap: var(--spacing-md);
}

.assignment-row:hover {
  border-color: var(--primary);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.assignment-row.has-submission {
  background: rgba(34, 197, 94, 0.02);
}

.assignment-left {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-md);
  flex: 1;
  min-width: 0;
}

.status-indicator {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 0.375rem;
  transition: all 0.2s;
}

.status-dot-pending {
  background: hsl(47, 93%, 43%);
}

.status-dot-submitted {
  background: hsl(217, 97%, 44%);
}

.status-dot-graded {
  background: hsl(142, 72%, 29%);
}

.assignment-info {
  flex: 1;
  min-width: 0;
}

.assignment-title {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--foreground);
  word-break: break-word;
}

.assignment-description {
  margin: 0.25rem 0 0;
  font-size: 0.8rem;
  color: var(--muted-foreground);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.assignment-right {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  flex-shrink: 0;
}

.status-badge {
  padding: 0.25rem 0.625rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
}

.badge-pending {
  background: rgba(239, 193, 58, 0.1);
  color: hsl(47, 93%, 43%);
}

.badge-submitted {
  background: rgba(59, 130, 246, 0.1);
  color: hsl(217, 97%, 44%);
}

.badge-graded {
  background: rgba(34, 197, 94, 0.1);
  color: hsl(142, 72%, 29%);
}

.due-date {
  font-size: 0.8rem;
  color: var(--muted-foreground);
  white-space: nowrap;
}

@media (max-width: 640px) {
  .assignment-row {
    flex-direction: column;
    align-items: flex-start;
  }

  .assignment-right {
    width: 100%;
    gap: var(--spacing-sm);
  }

  .due-date {
    flex: 1;
  }
}
</style>
