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
            'is-past': day.isPast,
            'has-slots': day.slots.length > 0,
          }"
          role="button"
          :tabindex="day.day && !day.isPast ? 0 : -1"
          @click="selectDay(day)"
          @dblclick="handleDayDoubleClick(day)"
          @keydown.enter="selectDay(day)"
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
            <span class="slot-end">{{ formatTime(slot.end_time) }} - Hall {{ slot.hall }}</span>
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

          <p class="slot-hall">
            Hall: <span class="hall-badge">{{ slot.hall }}</span>
          </p>
</article>
      </template>

      <div v-else class="empty-details">
        No availability set for this day.
        <p class="empty-hint">Double-click on a day to add time slots.</p>
      </div>

      <button
        v-if="selectedDate"
        type="button"
        class="btn-add-slot-panel"
        @click="showAddSlotModal(selectedDate, selectedDayName)"
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

        <div class="form-group">
          <label for="hall-select">Hall</label>
          <select
            id="hall-select"
            v-model="newSlot.hall"
            class="input-field"
          >
            <option value="">Select a hall</option>
            <option
              v-for="hall in availableHalls"
              :key="hall"
              :value="hall"
            >
              Hall {{ hall }}
            </option>
          </select>
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
  specific_date: string
  start_time: string
  end_time: string
  hall: string
}

interface CalendarDay {
  day: number | ""
  date: string
  dayName: string
  slots: TimeSlot[]
  isToday: boolean
  isPast: boolean
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
const availableHalls = ["1", "2", "3", "4", "A", "B"]
const currentDate = ref(new Date())

const newSlot = ref({
  startTime: "09:00",
  endTime: "10:00",
  hall: "",
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
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (let i = 0; i < firstDay; i++) {
    days.push({
      day: "",
      date: `empty-${i}`,
      dayName: "",
      slots: [],
      isToday: false,
      isPast: false,
    })
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day)
    const dayOfWeek = dayNames[date.getDay()]
    const dateStr = formatDateKey(year, month, day)
    const dateObj = new Date(year, month, day)
    dateObj.setHours(0, 0, 0, 0)

    const daySlots = slots.value.filter((slot) => {
      const slotDate = slot.specific_date ? String(slot.specific_date).split(' ')[0] : ''
      return slotDate === dateStr
    })

    days.push({
      day,
      date: dateStr,
      dayName: dayOfWeek,
      slots: daySlots,
      isToday: dateStr === formatDateKey(today.getFullYear(), today.getMonth(), today.getDate()),
      isPast: dateObj < today,
    })
  }

  return days
})

const selectedDaySlots = computed(() => {
  if (!selectedDate.value) return []
  return slots.value.filter((slot) => {
    const slotDate = slot.specific_date ? String(slot.specific_date).split(' ')[0] : ''
    return slotDate === selectedDate.value
  })
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

const selectDay = (day: CalendarDay) => {
  if (!day.day) return
  selectedDate.value = day.date
  selectedDayName.value = day.dayName
}

const handleDayDoubleClick = (day: CalendarDay) => {
  if (!day.day || day.isPast) return
  selectedDate.value = day.date
  selectedDayName.value = day.dayName
  showAddSlotModal(day.date, day.dayName)
}

const selectSlot = (slot: TimeSlot) => {
  const slotDate = slot.specific_date ? String(slot.specific_date).split(' ')[0] : ''
  selectedDate.value = slotDate
  selectedDayName.value = slot.day_of_week
}

const showAddSlotModal = (date: string, dayName: string) => {
  selectedDate.value = date
  selectedDayName.value = dayName
  newSlot.value = { startTime: "09:00", endTime: "10:00", hall: "" }
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

  if (!selectedDate.value) {
    slotError.value = "No date selected"
    return
  }

  if (!newSlot.value.startTime || !newSlot.value.endTime) {
    slotError.value = "Please fill in all fields"
    return
  }

  if (!newSlot.value.hall) {
    slotError.value = "Please select a hall"
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
        specificDate: selectedDate.value,
        startTime: newSlot.value.startTime,
        endTime: newSlot.value.endTime,
        hall: newSlot.value.hall,
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
  grid-template-columns: minmax(0, 1.35fr) minmax(240px, 0.65fr);
  gap: var(--spacing-lg);
  align-items: start;
  overflow: hidden;
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
  font-size: 1.35rem;
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
  padding: var(--spacing-sm) var(--spacing-md);
  transition: all 0.2s ease;
}

.month-button:hover {
  border-color: var(--primary);
  background: var(--primary);
  color: var(--primary-foreground);
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: var(--spacing-xs);
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: var(--spacing-sm);
  overflow-y: auto;
  max-height: calc(100vh - 12rem);
}

.weekday {
  color: var(--primary);
  font-size: 0.8rem;
  font-weight: 700;
  text-align: center;
  padding: var(--spacing-sm);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  position: sticky;
  top: 0;
  background: var(--card);
  z-index: 1;
}

.calendar-day {
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  background: var(--muted);
  color: var(--foreground);
  cursor: pointer;
  min-height: 6.5rem;
  padding: var(--spacing-sm);
  transition: all 0.2s ease;
  user-select: none;
  overflow: visible;
}

.calendar-day:hover {
  border-color: var(--primary);
  background: var(--card);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.calendar-day.is-empty {
  background: var(--background);
  cursor: default;
  opacity: 0.4;
}

.calendar-day.is-past {
  opacity: 0.5;
  cursor: not-allowed;
}

.calendar-day.is-past .day-number {
  color: var(--muted-foreground);
}

.calendar-day.is-today {
  background: color-mix(in oklab, var(--primary), transparent 85%);
  border: 2px solid var(--primary);
}

.calendar-day.is-today .day-number {
  color: var(--foreground);
  font-weight: 700;
}

.calendar-day.has-slots {
  background: var(--card);
  border-color: color-mix(in oklab, var(--primary), transparent 70%);
}

.calendar-day.has-slots .day-number {
  color: var(--primary);
  font-weight: 700;
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
  color: var(--muted-foreground);
  font-size: 0.9rem;
  font-weight: 600;
  min-height: 1.25rem;
}

.slot-marker {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  width: 100%;
  margin-top: var(--spacing-xs);
  overflow: hidden;
  border-radius: var(--radius-sm);
  background: color-mix(in oklab, var(--primary), transparent 15%);
  color: var(--sidebar-foreground);
  line-height: 1.2;
  padding: 0.35rem 0.45rem;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;
  border-left: 3px solid var(--primary);
}

.slot-marker:hover {
  background: var(--primary);
  color: var(--primary-foreground);
  transform: translateX(2px);
}

.slot-time,
.slot-end {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.slot-time {
  font-size: 0.7rem;
  font-weight: 700;
  opacity: 0.85;
}

.slot-end {
  font-size: 0.75rem;
  font-weight: 600;
}

.details-panel {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--card);
  color: var(--foreground);
  min-height: 14rem;
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-sm);
}

.details-heading {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  padding-bottom: var(--spacing-md);
  border-bottom: 2px solid var(--primary);
}

.details-heading h3 {
  margin: 0;
  color: var(--foreground);
  font-size: 1.15rem;
  font-weight: 700;
}

.details-label {
  color: var(--muted-foreground);
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
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
  color: var(--foreground);
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.slot-display {
  color: var(--foreground);
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--primary);
  border-radius: var(--radius-md);
}

.slot-hall {
  color: var(--foreground);
  font-size: 0.9rem;
  margin: 0;
  font-weight: 500;
  opacity: 0.9;
}

.hall-badge {
  display: inline-block;
  padding: 0.2rem 0.6rem;
  background: var(--foreground);
  color: var(--primary);
  border-radius: var(--radius-sm);
  font-weight: 700;
  font-size: 0.8rem;
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
  line-height: 1.6;
  margin: 0;
  text-align: center;
  padding: var(--spacing-lg) var(--spacing-md);
  background: var(--muted);
  border-radius: var(--radius-md);
}

.empty-hint {
  margin: var(--spacing-sm) 0 0 0;
  font-size: 0.85rem;
  opacity: 0.7;
  color: var(--primary);
}

.btn-add-slot-panel {
  padding: var(--spacing-sm) var(--spacing-md);
  border: 2px dashed var(--primary);
  background: color-mix(in oklab, var(--primary), transparent 92%);
  color: var(--primary);
  border-radius: var(--radius-md);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9rem;
}

.btn-add-slot-panel:hover {
  background: var(--primary);
  color: var(--primary-foreground);
  border-style: solid;
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
  backdrop-filter: blur(4px);
}

.modal-content {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: var(--spacing-xl);
  max-width: 420px;
  width: 90%;
  box-shadow: var(--shadow-lg);
}

.modal-content h3 {
  margin: 0 0 var(--spacing-lg) 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--foreground);
  padding-bottom: var(--spacing-md);
  border-bottom: 2px solid var(--primary);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  margin-bottom: var(--spacing-md);
}

.form-group label {
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--foreground);
}

.input-field {
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  font-size: 1rem;
  background: var(--background);
  color: var(--foreground);
  transition: all 0.2s ease;
}

.input-field:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px color-mix(in oklab, var(--primary), transparent 80%);
}

.error-message {
  padding: var(--spacing-sm) var(--spacing-md);
  background: color-mix(in oklab, var(--destructive), var(--card) 90%);
  border: 1px solid var(--destructive);
  border-radius: var(--radius-md);
  color: var(--destructive);
  font-size: 0.9rem;
  margin-bottom: var(--spacing-md);
}

.modal-actions {
  display: flex;
  gap: var(--spacing-md);
  justify-content: flex-end;
  margin-top: var(--spacing-lg);
}

.btn {
  padding: var(--spacing-sm) var(--spacing-lg);
  border-radius: var(--radius-md);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  font-size: 0.9rem;
}

.btn-cancel {
  background: var(--background);
  color: var(--foreground);
  border: 1px solid var(--border);
}

.btn-cancel:hover {
  background: var(--muted);
}

.btn-save {
  background: var(--primary);
  color: var(--primary-foreground);
}

.btn-save:hover {
  background: color-mix(in oklab, var(--primary), black 15%);
}

@media (max-width: 860px) {
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
