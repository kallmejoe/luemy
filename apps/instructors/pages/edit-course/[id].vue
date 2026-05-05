<script setup lang="ts">
import EditCourseForm from "../../components/EditCourseForm.vue"
import { ref, onMounted } from "vue"
import { useRouter, useRoute } from "vue-router"

definePageMeta({
  middleware: ["auth"]
})

interface Course {
  id: number
  name: string
  description: string
  active: number
  professor_id: number
  created_at: string
}

const router = useRouter()
const route = useRoute()
const token = useCookie("token")

const course = ref<Course | null>(null)
const isLoadingCourse = ref(true)
const courseLoadError = ref("")
const isSubmitting = ref(false)

const courseId = route.params.id as string

onMounted(async () => {
  await fetchCourse()
})

const fetchCourse = async () => {
  isLoadingCourse.value = true
  courseLoadError.value = ""

  try {
    const response = await $fetch(`/api/courses/${courseId}`, {
      headers: {
        Authorization: `Bearer ${token.value}`
      }
    })

    if ((response as Record<string, unknown>).success) {
      course.value = (response as Record<string, unknown>).course as Course
    } else {
      courseLoadError.value =
        (response as Record<string, unknown>).message ||
        "Failed to load course"
    }
  } catch (error: unknown) {
    console.error("Error fetching course:", error)
    const errorMessage =
      (error as { data?: Record<string, unknown> })?.data?.message ||
      "Failed to load course. Please try again."
    courseLoadError.value = String(errorMessage)
  } finally {
    isLoadingCourse.value = false
  }
}

const handleFormSubmit = async (formData: {
  name: string
  description: string
  active: boolean
}) => {
  isSubmitting.value = true

  try {
    const response = await $fetch(`/api/courses/${courseId}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token.value}`
      },
      body: {
        name: formData.name,
        description: formData.description,
        active: formData.active
      }
    })

    if ((response as Record<string, unknown>).success) {
      if ((response as Record<string, unknown>).course) {
        course.value = (response as Record<string, unknown>).course as Course
      }
      setTimeout(() => {
        router.push("/courses")
      }, 1500)
    }
  } catch (error: unknown) {
    console.error("Error updating course:", error)
  } finally {
    isSubmitting.value = false
  }
}

const handleCancel = () => {
  router.push("/courses")
}
</script>

<template>
  <div class="edit-course-page">
    <div class="page-header">
      <router-link to="/courses" class="back-link">
        <span class="back-arrow">←</span> Back to Courses
      </router-link>
      <h1 class="page-title">Edit Course</h1>
    </div>

    <div class="page-content">
      <div v-if="isLoadingCourse" class="loading-state">
        <p>Loading course details...</p>
      </div>

      <div v-else-if="courseLoadError" class="error-state">
        <p>{{ courseLoadError }}</p>
        <router-link to="/courses" class="btn btn--primary">
          Back to Courses
        </router-link>
      </div>

      <div v-else-if="course" class="form-container">
        <EditCourseForm
          :course="course"
          @submit="handleFormSubmit"
          @cancel="handleCancel"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.edit-course-page {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md, 1rem);
  min-height: 100%;
  padding: var(--spacing-md, 1rem);
}

.page-header {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm, 0.5rem);
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--color-primary, #3b82f6);
  text-decoration: none;
  font-weight: 500;
  width: fit-content;
  padding: var(--spacing-xs, 0.25rem) 0;
  transition: all 0.2s ease;
}

.back-link:hover {
  color: var(--color-primary-dark, #2563eb);
  transform: translateX(-4px);
}

.back-arrow {
  font-size: 1.25rem;
}

.page-title {
  font-size: 2rem;
  font-weight: 700;
  color: var(--color-text, #1a1a1a);
  margin: 0;
  padding: var(--spacing-md, 1rem) 0 0 0;
}

.page-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg, 1.5rem);
}

.form-container {
  max-width: 700px;
  margin: 0 auto;
  width: 100%;
}

.loading-state {
  text-align: center;
  padding: var(--spacing-lg, 1.5rem);
  color: var(--color-text-secondary, #666);
  font-size: 1rem;
}

.error-state {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md, 1rem);
  align-items: center;
  padding: var(--spacing-lg, 1.5rem);
  background: #fee;
  border: 1px solid #fcc;
  border-radius: 8px;
  color: #c33;
  text-align: center;
}

.error-state p {
  margin: 0;
  font-size: 0.95rem;
}

.btn {
  display: inline-block;
  padding: var(--spacing-sm, 0.5rem) var(--spacing-md, 1rem);
  background: var(--color-primary, #3b82f6);
  color: white;
  text-decoration: none;
  border-radius: 6px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn:hover {
  background: var(--color-primary-dark, #2563eb);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.btn--primary {
  background: var(--color-primary, #3b82f6);
}

@media (max-width: 640px) {
  .edit-course-page {
    padding: var(--spacing-sm, 0.5rem);
  }

  .page-title {
    font-size: 1.5rem;
  }

  .form-container {
    max-width: 100%;
  }
}
</style>