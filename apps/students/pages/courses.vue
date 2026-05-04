<script setup lang="ts">
import { ref, onMounted } from 'vue'
import UiButton from '@core/components/ui/Button.vue'

definePageMeta({
  middleware: ['auth']
})

const token = useCookie('token')

const courses = ref<any[]>([])
const activeCourseIds = ref<number[]>([])
const selectedCourseIds = ref<number[]>([])

const fetchCourses = async () => {
  try {
    const res = await $fetch('/api/courses/list-courses')
    if (res.success) {
      courses.value = res.courses
    }
  } catch (error) {
    console.error(error)
  }
}

const fetchActiveCourses = async () => {
  try {
    const res = await $fetch('/api/student/activeCourses', {
      headers: {
        Authorization: `Bearer ${token.value}`
      }
    })

    if (res.success) {
      activeCourseIds.value = res.courses.map((course: any) => course.id)
    }
  } catch (error) {
    console.error(error)
  }
}

onMounted(async () => {
  await Promise.all([fetchCourses(), fetchActiveCourses()])
})

const handleEnrollment = async () => {
  if (selectedCourseIds.value.length === 0) return

  try {
    const res = await $fetch('/api/student/enroll', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token.value}`
      },
      body: {
        courseIds: selectedCourseIds.value
      }
    })

    if (res.success) {
      await fetchActiveCourses()
      selectedCourseIds.value = []
      alert('Successfully enrolled!')
    } else {
      alert(res.message || 'Error occurred')
    }
  } catch (error) {
    console.error(error)
    alert('Enrollment failed')
  }
}

const clearSelection = () => {
  selectedCourseIds.value = []
}

const isEnrolled = (courseId: number) => activeCourseIds.value.includes(courseId)

const toggleSelection = (courseId: number) => {
  if (selectedCourseIds.value.includes(courseId)) {
    selectedCourseIds.value = selectedCourseIds.value.filter(id => id !== courseId)
  } else {
    selectedCourseIds.value.push(courseId)
  }
}
</script>

<template>
  <div class="courses-page">
    <div class="header-actions" v-if="selectedCourseIds.length > 0">
      <UiButton @click="handleEnrollment">
        Enroll ({{ selectedCourseIds.length }})
      </UiButton>
      <UiButton variant="ghost" @click="clearSelection">Clear</UiButton>
    </div>

    <div class="course-list">
      <NuxtLink
        v-for="course in courses"
        :key="course.id"
        :to="`/courses/${course.id}`"
        class="course-card"
        :class="{ enrolled: isEnrolled(course.id) }"
      >
        <div class="course-row">
          <div v-if="!isEnrolled(course.id)" @click.prevent="toggleSelection(course.id)" class="selection-area">
            <input
              type="checkbox"
              :checked="selectedCourseIds.includes(course.id)"
              class="course-checkbox"
            />
          </div>
          <span v-else class="check-icon"></span>

          <div class="course-info">
            <span class="course-name">{{ course.name }}</span>
            <span class="course-professor">{{ course.professor_name }}</span>
          </div>
          <span v-if="isEnrolled(course.id)" class="badge">Enrolled</span>
        </div>
      </NuxtLink>
    </div>
  </div>
</template>

<style scoped>
.courses-page {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.header-actions {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) 0;
  background: var(--background);
}

.course-list {
  display: flex;
  flex-direction: column;
}

.course-card {
  position: relative;
  display: flex;
  align-items: center;
  padding: var(--spacing-md) var(--spacing-lg);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--card);
  transition: all 0.2s ease;
  text-decoration: none;
  color: inherit;
}

.course-card::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  border-radius: var(--radius-lg) 0 0 var(--radius-lg);
  background: transparent;
  transition: background 0.2s ease;
}

.course-card:hover {
  background: var(--accent);
}

.course-card.enrolled {
  background: var(--muted);
}

.course-card.enrolled::before {
  background: var(--primary);
}

.course-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  width: 100%;
  cursor: pointer;
}

.selection-area {
  display: flex;
  align-items: center;
  padding: 0;
  margin: 0;
}

.course-checkbox {
  width: 1.25rem;
  height: 1.25rem;
  accent-color: var(--primary);
  cursor: pointer;
}

.check-icon {
  width: 0.75rem;
  height: 0.75rem;
  border-radius: 50%;
  background: var(--primary);
}

.course-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.course-name {
  font-size: 1rem;
  font-weight: 500;
  color: var(--foreground);
}

.course-professor {
  font-size: 0.875rem;
  color: var(--muted-foreground);
}

.badge {
  padding: 0.25rem 0.625rem;
  border-radius: 999px;
  background: var(--primary);
  color: var(--primary-foreground);
  font-size: 0.75rem;
  font-weight: 500;
}
</style>
