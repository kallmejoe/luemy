<template>
  <div class="availability-calendar">
    <div class="calendar-controls">
      <h2>Set Your Availability</h2>
      <p class="subtitle">Manage your weekly time slots and availability</p>
    </div>

    <div class="calendar-grid">
      <div v-for="day in daysOfWeek" :key="day" class="day-column">
        <h3 class="day-header">{{ day }}</h3>
        
        <div class="time-slots">
          <div 
            v-for="slot in getSlotsByDay(day)" 
            :key="slot.id"
            class="time-slot"
          >
            <div class="slot-time">
              {{ formatTime(slot.start_time) }} - {{ formatTime(slot.end_time) }}
            </div>
            <button 
              class="btn-delete"
              title="Delete this time slot"
              @click="deleteSlot(slot.id)"
            >
              ✕
            </button>
          </div>
        </div>

        <button 
          class="btn-add-slot"
          @click="showAddSlotModal(day)"
        >
          + Add Slot
        </button>
      </div>
    </div>

    <!-- Add Slot Modal -->
    <div v-if="showModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <h3>Add Availability Slot for {{ selectedDay }}</h3>
        
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

        <div class="modal-actions">
          <button class="btn btn-cancel" @click="closeModal">Cancel</button>
          <button class="btn btn-save" @click="addSlot">Add Slot</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue"

const token = useCookie("token")
interface TimeSlot {
  id: number
  professor_id: number
  day_of_week: string
  start_time: string
  end_time: string
}

const slots = ref<TimeSlot[]>([])
const showModal = ref(false)
const selectedDay = ref("")
const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

const newSlot = ref({
  startTime: "09:00",
  endTime: "10:00"
})

const fetchSlots = async () => {
  try {
    const res = await $fetch("/api/availability/list", {
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

const getSlotsByDay = (day: string) => {
  return slots.value.filter((slot: TimeSlot) => slot.day_of_week === day)
}

const formatTime = (time: string) => {
  // Handle both HH:MM and other formats
  if (!time) return ""
  if (time.includes(":")) {
    return time.substring(0, 5)
  }
  return time
}

const showAddSlotModal = (day: string) => {
  selectedDay.value = day
  newSlot.value = { startTime: "09:00", endTime: "10:00" }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
}

const addSlot = async () => {
  if (!newSlot.value.startTime || !newSlot.value.endTime) {
    alert("Please fill in all fields")
    return
  }

  if (newSlot.value.startTime >= newSlot.value.endTime) {
    alert("End time must be after start time")
    return
  }

  try {
    const res = await $fetch("/api/availability/add", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token.value}`,
      },
      body: {
        dayOfWeek: selectedDay.value,
        startTime: newSlot.value.startTime,
        endTime: newSlot.value.endTime
      }
    })

    if (res.success) {
      await fetchSlots()
      closeModal()
    } else {
      alert(res.message || "Failed to add slot")
    }
  } catch (error) {
    console.error("Failed to add slot:", error)
    alert("Failed to add availability slot")
  }
}

const deleteSlot = async (slotId: number) => {
  if (!confirm("Are you sure you want to delete this availability slot?")) {
    return
  }

  try {
    const res = await $fetch(`/api/availability/${slotId}`, {
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

onMounted(() => {
  fetchSlots()
})
</script>

<style scoped>
.availability-calendar {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.calendar-controls {
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--border);
}

.calendar-controls h2 {
  margin: 0 0 0.5rem 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text);
}

.subtitle {
  margin: 0;
  font-size: 0.95rem;
  color: var(--muted-foreground);
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.day-column {
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 1rem;
  background: var(--card);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.day-header {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text);
  padding-bottom: 0.75rem;
  border-bottom: 2px solid var(--primary);
}

.time-slots {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-height: 80px;
}

.time-slot {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: var(--background);
  border-radius: 4px;
  border-left: 3px solid var(--primary);
}

.slot-time {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--color-text);
}

.btn-delete {
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

.btn-delete:hover {
  background-color: var(--destructive-light);
}

.btn-add-slot {
  padding: 0.75rem;
  border: 2px dashed var(--primary);
  background: transparent;
  color: var(--primary);
  border-radius: 4px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9rem;
}

.btn-add-slot:hover {
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
}

.input-field:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px color-mix(in oklab, var(--primary), transparent 80%);
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
</style>
