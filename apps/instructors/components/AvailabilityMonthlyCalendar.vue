<template>
  <div class="availability-calendar">
    <section class="calendar-section" aria-label="Availability calendar">
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
            'has-slots': day.slots.length > 0,
          }"
          role="button"
          :tabindex="day.day ? 0 : -1"
          @dblclick="handleDayDoubleClick(day)"
          @keydown.enter="handleDayDoubleClick(day)"
          @keydown.space.prevent="handleDayDoubleClick(day)"
        >
          <div class="day-number">{{ day.day }}</div>

          <div
            v-for="slot in day.slots"
            :key="slot.id"
            class="slot-marker"
            @click.stop="selectSlot(slot)"
          >
            <span class="slot-time">{{ formatTime(slot.start_time) }}</span>
            <span class="slot-end">{{ formatTime(slot.end_time) }}</span>
          </div>
        </div>
      </div>
    </section>

    <aside class="details-panel" aria-label="Selected day details">
      <div class="details-heading">
        <span class="details-label">{{ selectedDayName }}</span>
        <h3>{{ formatFullDate(selectedDate) }}</h3>
      </div>

      <template v-if="selectedDaySlots.length > 0">
        <article
          v-for="slot in selectedDaySlots"
          :key="slot.id"
          class="details-item"
        >
          <div class="details-header">
            <span class="slot-badge">Time Slot</span>
            <button
              type="button"
              class="btn-delete-small"
              title="Delete this time slot"
              @click="deleteSlot(slot.id)"
            >
              ✕
            </button>
          </div>

          <p class="slot-display">
            {{ formatTime(slot.start_time) }} - {{ formatTime(slot.end_time) }}
          </p>
        </article>
      </template>

      <div v-else class="empty-details">
        No availability set for this day.
        <p class="empty-hint">Double-click on a day to add time slots.</p>
      </div>

      <button
        v-if="selectedDay"
        type="button"
        class="btn-add-slot-panel"
        @click="showAddSlotModal(selectedDayName)"
      >
        + Add Time Slot
      </button>
    </aside>

    <!-- Add Slot Modal -->
    <div v-if="showModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <h3>Add Availability for {{ selectedDayName }}</h3>

        <div class="form-group">
          <label for="start-time">Start Time</label>
          <input
            id="start-time"
            v-model="newSlot.startTime"
            type="time"
            class="input-field"
          >
        </div>

        <div class="form-group">
          <label for="end-time">End Time</label>
          <input
            id="end-time"
            v-model="newSlot.endTime"
            type="time"
            class="input-field"
          >
        </div>

        <div v-if="slotError" class="error-message">
          {{ slotError }}
        </div>

        <div class="modal-actions">
          <button class="btn btn-cancel" @click="closeModal">Cancel</button>
          <button class="btn btn-save" @click="addSlot">Add Slot</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue"

interface TimeSlot {
  id: number
  professor_id: number
  day_of_week: string
  start_time: string
  end_time: string
}

interface CalendarDay {
  day: number | ""
  date: string
  dayName: string
  slots: TimeSlot[]
  isToday: boolean
}

const token = useCookie("token")
const slots = ref<TimeSlot[]>([])
const showModal = ref(false)
const selectedDate = ref("")
const selectedDay = ref("")
const selectedDayName = ref("")
const slotError = ref("")

const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
const currentDate = ref(new Date())

const newSlot = ref({
  startTime: "09:00",
  endTime: "10:00"
})

const currentMonth = computed(() => currentDate.value.getMonth())
const currentYear = computed(() => currentDate.value.getFullYear())

const monthName = computed(() => {
  return currentDate.value.toLocaleString("default", {
    month: "long",
  })
})

const calendarDays = computed(() => {
  const year = currentYear.value
  const month = currentMonth.value
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const days: CalendarDay[] = []

  for (let i = 0; i < firstDay; i++) {
    days.push({
      day: "",
      date: `empty-${i}`,
      dayName: "",
      slots: [],
      isToday: false,
    })
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day)
    const dayOfWeek = dayNames[date.getDay()]
    const dateStr = formatDateKey(year, month, day)

    const daySlots = slots.value.filter((slot) => slot.day_of_week === dayOfWeek)

    days.push({
      day,
      date: dateStr,
      dayName: dayOfWeek,
      slots: daySlots,
      isToday: dateStr === formatDateKey(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()),
    })
  }

  return days
})

const selectedDaySlots = computed(() => {
  if (!selectedDay.value) return []
  return slots.value.filter((slot) => slot.day_of_week === selectedDay.value)
})

const fetchSlots = async () => {
  try {
    const res = await $fetch<{ success: boolean; slots: TimeSlot[] }>("/api/availability/list", {
      headers: {
        Authorization: `Bearer ${token.value}`,
      },
    })

    if (res.success) {
      slots.value = res.slots
    }
  } catch (error) {
    console.error("Failed to fetch availability:", error)
  }
}

const nextMonth = () => {
  currentDate.value = new Date(currentYear.value, currentMonth.value + 1, 1)
}

const previousMonth = () => {
  currentDate.value = new Date(currentYear.value, currentMonth.value - 1, 1)
}

const handleDayDoubleClick = (day: CalendarDay) => {
  if (!day.day) return
  selectedDay.value = day.dayName
  selectedDate.value = day.date
  selectedDayName.value = day.dayName
  showAddSlotModal(day.dayName)
}

const selectSlot = (slot: TimeSlot) => {
  selectedDay.value = slot.day_of_week
  selectedDayName.value = slot.day_of_week
}

const showAddSlotModal = (dayName: string) => {
  selectedDayName.value = dayName
  selectedDay.value = dayName
  newSlot.value = { startTime: "09:00", endTime: "10:00" }
  slotError.value = ""
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  slotError.value = ""
}

const formatTime = (time: string) => {
  if (!time) return ""
  if (time.includes(":")) {
    return time.substring(0, 5)
  }
  return time
}

const formatFullDate = (dateStr: string) => {
  if (!dateStr) return selectedDayName.value
  const [year, month, day] = dateStr.split("-")
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

const formatDateKey = (year: number, month: number, day: number) => {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
}

const addSlot = async () => {
  slotError.value = ""

  if (!newSlot.value.startTime || !newSlot.value.endTime) {
    slotError.value = "Please fill in all fields"
    return
  }

  if (newSlot.value.startTime >= newSlot.value.endTime) {
    slotError.value = "End time must be after start time"
    return
  }

  try {
    const res = await $fetch<{ success: boolean; message?: string }>("/api/availability/add", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token.value}`,
      },
      body: {
        dayOfWeek: selectedDay.value,
        startTime: newSlot.value.startTime,
        endTime: newSlot.value.endTime,
      },
    })

    if (res.success) {
      await fetchSlots()
      closeModal()
    } else {
      slotError.value = res.message || "Failed to add slot"
    }
  } catch (error) {
    console.error("Failed to add slot:", error)
    slotError.value = "Failed to add availability slot"
  }
}

const deleteSlot = async (slotId: number) => {
  if (!confirm("Are you sure you want to delete this availability slot?")) {
    return
  }

  try {
    const res = await $fetch<{ success: boolean; message?: string }>(`/api/availability/${slotId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token.value}`,
      },
    })

    if (res.success) {
      await fetchSlots()
    } else {
      alert(res.message || "Failed to delete slot")
    }
  } catch (error) {
    console.error("Failed to delete slot:", error)
    alert("Failed to delete availability slot")
  }
}

watch(
  () => slots.value,
  () => {
    if (selectedDay.value && !selectedDaySlots.value.length) {
      // Keep selection even if no slots
    }
  }
)

onMounted(() => {
  fetchSlots()
  // Initialize selected day to today
  const today = new Date()
  selectedDayName.value = dayNames[today.getDay()]
  selectedDay.value = dayNames[today.getDay()]
})
</script>

<style scoped>
.availability-calendar {
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
  transition: all 0.2s ease;
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
  padding: var(--spacing-sm) 0;
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
  transition: all 0.2s ease;
  user-select: none;
}

.calendar-day:hover {
  border-color: var(--primary);
}

.calendar-day.is-empty {
  background: var(--muted);
  cursor: default;
  opacity: 0.45;
}

.calendar-day.is-today {
  border-color: var(--primary);
  border-width: 2px;
  padding: calc(var(--spacing-xs) - 1px);
}

.calendar-day.has-slots .day-number::after {
  display: inline-block;
  width: 0.4rem;
  height: 0.4rem;
  margin-left: var(--spacing-xs);
  border-radius: 999px;
  background: var(--primary);
  content: "";
  vertical-align: middle;
}

.day-number {
  color: var(--foreground);
  font-size: 0.85rem;
  font-weight: 700;
  min-height: 1.25rem;
}

.slot-marker {
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
  cursor: pointer;
  transition: all 0.2s ease;
}

.slot-marker:hover {
  opacity: 0.9;
}

.slot-time,
.slot-end {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.slot-time {
  font-size: 0.68rem;
  font-weight: 700;
  opacity: 0.82;
}

.slot-end {
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

.details-heading {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.details-heading h3 {
  margin: 0;
  color: var(--foreground);
  font-size: 1.1rem;
  font-weight: 700;
}

.details-label {
  color: var(--muted-foreground);
  font-size: 0.8rem;
  font-weight: 700;
}

.details-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
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

.slot-badge {
  color: var(--primary);
  font-size: 0.8rem;
  font-weight: 700;
}

.slot-display {
  color: var(--foreground);
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
  padding: var(--spacing-sm);
  background: var(--accent);
  border-radius: var(--radius);
}

.btn-delete-small {
  background: none;
  border: none;
  color: var(--destructive);
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.btn-delete-small:hover {
  background-color: var(--destructive-light);
}

.empty-details {
  color: var(--muted-foreground);
  font-size: 0.9rem;
  line-height: 1.5;
  margin: 0;
}

.empty-hint {
  margin: var(--spacing-sm) 0 0 0;
  font-size: 0.85rem;
  opacity: 0.7;
}

.btn-add-slot-panel {
  padding: var(--spacing-sm) var(--spacing-md);
  border: 2px dashed var(--primary);
  background: transparent;
  color: var(--primary);
  border-radius: var(--radius);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9rem;
}

.btn-add-slot-panel:hover {
  background: color-mix(in oklab, var(--primary), transparent 90%);
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 1.5rem;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.modal-content h3 {
  margin: 0 0 1rem 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.form-group label {
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--color-text);
}

.input-field {
  padding: 0.75rem;
  border: 1px solid var(--border);
  border-radius: 4px;
  font-size: 1rem;
  background: var(--background);
  color: var(--color-text);
  transition: all 0.2s ease;
}

.input-field:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px color-mix(in oklab, var(--primary), transparent 80%);
}

.error-message {
  padding: 0.75rem;
  background: color-mix(in oklab, var(--destructive), var(--card) 90%);
  border: 1px solid var(--destructive);
  border-radius: 4px;
  color: var(--destructive);
  font-size: 0.9rem;
  margin-bottom: 1rem;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  font-size: 0.9rem;
}

.btn-cancel {
  background: var(--background);
  color: var(--color-text);
  border: 1px solid var(--border);
}

.btn-cancel:hover {
  background: color-mix(in oklab, var(--background), var(--card));
}

.btn-save {
  background: var(--primary);
  color: var(--card);
}

.btn-save:hover {
  background: color-mix(in oklab, var(--primary), black 10%);
}

@media (max-width: 900px) {
  .availability-calendar {
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
