<script setup lang="ts">
import { ref, computed, watch } from "vue"
import UiInput from "./ui/Input.vue"
import UiButton from "./ui/Button.vue"

interface Course {
  id: number
  name: string
  professor_name: string
}

interface Props {
  courses: Course[]
  showEnrolled?: boolean
  enrolledCourseIds?: number[]
}

const props = withDefaults(defineProps<Props>(), {
  showEnrolled: false,
  enrolledCourseIds: () => [],
})

const emit = defineEmits<{
  (e: "filter-change", payload: Course[]): void
}>()

const searchQuery = ref("")
const enrollmentStatus = ref<"all" | "enrolled" | "not-enrolled">("all")

const filteredCourses = computed(() => {
  let result = props.courses

  // Filter by search query (course name or professor name)
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter((course) => {
      const nameMatch = course.name?.toLowerCase().includes(query)
      const professorMatch = course.professor_name?.toLowerCase().includes(query)
      return nameMatch || professorMatch
    })
  }

  // Filter by enrollment status
  if (enrollmentStatus.value === "enrolled") {
    result = result.filter((course) =>
      props.enrolledCourseIds.includes(course.id)
    )
  } else if (enrollmentStatus.value === "not-enrolled") {
    result = result.filter(
      (course) => !props.enrolledCourseIds.includes(course.id)
    )
  }

  return result
})

// Emit filtered courses whenever filters change
const handleFilterChange = () => {
  emit("filter-change", filteredCourses.value)
}

watch(
  [searchQuery, enrollmentStatus],
  () => {
    handleFilterChange()
  },
  { deep: true }
)

const resetFilters = () => {
  searchQuery.value = ""
  enrollmentStatus.value = "all"
}
</script>

<template>
  <div class="course-search-filter">
    <div class="filter-container">
      <div class="search-box">
        <UiInput
          v-model="searchQuery"
          type="text"
          placeholder="Search courses or professors..."
          class="search-input"
        />
      </div>

      <div class="filter-controls">
        <div class="filter-group">
          <label>Enrollment Status:</label>
          <select v-model="enrollmentStatus" class="filter-select">
            <option value="all">All Courses</option>
            <option value="not-enrolled">Not Enrolled</option>
            <option value="enrolled">Enrolled</option>
          </select>
        </div>

        <UiButton
          size="sm"
          variant="secondary"
          class="reset-btn"
          @click="resetFilters"
        >
          Reset
        </UiButton>
      </div>
    </div>

    <div class="filter-summary">
      <span class="result-count">
        {{ filteredCourses.length }} course{{ filteredCourses.length !== 1 ? "s" : "" }} found
      </span>
    </div>
  </div>
</template>

<style scoped>
.course-search-filter {
  margin-bottom: var(--spacing-lg);
}

.filter-container {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background: var(--muted);
  border-radius: var(--radius-lg);
}

.search-box {
  width: 100%;
}

.search-input {
  width: 100%;
}

.filter-controls {
  display: flex;
  gap: var(--spacing-md);
  align-items: center;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.filter-group label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--foreground);
}

.filter-select {
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--input);
  border-radius: calc(var(--radius) - 2px);
  background: var(--background);
  color: var(--foreground);
  font-size: 0.875rem;
  cursor: pointer;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.filter-select:focus {
  outline: 2px solid var(--ring);
  outline-offset: 2px;
  border-color: var(--ring);
}

.reset-btn {
  white-space: nowrap;
}

.filter-summary {
  margin-top: var(--spacing-md);
  padding: 0 var(--spacing-md);
}

.result-count {
  font-size: 0.875rem;
  color: var(--muted-foreground);
  font-weight: 500;
}

@media (max-width: 640px) {
  .filter-controls {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-group {
    flex-direction: column;
    align-items: flex-start;
  }

  .filter-select {
    width: 100%;
  }

  .reset-btn {
    width: 100%;
  }
}
</style>
