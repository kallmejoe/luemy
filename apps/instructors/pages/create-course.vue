<template>
  <div class="create-course-page">
    <div class="page-header">
      <button class="btn-back" @click="handleBack">← Back to Courses</button>
      <h1>Create New Course</h1>
      <p class="subtitle">Create a new course to teach your students</p>
    </div>

    <div class="form-container">
      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <UiLabel for="course-name" class="form-label">Course Name</UiLabel>
          <UiInput
            id="course-name"
            v-model="formData.name"
            type="text"
            placeholder="e.g., Introduction to Computer Science"
            required
            minlength="2"
            maxlength="255"
          />
        </div>

        <div class="form-group">
          <UiLabel for="course-description" class="form-label">Description (optional)</UiLabel>
          <UiTextarea
            id="course-description"
            v-model="formData.description"
            placeholder="Describe what students will learn in this course"
            rows="6"
            maxlength="1000"
          />
          <p class="char-count">{{ formData.description.length }}/1000</p>
        </div>

        <div class="form-group checkbox-group">
          <label class="checkbox-label">
            <input
              v-model="formData.active"
              type="checkbox"
              class="checkbox-input"
            >
            <span>Course is active</span>
          </label>
          <p class="checkbox-hint">Only active courses will appear to students</p>
        </div>

        <div class="form-actions">
          <UiButton
            :disabled="isLoading"
            type="button"
            variant="outline"
            @click="handleCancel"
          >
            Cancel
          </UiButton>
          <UiButton
            :disabled="isLoading"
            type="submit"
          >
            {{ isLoading ? "Creating..." : "Create Course" }}
          </UiButton>
        </div>

        <div v-if="error" class="error-message">
          {{ error }}
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue"
import { useRouter } from "vue-router"
import UiButton from "@core/components/ui/Button.vue"
import UiInput from "@core/components/ui/Input.vue"
import UiLabel from "@core/components/ui/Label.vue"
import UiTextarea from "@core/components/ui/Textarea.vue"

definePageMeta({
  middleware: ["auth"],
})

const router = useRouter()
const token = useCookie("token")

const formData = ref({
  name: "",
  description: "",
  active: true
})

const isLoading = ref(false)
const error = ref("")

const handleSubmit = async () => {
  error.value = ""

  // Validate inputs
  if (!formData.value.name.trim()) {
    error.value = "Course name is required"
    return
  }

  if (formData.value.name.trim().length < 2) {
    error.value = "Course name must be at least 2 characters"
    return
  }

  if (formData.value.description.length > 1000) {
    error.value = "Description cannot exceed 1000 characters"
    return
  }

  isLoading.value = true

  try {
    const res = await $fetch("/api/courses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token.value}`,
      },
      body: {
        name: formData.value.name.trim(),
        description: formData.value.description.trim(),
        active: formData.value.active
      }
    })

    if (res.success) {
      router.push("/courses")
    } else {
      error.value = res.message || "Failed to create course"
    }
  } catch (err) {
    error.value = "Failed to create course. Please try again."
    console.error("Form submission error:", err)
  } finally {
    isLoading.value = false
  }
}

const handleCancel = () => {
  router.push("/courses")
}

const handleBack = () => {
  router.push("/courses")
}
</script>

<style scoped>
.create-course-page {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  min-height: 100%;
}

.page-header {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.btn-back {
  align-self: flex-start;
  background: none;
  border: none;
  color: var(--primary);
  font-weight: 600;
  cursor: pointer;
  padding: 0;
  font-size: 0.95rem;
  transition: color 0.2s ease;
  margin-bottom: 0.5rem;
}

.btn-back:hover {
  color: color-mix(in oklab, var(--primary), black 15%);
}

.page-header h1 {
  margin: 0;
  font-size: 1.875rem;
  font-weight: 700;
  color: var(--color-text);
}

.subtitle {
  margin: 0;
  font-size: 0.95rem;
  color: var(--muted-foreground);
}

.form-container {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 2rem;
  max-width: 600px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.form-label {
  font-weight: 600;
  color: var(--color-text);
  font-size: 0.95rem;
}

.char-count {
  font-size: 0.85rem;
  color: var(--muted-foreground);
  margin: 0;
  text-align: right;
}

.checkbox-group {
  padding: 1rem;
  background: var(--accent);
  border-radius: 6px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  color: var(--color-text);
  font-weight: 500;
}

.checkbox-input {
  width: 20px;
  height: 20px;
  cursor: pointer;
  accent-color: var(--primary);
}

.checkbox-hint {
  margin: 0.5rem 0 0 0;
  font-size: 0.85rem;
  color: var(--muted-foreground);
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
}

.error-message {
  margin-top: 1rem;
  padding: 1rem;
  background: color-mix(in oklab, var(--destructive), var(--card) 90%);
  border: 1px solid color-mix(in oklab, var(--destructive), var(--border) 70%);
  border-radius: 6px;
  color: var(--destructive);
  font-size: 0.95rem;
}

@media (max-width: 640px) {
  .create-course-page {
    gap: 1rem;
  }

  .form-container {
    padding: 1rem;
  }

  .form-actions {
    flex-direction: column-reverse;
  }
}
</style>
