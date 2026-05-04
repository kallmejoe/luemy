<template>
  <div class="submission-form">
    <form @submit.prevent="handleSubmit">
      <div class="form-group">
        <label for="submission-content" class="form-label">Submit Your Work</label>
        <textarea
          id="submission-content"
          v-model="content"
          class="form-textarea"
          placeholder="Enter your assignment text here..."
          rows="8"
          :disabled="isSubmitting"
        />
        <p class="form-hint">You can paste text or type directly into this field.</p>
      </div>

      <div class="form-actions">
        <button
          type="submit"
          class="btn btn-primary"
          :disabled="!content.trim() || isSubmitting"
        >
          {{ isSubmitting ? 'Submitting...' : 'Submit Assignment' }}
        </button>
        <button
          type="button"
          class="btn btn-secondary"
          @click="handleClear"
          :disabled="isSubmitting"
        >
          Clear
        </button>
      </div>

      <div v-if="successMessage" class="message message-success">
        {{ successMessage }}
      </div>
      <div v-if="errorMessage" class="message message-error">
        {{ errorMessage }}
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAuth } from '@core/composables/useAuth'

interface Props {
  assignmentId: number
}

withDefaults(defineProps<Props>(), {})

const emit = defineEmits<{
  submitted: [value: { success: boolean; message: string }]
}>()

const { token } = useAuth()
const content = ref('')
const isSubmitting = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

const handleSubmit = async () => {
  if (!content.value.trim()) {
    errorMessage.value = 'Please enter your assignment content'
    return
  }

  isSubmitting.value = true
  successMessage.value = ''
  errorMessage.value = ''

  try {
    const res = await $fetch('/api/assignments/submit', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token.value}`
      },
      body: {
        assignmentId: props.assignmentId,
        content: content.value
      }
    })

    if (res.success) {
      successMessage.value = res.message || 'Assignment submitted successfully!'
      content.value = ''
      emit('submitted', { success: true, message: successMessage.value })
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        successMessage.value = ''
      }, 3000)
    } else {
      errorMessage.value = res.message || 'Failed to submit assignment'
      emit('submitted', { success: false, message: errorMessage.value })
    }
  } catch (error) {
    console.error('Submission error:', error)
    errorMessage.value = error instanceof Error ? error.message : 'An error occurred while submitting'
    emit('submitted', { success: false, message: errorMessage.value })
  } finally {
    isSubmitting.value = false
  }
}

const handleClear = () => {
  content.value = ''
  successMessage.value = ''
  errorMessage.value = ''
}

const props = defineProps<Props>()
</script>

<style scoped>
.submission-form {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: var(--spacing-lg);
}

.form-group {
  margin-bottom: var(--spacing-lg);
}

.form-label {
  display: block;
  margin-bottom: var(--spacing-sm);
  font-weight: 600;
  color: var(--foreground);
  font-size: 0.95rem;
}

.form-textarea {
  width: 100%;
  padding: var(--spacing-md);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--background);
  color: var(--foreground);
  font-family: var(--font-mono);
  font-size: 0.875rem;
  line-height: 1.5;
  resize: vertical;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.form-textarea:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(var(--primary-rgb), 0.1);
}

.form-textarea:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.form-hint {
  margin: var(--spacing-sm) 0 0;
  font-size: 0.8rem;
  color: var(--muted-foreground);
}

.form-actions {
  display: flex;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

.btn {
  padding: var(--spacing-sm) var(--spacing-lg);
  border: none;
  border-radius: var(--radius);
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: var(--primary);
  color: var(--primary-foreground);
}

.btn-primary:hover:not(:disabled) {
  opacity: 0.9;
}

.btn-secondary {
  background: var(--secondary);
  color: var(--secondary-foreground);
}

.btn-secondary:hover:not(:disabled) {
  opacity: 0.8;
}

.message {
  padding: var(--spacing-md);
  border-radius: var(--radius);
  font-size: 0.95rem;
  margin-bottom: var(--spacing-md);
}

.message-success {
  background: rgba(34, 197, 94, 0.1);
  color: hsl(142, 72%, 29%);
  border: 1px solid rgba(34, 197, 94, 0.2);
}

.message-error {
  background: rgba(239, 68, 68, 0.1);
  color: hsl(0, 84%, 40%);
  border: 1px solid rgba(239, 68, 68, 0.2);
}
</style>
