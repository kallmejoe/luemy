<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useAuth } from "@core/composables/useAuth";

definePageMeta({
  middleware: ["auth"]
});

interface CourseDetails {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
  professor_name: string;
  professor_email: string;
}

interface Submission {
  id: number;
  status: "Pending" | "Submitted" | "Graded";
  submission_date: string;
}

interface Assignment {
  id: number;
  title: string;
  description: string | null;
  max_score: number;
  due_date: string | null;
  submission: Submission | null;
}

const { token } = useAuth();
const route = useRoute();
const courseId = computed(() => parseInt(route.params.id as string, 10));

const course = ref<CourseDetails | null>(null);
const assignments = ref<Assignment[]>([]);
const loading = ref(true);
const error = ref("");

const stats = computed(() => {
  const total = assignments.value.length;
  const submitted = assignments.value.filter((a) => a.submission?.status === "Submitted").length;
  const graded = assignments.value.filter((a) => a.submission?.status === "Graded").length;
  const pending = assignments.value.filter((a) => !a.submission || a.submission.status === "Pending").length;

  const completionRate = total > 0 ? Math.round(((submitted + graded) / total) * 100) : 0;

  return { total, submitted, graded, pending, completionRate };
});

const upcomingAssignments = computed(() => {
  return [...assignments.value]
    .filter((a) => !!a.due_date)
    .sort((a, b) => new Date(a.due_date as string).getTime() - new Date(b.due_date as string).getTime())
    .slice(0, 3);
});

const nextDue = computed(() => upcomingAssignments.value[0] || null);

function formatDate(dateString: string | null): string {
  if (!dateString) return "No due date";

  return new Date(dateString).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}

function dueBadgeText(dateString: string | null): string {
  if (!dateString) return "No deadline";

  const now = new Date();
  const due = new Date(dateString);
  const daysLeft = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (daysLeft < 0) return "Past due";
  if (daysLeft === 0) return "Due today";
  if (daysLeft === 1) return "Due tomorrow";
  return `Due in ${daysLeft} days`;
}

async function fetchCourseDetails() {
  try {
    loading.value = true;
    error.value = "";

    const res = await $fetch<{ success: boolean; message?: string; course?: CourseDetails; assignments?: Assignment[] }>(
      `/api/courses/student/${courseId.value}`,
      {
        headers: {
          Authorization: `Bearer ${token.value}`
        }
      }
    );

    if (!res.success || !res.course) {
      error.value = res.message || "Failed to load course";
      return;
    }

    course.value = res.course;
    assignments.value = res.assignments || [];
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : "Failed to load course details";
  } finally {
    loading.value = false;
  }
}

onMounted(fetchCourseDetails);
</script>

<template>
  <div class="course-details-page">
    <div class="course-header">
      <NuxtLink to="/active-courses" class="back-link">Back to My Courses</NuxtLink>

      <div v-if="course" class="header-card">
        <div class="header-left">
          <p class="course-eyebrow">Course workspace</p>
          <h1>{{ course.name }}</h1>
          <p class="course-summary">
            {{ course.description || "No description yet. Reach out to your instructor for course expectations and schedule." }}
          </p>
        </div>

        <div class="header-right">
          <div class="mini-stat">
            <p>Completion</p>
            <strong>{{ stats.completionRate }}%</strong>
          </div>
          <div class="mini-stat">
            <p>Next deadline</p>
            <strong>{{ nextDue ? formatDate(nextDue.due_date) : "No upcoming due date" }}</strong>
          </div>
        </div>
      </div>
    </div>

    <div v-if="loading" class="state-card">Loading course details...</div>
    <div v-else-if="error" class="state-card state-card--error">{{ error }}</div>
    <div v-else-if="!course" class="state-card">Course not found.</div>

    <div v-else class="details-grid">
      <section class="panel panel--stats">
        <h2>Progress snapshot</h2>
        <div class="stats-grid">
          <article class="metric">
            <p>Total assignments</p>
            <strong>{{ stats.total }}</strong>
          </article>
          <article class="metric">
            <p>Submitted</p>
            <strong class="metric--info">{{ stats.submitted }}</strong>
          </article>
          <article class="metric">
            <p>Graded</p>
            <strong class="metric--success">{{ stats.graded }}</strong>
          </article>
          <article class="metric">
            <p>Pending</p>
            <strong class="metric--warning">{{ stats.pending }}</strong>
          </article>
        </div>
      </section>

      <section class="panel panel--instructor">
        <h2>Instructor</h2>
        <p class="instructor-name">{{ course.professor_name }}</p>
        <a :href="`mailto:${course.professor_email}`" class="instructor-email">{{ course.professor_email }}</a>
        <p class="course-created">Course created {{ formatDate(course.created_at) }}</p>
      </section>

      <section class="panel panel--timeline">
        <h2>Upcoming timeline</h2>
        <ul v-if="upcomingAssignments.length" class="timeline-list">
          <li v-for="assignment in upcomingAssignments" :key="assignment.id" class="timeline-item">
            <div>
              <p class="timeline-title">{{ assignment.title }}</p>
              <p class="timeline-date">{{ formatDate(assignment.due_date) }}</p>
            </div>
            <span class="timeline-badge">{{ dueBadgeText(assignment.due_date) }}</span>
          </li>
        </ul>
        <p v-else class="timeline-empty">No assignment deadlines yet.</p>
      </section>

      <section class="panel panel--assignments">
        <div class="panel-heading">
          <h2>Assignments</h2>
          <span>{{ assignments.length }} total</span>
        </div>
        <CompactAssignmentList :assignments="assignments" />
      </section>
    </div>
  </div>
</template>

<style scoped>
.course-details-page {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  padding-bottom: var(--spacing-xl);
}

.course-header {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.back-link {
  width: fit-content;
  color: var(--primary);
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 600;
}

.back-link:hover {
  text-decoration: underline;
}

.header-card {
  display: grid;
  grid-template-columns: 1.7fr 1fr;
  gap: var(--spacing-lg);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  background:
    radial-gradient(circle at right top, color-mix(in oklab, var(--primary) 13%, transparent), transparent 50%),
    var(--card);
}

.course-eyebrow {
  margin: 0;
  text-transform: uppercase;
  font-size: 0.72rem;
  letter-spacing: 0.08em;
  color: var(--muted-foreground);
}

.header-left h1 {
  margin: var(--spacing-xs) 0;
  font-size: 1.8rem;
  color: var(--foreground);
}

.course-summary {
  margin: 0;
  line-height: 1.6;
  color: var(--muted-foreground);
}

.header-right {
  display: grid;
  gap: var(--spacing-sm);
}

.mini-stat {
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: var(--spacing-sm);
  background: color-mix(in oklab, var(--background) 74%, transparent);
}

.mini-stat p {
  margin: 0;
  font-size: 0.78rem;
  color: var(--muted-foreground);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.mini-stat strong {
  display: block;
  margin-top: 0.45rem;
  color: var(--foreground);
}

.details-grid {
  display: grid;
  gap: var(--spacing-md);
  grid-template-columns: repeat(12, minmax(0, 1fr));
}

.panel {
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--card);
  padding: var(--spacing-md);
}

.panel h2 {
  margin: 0 0 var(--spacing-sm);
  font-size: 1rem;
  color: var(--foreground);
}

.panel--stats {
  grid-column: span 8;
}

.panel--instructor {
  grid-column: span 4;
}

.panel--timeline,
.panel--assignments {
  grid-column: span 12;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--spacing-sm);
}

.metric {
  border-radius: var(--radius);
  border: 1px solid var(--border);
  padding: var(--spacing-sm);
  background: var(--background);
}

.metric p {
  margin: 0;
  color: var(--muted-foreground);
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.metric strong {
  display: block;
  margin-top: 0.4rem;
  color: var(--foreground);
  font-size: 1.35rem;
}

.metric--info {
  color: var(--info);
}

.metric--success {
  color: var(--success);
}

.metric--warning {
  color: var(--warning);
}

.instructor-name {
  margin: 0;
  font-weight: 700;
  color: var(--foreground);
}

.instructor-email {
  display: inline-block;
  margin-top: var(--spacing-xs);
  color: var(--primary);
  text-decoration: none;
}

.instructor-email:hover {
  text-decoration: underline;
}

.course-created {
  margin: var(--spacing-sm) 0 0;
  color: var(--muted-foreground);
  font-size: 0.85rem;
}

.timeline-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: var(--spacing-sm);
}

.timeline-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-sm);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: var(--spacing-sm);
}

.timeline-title {
  margin: 0;
  color: var(--foreground);
  font-weight: 600;
}

.timeline-date {
  margin: 0.2rem 0 0;
  color: var(--muted-foreground);
  font-size: 0.84rem;
}

.timeline-badge {
  border-radius: 999px;
  border: 1px solid var(--border);
  padding: 0.2rem 0.6rem;
  color: var(--muted-foreground);
  font-size: 0.76rem;
  white-space: nowrap;
}

.timeline-empty {
  margin: 0;
  color: var(--muted-foreground);
}

.panel-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-sm);
}

.panel-heading span {
  color: var(--muted-foreground);
  font-size: 0.85rem;
}

.state-card {
  border: 1px dashed var(--border);
  border-radius: var(--radius);
  padding: 2.2rem;
  text-align: center;
  color: var(--muted-foreground);
  background: var(--card);
}

.state-card--error {
  border-style: solid;
  color: var(--destructive);
}

@media (max-width: 980px) {
  .header-card {
    grid-template-columns: 1fr;
  }

  .panel--stats,
  .panel--instructor,
  .panel--timeline,
  .panel--assignments {
    grid-column: span 12;
  }

  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .header-left h1 {
    font-size: 1.5rem;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .timeline-item {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
