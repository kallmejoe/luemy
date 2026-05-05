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
const selectedDate = ref(getDateKey(new Date().toISOString()));

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

const selectedDayAssignments = computed(() => {
  return props.assignments.filter((assignment) => {
    return getDateKey(assignment.due_date) === selectedDate.value;
  });
});

watch(
  () => props.assignments,
  (assignments) => {
    if (selectedDayAssignments.value.length === 0 && assignments.length > 0) {
      selectedDate.value = getDateKey(assignments[0].due_date);
    }
  },
  { immediate: true },
);

function nextMonth() {
  currentDate.value = new Date(currentYear.value, currentMonth.value + 1, 1);
}

function previousMonth() {
  currentDate.value = new Date(currentYear.value, currentMonth.value - 1, 1);
}

function selectDay(date: string, hasDay: boolean) {
  if (!hasDay) return;
  selectedDate.value = date;
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
          :class="{
            'is-empty': !day.day,
            'is-today': day.isToday,
            'is-selected': selectedDate === day.date,
            'has-deadlines': day.assignments.length > 0,
          }"
          role="button"
          :tabindex="day.day ? 0 : -1"
          @click="selectDay(day.date, Boolean(day.day))"
          @keydown.enter="selectDay(day.date, Boolean(day.day))"
          @keydown.space.prevent="selectDay(day.date, Boolean(day.day))"
        >
          <div class="day-number">{{ day.day }}</div>

          <div
            v-for="assignment in day.assignments"
            :key="assignment.id"
            class="assignment-marker"
          >
            <span class="marker-course">{{ assignment.course_name }}</span>
            <span class="marker-title">{{ assignment.title }}</span>
          </div>
        </div>
      </div>
    </section>

    <aside class="details-panel" aria-label="Selected day assignment details">
      <div class="details-heading">
        <span class="details-label">Selected day</span>
        <h3>{{ formatDate(selectedDate) }}</h3>
      </div>

      <template v-if="selectedDayAssignments.length > 0">
        <article
          v-for="assignment in selectedDayAssignments"
          :key="assignment.id"
          class="details-item"
        >
          <div class="details-header">
            <span class="course-name">{{ assignment.course_name }}</span>
            <span class="due-date">Max score: {{ assignment.max_score }}</span>
          </div>

          <h4>{{ assignment.title }}</h4>

          <p v-if="assignment.description" class="details-text">
            {{ assignment.description }}
          </p>

          <p v-if="assignment.course_description" class="course-description">
            {{ assignment.course_description }}
          </p>

          <NuxtLink :to="`/assignments/${assignment.id}`" class="details-link">
            View assignment
          </NuxtLink>
        </article>
      </template>

      <div v-else class="empty-details">
        No assignments due on this day.
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
  color: var(--foreground);
  cursor: pointer;
  min-height: 7rem;
  overflow: hidden;
  padding: var(--spacing-xs);
}

.calendar-day.is-empty {
  background: var(--muted);
  cursor: default;
  opacity: 0.45;
}

.calendar-day.is-today {
  border-color: var(--primary);
}

.calendar-day.is-selected {
  background: var(--accent);
  border-color: var(--primary);
}

.calendar-day.has-deadlines .day-number::after {
  display: inline-block;
  width: 0.4rem;
  height: 0.4rem;
  margin-left: var(--spacing-xs);
  border-radius: 999px;
  background: var(--chart-2);
  content: "";
  vertical-align: middle;
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
  border: 1px solid var(--primary);
  border-radius: var(--radius);
  background: var(--primary);
  color: var(--primary-foreground);
  line-height: 1.2;
  padding: 0.25rem 0.35rem;
  text-align: left;
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
  gap: var(--spacing-md);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--card);
  color: var(--foreground);
  min-height: 14rem;
  padding: var(--spacing-md);
}

.details-heading,
.details-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.details-item {
  border-top: 1px solid var(--border);
  padding-top: var(--spacing-md);
}

.details-item:first-of-type {
  border-top: 0;
  padding-top: 0;
}

.details-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-sm);
}

.details-label {
  color: var(--muted-foreground);
  font-size: 0.8rem;
  font-weight: 700;
}

.course-name {
  color: var(--primary);
  font-size: 0.8rem;
  font-weight: 700;
}

.due-date {
  color: var(--muted-foreground);
  font-size: 0.85rem;
  font-weight: 600;
}

.details-panel h3,
.details-panel h4 {
  margin: 0;
  color: var(--foreground);
  font-weight: 700;
}

.details-panel h3 {
  font-size: 1.1rem;
}

.details-panel h4 {
  font-size: 1rem;
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
  .details-header {
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
