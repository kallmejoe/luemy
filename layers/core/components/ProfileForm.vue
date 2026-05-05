<template>
  <div class="profile-form">
    <form @submit.prevent="handleSubmit">
      <!-- Display Mode -->
      <div v-if="!isEditing" class="view-mode">
        <div class="profile-header">
          <div class="avatar">{{ initials }}</div>
          <div class="header-content">
            <h1>{{ user?.name }}</h1>
            <p class="email">{{ user?.email }}</p>
          </div>
          <button
            type="button"
            class="btn btn-primary"
            @click="toggleEdit"
          >
            Edit Profile
          </button>
        </div>

        <div class="info-grid">
          <div class="info-card">
            <label>Name</label>
            <p>{{ user?.name }}</p>
          </div>
          <div class="info-card">
            <label>Email</label>
            <p>{{ user?.email }}</p>
          </div>
          <div class="info-card">
            <label>Role</label>
            <p class="role-badge" :class="`role-${user?.role}`">{{ formatRole(user?.role) }}</p>
          </div>
          <div class="info-card">
            <label>User ID</label>
            <p>#{{ user?.id }}</p>
          </div>
        </div>
      </div>

      <!-- Edit Mode -->
      <div v-else class="edit-mode">
        <div class="edit-header">
          <h2>Edit Profile</h2>
          <button
            type="button"
            class="btn-close"
            aria-label="Close"
            @click="toggleEdit"
          >
            ✕
          </button>
        </div>

        <!-- Name Field -->
        <div class="form-group">
          <label for="name">Name</label>
          <input
            id="name"
            v-model="formData.name"
            type="text"
            placeholder="Enter your full name"
            required
            minlength="2"
            maxlength="100"
            @blur="validateField('name')"
          >
          <span v-if="errors.name" class="error-message">{{ errors.name }}</span>
          <span v-else class="hint-text">2-100 characters, letters, spaces, hyphens, or apostrophes only</span>
        </div>

        <!-- Email Field -->
        <div class="form-group">
          <label for="email">Email</label>
          <input
            id="email"
            v-model="formData.email"
            type="email"
            placeholder="Enter your email"
            required
            @blur="validateField('email')"
          >
          <span v-if="errors.email" class="error-message">{{ errors.email }}</span>
          <span v-else class="hint-text">We'll send updates to this address</span>
        </div>

        <!-- Password Section -->
        <div class="form-section">
          <h3>Change Password</h3>
          <p class="section-hint">Leave blank if you don't want to change your password</p>

          <!-- Current Password -->
          <div class="form-group">
            <label for="currentPassword">Current Password</label>
            <input
              id="currentPassword"
              v-model="formData.currentPassword"
              type="password"
              placeholder="Enter current password"
              @blur="validateField('currentPassword')"
            >
            <span v-if="errors.currentPassword" class="error-message">{{ errors.currentPassword }}</span>
          </div>

          <!-- New Password -->
          <div class="form-group">
            <label for="newPassword">New Password</label>
            <input
              id="newPassword"
              v-model="formData.newPassword"
              type="password"
              placeholder="Enter new password"
              @blur="validateField('newPassword')"
            >
            <span v-if="errors.newPassword" class="error-message">{{ errors.newPassword }}</span>
            <span v-else class="hint-text">Minimum 8 characters</span>
          </div>

          <!-- Password Strength Indicator -->
          <div v-if="formData.newPassword" class="password-strength">
            <div class="strength-bar">
              <div 
                class="strength-fill" 
                :style="{ width: passwordStrength + '%', backgroundColor: getPasswordStrengthColor() }"
              />
            </div>
            <span class="strength-text">{{ passwordStrengthText }}</span>
          </div>
        </div>

        <!-- Error Messages -->
        <div v-if="generalError" class="error-alert">
          <span>{{ generalError }}</span>
        </div>

        <!-- Success Message -->
        <div v-if="successMessage" class="success-alert">
          <span>{{ successMessage }}</span>
        </div>

        <!-- Action Buttons -->
        <div class="form-actions">
          <button
            type="button"
            class="btn btn-secondary"
            :disabled="isLoading"
            @click="toggleEdit"
          >
            Cancel
          </button>
          <button
            type="submit"
            class="btn btn-primary"
            :disabled="isLoading"
          >
            <span v-if="!isLoading">Save Changes</span>
            <span v-else>Saving...</span>
          </button>
        </div>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useUser } from '@core/composables/useUser'
import { useAuth } from '@core/composables/useAuth'

interface FormData {
  name: string
  email: string
  currentPassword: string
  newPassword: string
}

interface Errors {
  name?: string
  email?: string
  currentPassword?: string
  newPassword?: string
}

const user = useUser()
const { refreshUser } = useAuth()

const isEditing = ref(false)
const isLoading = ref(false)
const generalError = ref('')
const successMessage = ref('')

const formData = ref<FormData>({
  name: user.value?.name || '',
  email: user.value?.email || '',
  currentPassword: '',
  newPassword: ''
})

const errors = ref<Errors>({})

const initials = computed(() => {
  if (!user.value?.name) return '?'
  return user.value.name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
})

const passwordStrength = computed(() => {
  const pwd = formData.value.newPassword
  if (!pwd) return 0
  let strength = 0
  if (pwd.length >= 8) strength += 25
  if (pwd.length >= 12) strength += 25
  if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) strength += 25
  if (/[0-9]/.test(pwd) || /[^a-zA-Z0-9]/.test(pwd)) strength += 25
  return strength
})

const passwordStrengthText = computed(() => {
  if (passwordStrength.value <= 25) return 'Weak'
  if (passwordStrength.value <= 50) return 'Fair'
  if (passwordStrength.value <= 75) return 'Good'
  return 'Strong'
})

function formatRole(role: string | undefined): string {
  if (!role) return 'Unknown'
  return role.charAt(0).toUpperCase() + role.slice(1)
}

function getPasswordStrengthColor(): string {
  if (passwordStrength.value <= 25) return '#ef4444'
  if (passwordStrength.value <= 50) return '#f97316'
  if (passwordStrength.value <= 75) return '#eab308'
  return '#22c55e'
}

function validateField(field: keyof Errors & keyof FormData): void {
  errors.value[field] = undefined

  if (field === 'name') {
    const nameValue = formData.value.name.trim()
    if (!nameValue) {
      errors.value.name = 'Name is required'
    } else if (nameValue.length < 2) {
      errors.value.name = 'Name must be at least 2 characters'
    } else if (nameValue.length > 100) {
      errors.value.name = 'Name must not exceed 100 characters'
    } else if (!/^[a-zA-Z\s'-]+$/.test(nameValue)) {
      errors.value.name = 'Name can only contain letters, spaces, hyphens, or apostrophes'
    }
  } else if (field === 'email') {
    const emailValue = formData.value.email.trim()
    if (!emailValue) {
      errors.value.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
      errors.value.email = 'Invalid email format'
    }
  } else if (field === 'newPassword') {
    const newPwd = formData.value.newPassword
    const currentPwd = formData.value.currentPassword
    if (newPwd && !currentPwd) {
      errors.value.newPassword = 'Current password is required to set a new password'
    } else if (newPwd && newPwd.length < 8) {
      errors.value.newPassword = 'Password must be at least 8 characters'
    }
  } else if (field === 'currentPassword') {
    const currentPwd = formData.value.currentPassword
    const newPwd = formData.value.newPassword
    if (newPwd && !currentPwd) {
      errors.value.currentPassword = 'Current password is required'
    }
  }
}

function validateAllFields(): boolean {
  validateField('name')
  validateField('email')
  if (formData.value.newPassword) {
    validateField('currentPassword')
    validateField('newPassword')
  }
  return Object.keys(errors.value).length === 0
}

function toggleEdit(): void {
  if (isEditing.value) {
    // Reset form when closing
    formData.value = {
      name: user.value?.name || '',
      email: user.value?.email || '',
      currentPassword: '',
      newPassword: ''
    }
    errors.value = {}
    generalError.value = ''
    successMessage.value = ''
  }
  isEditing.value = !isEditing.value
}

async function handleSubmit(): Promise<void> {
  if (!validateAllFields()) {
    generalError.value = 'Please fix the errors above'
    return
  }

  isLoading.value = true
  generalError.value = ''
  successMessage.value = ''

  try {
    const response = await $fetch('/api/user', {
      method: 'PUT',
      body: {
        name: formData.value.name.trim(),
        email: formData.value.email.trim(),
        currentPassword: formData.value.currentPassword || undefined,
        newPassword: formData.value.newPassword || undefined
      }
    })

    if (response.success) {
      successMessage.value = response.message || 'Profile updated successfully'
      
      // Refresh user data
      await refreshUser()
      
      // Reset form
      formData.value = {
        name: user.value?.name || '',
        email: user.value?.email || '',
        currentPassword: '',
        newPassword: ''
      }
      
      // Close edit mode after 2 seconds
      setTimeout(() => {
        isEditing.value = false
        successMessage.value = ''
      }, 2000)
    } else {
      generalError.value = response.message || 'Failed to update profile'
    }
  } catch (error) {
    interface ErrorResponse {
      data?: {
        message?: string
      }
      message?: string
    }
    const err = error as ErrorResponse
    const message = err?.data?.message || err?.message || 'An error occurred'
    generalError.value = message
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.profile-form {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
}

form {
  display: flex;
  flex-direction: column;
}

/* View Mode */
.view-mode {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.profile-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-lg);
  background: var(--color-base);
  border: 1px solid var(--border);
  border-radius: var(--radius);
}

.avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: var(--color-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.875rem;
  font-weight: bold;
  flex-shrink: 0;
}

.header-content {
  flex: 1;
  min-width: 0;
}

.header-content h1 {
  margin: 0 0 var(--spacing-xs) 0;
  font-size: 1.875rem;
  font-weight: 700;
  color: var(--color-text);
}

.header-content .email {
  margin: 0;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--spacing-md);
}

.info-card {
  padding: var(--spacing-md);
  background: var(--color-base);
  border: 1px solid var(--border);
  border-radius: var(--radius);
}

.info-card label {
  display: block;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: var(--spacing-xs);
}

.info-card p {
  margin: 0;
  font-size: 1rem;
  color: var(--color-text);
  word-break: break-word;
}

.role-badge {
  display: inline-block;
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: capitalize;
}

.role-student {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}

.role-professor {
  background: rgba(139, 92, 246, 0.1);
  color: #8b5cf6;
}

.role-admin {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

/* Edit Mode */
.edit-mode {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  padding: var(--spacing-lg);
  background: var(--color-base);
  border: 1px solid var(--border);
  border-radius: var(--radius);
}

.edit-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-md);
  border-bottom: 1px solid var(--border);
  padding-bottom: var(--spacing-md);
}

.edit-header h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text);
}

.btn-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: var(--color-text-secondary);
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: var(--radius);
  transition: background-color 0.2s, color 0.2s;
}

.btn-close:hover {
  background: var(--color-accent);
  color: var(--color-text);
}

/* Form Groups */
.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.form-group label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text);
}

.form-group input {
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--color-background);
  color: var(--color-text);
  font-size: 0.875rem;
  font-family: inherit;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.form-group input::placeholder {
  color: var(--color-text-secondary);
}

.form-group input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-group input:disabled {
  background: var(--color-disabled);
  cursor: not-allowed;
}

.error-message {
  font-size: 0.75rem;
  color: #ef4444;
  font-weight: 500;
}

.hint-text {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
}

/* Form Section */
.form-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background: var(--color-background);
  border: 1px solid var(--border);
  border-radius: var(--radius);
}

.form-section h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text);
}

.section-hint {
  margin: 0;
  font-size: 0.75rem;
  color: var(--color-text-secondary);
}

/* Password Strength */
.password-strength {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm);
  background: var(--color-base);
  border-radius: var(--radius);
}

.strength-bar {
  width: 100%;
  height: 4px;
  background: var(--border);
  border-radius: 9999px;
  overflow: hidden;
}

.strength-fill {
  height: 100%;
  transition: width 0.3s, background-color 0.3s;
}

.strength-text {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--color-text-secondary);
}

/* Alerts */
.error-alert,
.success-alert {
  padding: var(--spacing-md);
  border-radius: var(--radius);
  font-size: 0.875rem;
  font-weight: 500;
}

.error-alert {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.2);
}

.success-alert {
  background: rgba(34, 197, 94, 0.1);
  color: #22c55e;
  border: 1px solid rgba(34, 197, 94, 0.2);
}

/* Buttons */
.btn {
  padding: var(--spacing-sm) var(--spacing-md);
  border: none;
  border-radius: var(--radius);
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s, color 0.2s;
  font-family: inherit;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: var(--color-primary);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: var(--color-primary-dark, #2563eb);
}

.btn-secondary {
  background: var(--color-secondary);
  color: var(--color-text);
}

.btn-secondary:hover:not(:disabled) {
  background: var(--color-secondary-hover);
}

/* Form Actions */
.form-actions {
  display: flex;
  gap: var(--spacing-md);
  justify-content: flex-end;
  padding-top: var(--spacing-md);
  border-top: 1px solid var(--border);
}

.form-actions .btn {
  min-width: 120px;
}

/* Responsive */
@media (max-width: 640px) {
  .profile-header {
    flex-direction: column;
    text-align: center;
  }

  .profile-header .btn {
    width: 100%;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  .form-actions {
    flex-direction: column;
  }

  .form-actions .btn {
    width: 100%;
  }

  .edit-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-md);
  }

  .btn-close {
    align-self: flex-end;
  }
}
</style>
