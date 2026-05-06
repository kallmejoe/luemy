<script setup lang="ts">
import { useAuth } from "@core/composables/useAuth";

definePageMeta({
  middleware: ["auth"],
});

interface UpcomingAssignment {
  id: number;
  course_id: number;
  title: string;
  description?: string | null;
  max_score: number;
  due_date: string;
  course_name: string;
  course_description?: string | null;
}

const { token } = useAuth();

const assignments = ref<UpcomingAssignment[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);

onMounted(async () => {
  try {
    const res = await $fetch<{ success: boolean; assignments: UpcomingAssignment[]; message?: string }>(
      "/api/assignments/upcoming",
      {
        headers: {
          Authorization: `Bearer ${token.value}`,
        },
      },
    );

    if (!res.success) {
      error.value = res.message || "Failed to load upcoming deadlines";
      return;
    }

    assignments.value = [...(res.assignments || [])].sort((first, second) => {
      return new Date(first.due_date).getTime() - new Date(second.due_date).getTime();
    });
  } catch (err: any) {
    error.value = err?.data?.message || "Failed to load upcoming deadlines";
  } finally {
    loading.value = false;
  }
});

function formatDate(date: string) {
  return new Date(date).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
</script>

<template>
  <div class="deadlines-page">
    <header class="page-header">
      <div>
        <p class="eyebrow">Next 30 days</p>
        <h1>Upcoming Deadlines</h1>
      </div>
      <span class="deadline-count">{{ assignments.length }} due</span>
    </header>

    <div v-if="loading" class="state-card">
      Loading upcoming deadlines...
    </div>

    <div v-else-if="error" class="state-card error-state">
      {{ error }}
    </div>

    <template v-else>
      <AssignmentDeadlineCalendar :assignments="assignments" />

      <section class="list-section" aria-label="Upcoming assignment list">
        <h2>Deadline List</h2>

        <div v-if="assignments.length === 0" class="state-card list-empty-state">
          No assignments due in the next 30 days.
        </div>

        <NuxtLink
          v-for="assignment in assignments"
          :key="assignment.id"
          :to="`/assignments/${assignment.id}`"
          class="deadline-item"
        >
          <div class="deadline-item-header">
            <span class="course-name">{{ assignment.course_name }}</span>
            <span class="due-date">{{ formatDate(assignment.due_date) }}</span>
          </div>

          <h3>{{ assignment.title }}</h3>

          <p v-if="assignment.description" class="assignment-description">
            {{ assignment.description }}
          </p>

          <p v-if="assignment.course_description" class="course-description">
            {{ assignment.course_description }}
          </p>
        </NuxtLink>
      </section>
    </template>
  </div>
</template>

<style scoped>
.deadlines-page {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  padding: var(--spacing-lg);
}

.page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--spacing-md);
}

.eyebrow {
  margin: 0 0 var(--spacing-xs);
  color: var(--muted-foreground);
  font-size: 0.85rem;
  font-weight: 600;
}

h1,
h2,
h3 {
  margin: 0;
  color: var(--foreground);
}

h1 {
  font-size: 1.75rem;
  font-weight: 700;
}

.deadline-count {
  flex-shrink: 0;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: var(--spacing-xs) var(--spacing-sm);
  color: var(--muted-foreground);
  font-size: 0.9rem;
  font-weight: 600;
}

.state-card {
  border: 1px dashed var(--border);
  border-radius: var(--radius);
  background: var(--card);
  color: var(--muted-foreground);
  padding: var(--spacing-xl);
  text-align: center;
}

.error-state {
  border-color: var(--destructive);
  color: var(--destructive);
}

.list-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.list-section h2 {
  font-size: 1.2rem;
  font-weight: 700;
}

.list-empty-state {
  padding: var(--spacing-lg);
}

.deadline-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--card);
  color: inherit;
  padding: var(--spacing-md);
  text-decoration: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.deadline-item:hover {
  border-color: var(--primary);
}

.deadline-item-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-sm);
}

.course-name {
  color: var(--primary);
  font-size: 0.8rem;
  font-weight: 700;
}

.due-date {
  color: var(--muted-foreground);
  flex-shrink: 0;
  font-size: 0.8rem;
  font-weight: 600;
}

.deadline-item h3 {
  font-size: 1rem;
  font-weight: 700;
}

.assignment-description,
.course-description {
  color: var(--muted-foreground);
  font-size: 0.9rem;
  line-height: 1.5;
  margin: 0;
}

.course-description {
  border-top: 1px solid var(--border);
  padding-top: var(--spacing-xs);
}

@media (max-width: 640px) {
  .deadlines-page {
    padding: var(--spacing-md);
  }

  .page-header,
  .deadline-item-header {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
