<template>
  <div class="edit-course-form">
    <form @submit.prevent="handleSubmit">
      <div class="form-group">
        <label for="course-name" class="form-label">Course Name</label>
        <input
          id="course-name"
          v-model="formData.name"
          type="text"
          class="form-input"
          placeholder="Enter course name"
          required
          minlength="2"
          maxlength="255"
        >
      </div>

      <div class="form-group">
        <label for="course-description" class="form-label">Description</label>
        <textarea
          id="course-description"
          v-model="formData.description"
          class="form-textarea"
          placeholder="Enter course description"
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
      </div>

      <div class="form-actions">
        <button
          :disabled="isLoading"
          type="button"
          class="btn btn--secondary"
          @click="handleCancel"
        >
          Cancel
        </button>
        <button
          :disabled="isLoading"
          type="submit"
          class="btn btn--primary"
        >
          {{ isLoading ? "Saving..." : "Save Changes" }}
        </button>
      </div>

      <div v-if="error" class="error-message">
        {{ error }}
      </div>
      <div v-if="success" class="success-message">
        {{ success }}
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue"

interface Course {
  id: number
  name: string
  description: string
  active: number
}

interface Props {
  course: Course
}

interface Emits {
  (e: "submit", data: { name: string; description: string; active: boolean }): void
  (e: "cancel"): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()

const formData = ref({
  name: "",
  description: "",
  active: true
})

const isLoading = ref(false)
const error = ref("")
const success = ref("")

watch(
  (props) => props.course,
  (newCourse) => {
    if (newCourse) {
      formData.value = {
        name: newCourse.name,
        description: newCourse.description || "",
        active: newCourse.active === 1
      }
    }
  },
  { immediate: true, deep: true }
)

const handleSubmit = async () => {
  error.value = ""
  success.value = ""

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
    emit("submit", {
      name: formData.value.name.trim(),
      description: formData.value.description.trim(),
      active: formData.value.active
    })
    success.value = "Course updated successfully!"
    setTimeout(() => {
      success.value = ""
    }, 3000)
  } catch (err) {
    error.value = "Failed to update course. Please try again."
    console.error("Form submission error:", err)
  } finally {
    isLoading.value = false
  }
}

const handleCancel = () => {
  emit("cancel")
}
</script>

<style scoped>
.edit-course-form {
  background: var(--color-surface, white);
  border-radius: 8px;
  padding: var(--spacing-lg, 1.5rem);
  border: 1px solid var(--color-border, #e0e0e0);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm, 0.5rem);
  margin-bottom: var(--spacing-md, 1rem);
}

.form-label {
  font-weight: 600;
  color: var(--color-text, #1a1a1a);
  font-size: 0.95rem;
}

.form-input,
.form-textarea {
  padding: var(--spacing-sm, 0.5rem) var(--spacing-md, 1rem);
  border: 1px solid var(--color-border, #d0d0d0);
  border-radius: 6px;
  font-family: var(--font-body, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto);
  font-size: 0.95rem;
  color: var(--color-text, #1a1a1a);
  background: var(--color-base, #ffffff);
  transition: all 0.2s ease;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: var(--color-primary, #3b82f6);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-textarea {
  resize: vertical;
  min-height: 120px;
}

.char-count {
  font-size: 0.85rem;
  color: var(--color-text-secondary, #666);
  margin: 0;
  text-align: right;
}

.checkbox-group {
  padding: var(--spacing-md, 1rem);
  background: var(--color-hover, #f9fafb);
  border-radius: 6px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm, 0.5rem);
  cursor: pointer;
  color: var(--color-text, #1a1a1a);
  font-weight: 500;
}

.checkbox-input {
  width: 20px;
  height: 20px;
  cursor: pointer;
  accent-color: var(--color-primary, #3b82f6);
}

.form-actions {
  display: flex;
  gap: var(--spacing-md, 1rem);
  justify-content: flex-end;
  margin-top: var(--spacing-lg, 1.5rem);
}

.btn {
  padding: var(--spacing-sm, 0.5rem) var(--spacing-md, 1rem);
  border: none;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: var(--font-body, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn--primary {
  background: var(--color-primary, #3b82f6);
  color: white;
}

.btn--primary:hover:not(:disabled) {
  background: var(--color-primary-dark, #2563eb);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.btn--secondary {
  background: var(--color-border, #e0e0e0);
  color: var(--color-text, #1a1a1a);
}

.btn--secondary:hover:not(:disabled) {
  background: var(--color-border-hover, #d0d0d0);
}

.error-message {
  margin-top: var(--spacing-md, 1rem);
  padding: var(--spacing-md, 1rem);
  background: #fee;
  border: 1px solid #fcc;
  border-radius: 6px;
  color: #c33;
  font-size: 0.95rem;
}

.success-message {
  margin-top: var(--spacing-md, 1rem);
  padding: var(--spacing-md, 1rem);
  background: #efe;
  border: 1px solid #cfc;
  border-radius: 6px;
  color: #3c3;
  font-size: 0.95rem;
}

@media (max-width: 640px) {
  .edit-course-form {
    padding: var(--spacing-md, 1rem);
  }

  .form-actions {
    flex-direction: column-reverse;
  }

  .btn {
    width: 100%;
  }
}
</style>
