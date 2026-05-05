<script setup lang="ts">
interface AssignmentDeadline {
  id: number;
  course_id: number;
  title: string;
  description?: string | null;
  max_score: number;
  due_date: string;
  course_name: string;
  course_description?: string | null;
}

const props = defineProps<{
  assignments: AssignmentDeadline[];
}>();

const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const currentDate = ref(new Date());
const selectedAssignment = ref<AssignmentDeadline | null>(props.assignments[0] || null);

watch(
  () => props.assignments,
  (assignments) => {
    if (!selectedAssignment.value || !assignments.some((assignment) => assignment.id === selectedAssignment.value?.id)) {
      selectedAssignment.value = assignments[0] || null;
    }
  },
);

const currentMonth = computed(() => currentDate.value.getMonth());
const currentYear = computed(() => currentDate.value.getFullYear());

const monthName = computed(() => {
  return currentDate.value.toLocaleString("default", {
    month: "long",
  });
});

const calendarDays = computed(() => {
  const year = currentYear.value;
  const month = currentMonth.value;
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days: Array<{
    day: number | "";
    date: string;
    assignments: AssignmentDeadline[];
    isToday: boolean;
  }> = [];

  for (let i = 0; i < firstDay; i++) {
    days.push({ day: "", date: `empty-${i}`, assignments: [], isToday: false });
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = formatDateKey(year, month, day);
    const dayAssignments = props.assignments.filter((assignment) => {
      return getDateKey(assignment.due_date) === dateStr;
    });

    days.push({
      day,
      date: dateStr,
      assignments: dayAssignments,
      isToday: dateStr === getDateKey(new Date().toISOString()),
    });
  }

  return days;
});

function nextMonth() {
  currentDate.value = new Date(currentYear.value, currentMonth.value + 1, 1);
}

function previousMonth() {
  currentDate.value = new Date(currentYear.value, currentMonth.value - 1, 1);
}

function selectAssignment(assignment: AssignmentDeadline) {
  selectedAssignment.value = assignment;
}

function formatDateKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function getDateKey(date: string) {
  return date.slice(0, 10);
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
</script>

<template>
  <div class="deadline-calendar">
    <section class="calendar-section" aria-label="Assignment deadline calendar">
      <div class="calendar-toolbar">
        <button type="button" class="month-button" @click="previousMonth">
          Previous
        </button>

        <h2>{{ monthName }} {{ currentYear }}</h2>

        <button type="button" class="month-button" @click="nextMonth">
          Next
        </button>
      </div>

      <div class="calendar-grid">
        <div v-for="day in weekDays" :key="day" class="weekday">
          {{ day }}
        </div>

        <div
          v-for="day in calendarDays"
          :key="day.date"
          class="calendar-day"
          :class="{ 'is-empty': !day.day, 'is-today': day.isToday }"
        >
          <div class="day-number">{{ day.day }}</div>

          <button
            v-for="assignment in day.assignments"
            :key="assignment.id"
            type="button"
            class="assignment-marker"
            :class="{ 'is-selected': selectedAssignment?.id === assignment.id }"
            @click="selectAssignment(assignment)"
          >
            <span class="marker-course">{{ assignment.course_name }}</span>
            <span class="marker-title">{{ assignment.title }}</span>
          </button>
        </div>
      </div>
    </section>

    <aside class="details-panel" aria-label="Selected assignment details">
      <template v-if="selectedAssignment">
        <div class="details-header">
          <span class="course-name">{{ selectedAssignment.course_name }}</span>
          <span class="due-date">{{ formatDate(selectedAssignment.due_date) }}</span>
        </div>

        <h3>{{ selectedAssignment.title }}</h3>

        <p v-if="selectedAssignment.description" class="details-text">
          {{ selectedAssignment.description }}
        </p>

        <p v-if="selectedAssignment.course_description" class="course-description">
          {{ selectedAssignment.course_description }}
        </p>

        <div class="details-footer">
          <span>Max score: {{ selectedAssignment.max_score }}</span>
          <NuxtLink :to="`/assignments/${selectedAssignment.id}`" class="details-link">
            View assignment
          </NuxtLink>
        </div>
      </template>

      <div v-else class="empty-details">
        Select a deadline to see its course, title, and details.
      </div>
    </aside>
  </div>
</template>

<style scoped>
.deadline-calendar {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(280px, 0.65fr);
  gap: var(--spacing-lg);
  align-items: start;
}

.calendar-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.calendar-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-md);
}

.calendar-toolbar h2 {
  margin: 0;
  color: var(--foreground);
  font-size: 1.2rem;
  font-weight: 700;
}

.month-button {
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--card);
  color: var(--foreground);
  cursor: pointer;
  font-weight: 600;
  min-width: 5.75rem;
  padding: var(--spacing-xs) var(--spacing-sm);
}

.month-button:hover {
  border-color: var(--primary);
  color: var(--primary);
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: var(--spacing-xs);
}

.weekday {
  color: var(--muted-foreground);
  font-size: 0.8rem;
  font-weight: 700;
  text-align: center;
}

.calendar-day {
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--card);
  min-height: 7rem;
  overflow: hidden;
  padding: var(--spacing-xs);
}

.calendar-day.is-empty {
  background: var(--muted);
  opacity: 0.45;
}

.calendar-day.is-today {
  border-color: var(--primary);
}

.day-number {
  color: var(--foreground);
  font-size: 0.85rem;
  font-weight: 700;
  min-height: 1.25rem;
}

.assignment-marker {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  width: 100%;
  margin-top: var(--spacing-xs);
  overflow: hidden;
  border: 1px solid transparent;
  border-radius: var(--radius);
  background: var(--primary);
  color: var(--primary-foreground);
  cursor: pointer;
  font: inherit;
  line-height: 1.2;
  padding: 0.25rem 0.35rem;
  text-align: left;
}

.assignment-marker:hover,
.assignment-marker.is-selected {
  border-color: var(--foreground);
}

.marker-course,
.marker-title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.marker-course {
  font-size: 0.68rem;
  font-weight: 700;
  opacity: 0.82;
}

.marker-title {
  font-size: 0.75rem;
  font-weight: 700;
}

.details-panel {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--card);
  color: var(--foreground);
  min-height: 14rem;
  padding: var(--spacing-md);
}

.details-header,
.details-footer {
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

.due-date,
.details-footer {
  color: var(--muted-foreground);
  font-size: 0.85rem;
  font-weight: 600;
}

.details-panel h3 {
  margin: 0;
  color: var(--foreground);
  font-size: 1.1rem;
  font-weight: 700;
}

.details-text,
.course-description,
.empty-details {
  color: var(--muted-foreground);
  font-size: 0.9rem;
  line-height: 1.5;
  margin: 0;
}

.course-description {
  border-top: 1px solid var(--border);
  padding-top: var(--spacing-sm);
}

.details-link {
  color: var(--primary);
  flex-shrink: 0;
  font-weight: 700;
  text-decoration: none;
}

.details-link:hover {
  text-decoration: underline;
}

@media (max-width: 900px) {
  .deadline-calendar {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .calendar-toolbar,
  .details-header,
  .details-footer {
    align-items: flex-start;
    flex-direction: column;
  }

  .calendar-day {
    min-height: 5.5rem;
  }

  .month-button {
    width: 100%;
  }
}
</style>
