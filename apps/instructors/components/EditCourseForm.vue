<template>
  <div class="edit-course-form">
    <form @submit.prevent="handleSubmit">
      <div class="form-group">
        <UiLabel for="course-name" class="form-label">Course Name</UiLabel>
        <UiInput
          id="course-name"
          v-model="formData.name"
          type="text"
          placeholder="Enter course name"
          required
          minlength="2"
          maxlength="255"
        />
      </div>

      <div class="form-group">
        <UiLabel for="course-description" class="form-label">Description</UiLabel>
        <UiTextarea
          id="course-description"
          v-model="formData.description"
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
          {{ isLoading ? "Saving..." : "Save Changes" }}
        </UiButton>
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
import UiButton from "@core/components/ui/Button.vue"
import UiInput from "@core/components/ui/Input.vue"
import UiLabel from "@core/components/ui/Label.vue"
import UiTextarea from "@core/components/ui/Textarea.vue"

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

const props = defineProps<Props>()
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
  () => props.course,
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
  background: var(--card);
  border-radius: 8px;
  padding: var(--spacing-lg);
  border: 1px solid var(--border);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
}

.form-label {
  font-weight: 600;
  color: var(--foreground);
  font-size: 0.95rem;
}

.form-input,
.form-textarea {
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--input);
  border-radius: 6px;
  font-family: var(--font-body);
  font-size: 0.95rem;
  color: var(--foreground);
  background: var(--card);
  transition: all 0.2s ease;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px color-mix(in oklab, var(--info), transparent 88%);
}

.form-textarea {
  resize: vertical;
  min-height: 120px;
}

.char-count {
  font-size: 0.85rem;
  color: var(--muted-foreground);
  margin: 0;
  text-align: right;
}

.checkbox-group {
  padding: var(--spacing-md);
  background: var(--accent);
  border-radius: 6px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  cursor: pointer;
  color: var(--foreground);
  font-weight: 500;
}

.checkbox-input {
  width: 20px;
  height: 20px;
  cursor: pointer;
  accent-color: var(--primary);
}

.form-actions {
  display: flex;
  gap: var(--spacing-md);
  justify-content: flex-end;
  margin-top: var(--spacing-lg);
}

.btn {
  padding: var(--spacing-sm) var(--spacing-md);
  border: none;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: var(--font-body);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn--primary {
  background: var(--primary);
  color: var(--card);
}

.btn--primary:hover:not(:disabled) {
  background: var(--color-primary-dark);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px color-mix(in oklab, var(--primary), transparent 70%);
}

.btn--secondary {
  background: var(--border);
  color: var(--foreground);
}

.btn--secondary:hover:not(:disabled) {
  background: var(--input);
}

.error-message {
  margin-top: var(--spacing-md);
  padding: var(--spacing-md);
  background: color-mix(in oklab, var(--destructive), var(--card) 90%);
  border: 1px solid color-mix(in oklab, var(--destructive), var(--border) 70%);
  border-radius: 6px;
  color: var(--destructive);
  font-size: 0.95rem;
}

.success-message {
  margin-top: var(--spacing-md);
  padding: var(--spacing-md);
  background: color-mix(in oklab, var(--success), var(--card) 90%);
  border: 1px solid color-mix(in oklab, var(--success), var(--border) 70%);
  border-radius: 6px;
  color: var(--success);
  font-size: 0.95rem;
}

@media (max-width: 640px) {
  .edit-course-form {
    padding: var(--spacing-md);
  }

  .form-actions {
    flex-direction: column-reverse;
  }

  .btn {
    width: 100%;
  }
}
</style>
