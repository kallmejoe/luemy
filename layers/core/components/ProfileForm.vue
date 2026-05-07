<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useUser } from '@core/composables/useUser'
import { useAuth } from '@core/composables/useAuth'
import UiAlert from '@core/components/ui/alert/Alert.vue'
import UiAlertDescription from '@core/components/ui/alert/AlertDescription.vue'
import UiButton from '@core/components/ui/Button.vue'
import UiInput from '@core/components/ui/Input.vue'
import UiLabel from '@core/components/ui/Label.vue'

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
const { refreshUser, token } = useAuth()

const isEditing = ref(false)
const isLoading = ref(false)
const generalError = ref('')
const successMessage = ref('')

const formData = ref<FormData>({
  name: '',
  email: '',
  currentPassword: '',
  newPassword: ''
})

const errors = ref<Errors>({})

// Watch user changes and update form
watch(
  () => user.value,
  (newUser) => {
    if (newUser && !isEditing.value) {
      formData.value.name = newUser.name
      formData.value.email = newUser.email
    }
  },
  { deep: true }
)

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

function validateName(nameValue: string): string | null {
  const trimmed = nameValue.trim()
  if (!trimmed) return 'Name is required'
  if (trimmed.length < 2) return 'Name must be at least 2 characters'
  if (trimmed.length > 100) return 'Name must not exceed 100 characters'
  if (!/^[a-zA-Z\s'-]+$/.test(trimmed)) {
    return 'Name can only contain letters, spaces, hyphens, or apostrophes'
  }
  return null
}

function validateEmail(emailValue: string): string | null {
  const trimmed = emailValue.trim()
  if (!trimmed) return 'Email is required'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return 'Invalid email format'
  }
  return null
}

function validatePassword(newPwd: string, currentPwd: string): { newPwd: string | null; currentPwd: string | null } {
  const result = { newPwd: null as string | null, currentPwd: null as string | null }

  if (newPwd) {
    if (!currentPwd) {
      result.currentPwd = 'Current password is required to set a new password'
    }
    if (newPwd.length < 8) {
      result.newPwd = 'Password must be at least 8 characters'
    }
  }

  return result
}

function clearErrors(): void {
  errors.value = {}
}

function validateForm(): boolean {
  clearErrors()

  // Validate name
  const nameError = validateName(formData.value.name)
  if (nameError) {
    errors.value.name = nameError
  }

  // Validate email
  const emailError = validateEmail(formData.value.email)
  if (emailError) {
    errors.value.email = emailError
  }

  // Validate passwords if user is changing password
  if (formData.value.newPassword || formData.value.currentPassword) {
    const pwdErrors = validatePassword(formData.value.newPassword, formData.value.currentPassword)
    if (pwdErrors.newPwd) errors.value.newPassword = pwdErrors.newPwd
    if (pwdErrors.currentPwd) errors.value.currentPassword = pwdErrors.currentPwd
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
    clearErrors()
    generalError.value = ''
    successMessage.value = ''
  } else {
    // Initialize form with current user data when opening
    formData.value = {
      name: user.value?.name || '',
      email: user.value?.email || '',
      currentPassword: '',
      newPassword: ''
    }
  }
  isEditing.value = !isEditing.value
}

async function handleSubmit(): Promise<void> {
  generalError.value = ''
  successMessage.value = ''

  if (!validateForm()) {
    generalError.value = 'Please fix the errors above'
    return
  }

  isLoading.value = true

  try {
    const response = await $fetch('/api/user', {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token.value}`
      },
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
      clearErrors()

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

<template>
  <div class="profile-container">
    <!-- View Mode -->
    <div v-if="!isEditing" class="view-mode">
      <div class="profile-header">
        <div class="avatar">{{ initials }}</div>
        <div class="header-content">
          <h1>{{ user?.name }}</h1>
          <p class="email">{{ user?.email }}</p>
        </div>
        <UiButton @click="toggleEdit">Edit Profile</UiButton>
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
      </div>

      <form class="form" @submit.prevent="handleSubmit">
        <!-- Error Alert -->
        <UiAlert v-if="generalError" variant="destructive">
          <UiAlertDescription>{{ generalError }}</UiAlertDescription>
        </UiAlert>

        <!-- Success Alert -->
        <UiAlert v-if="successMessage" variant="default">
          <UiAlertDescription>{{ successMessage }}</UiAlertDescription>
        </UiAlert>

        <!-- Name Field -->
        <div class="field">
          <UiLabel for="name">Name</UiLabel>
          <UiInput
            id="name"
            v-model="formData.name"
            type="text"
            placeholder="Enter your full name"
            required
          />
          <span v-if="errors.name" class="error-text">{{ errors.name }}</span>
          <span v-else class="hint-text">2-100 characters, letters, spaces, hyphens, or apostrophes only</span>
        </div>

        <!-- Email Field -->
        <div class="field">
          <UiLabel for="email">Email</UiLabel>
          <UiInput
            id="email"
            v-model="formData.email"
            type="email"
            placeholder="Enter your email"
            required
          />
          <span v-if="errors.email" class="error-text">{{ errors.email }}</span>
          <span v-else class="hint-text">We'll send updates to this address</span>
        </div>

        <!-- Password Section -->
        <div class="password-section">
          <h3>Change Password</h3>
          <p class="section-hint">Leave blank if you don't want to change your password</p>

          <!-- Current Password -->
          <div class="field">
            <UiLabel for="currentPassword">Current Password</UiLabel>
            <UiInput
              id="currentPassword"
              v-model="formData.currentPassword"
              type="password"
              placeholder="Enter current password"
            />
            <span v-if="errors.currentPassword" class="error-text">{{ errors.currentPassword }}</span>
          </div>

          <!-- New Password -->
          <div class="field">
            <UiLabel for="newPassword">New Password</UiLabel>
            <UiInput
              id="newPassword"
              v-model="formData.newPassword"
              type="password"
              placeholder="Enter new password"
            />
            <span v-if="errors.newPassword" class="error-text">{{ errors.newPassword }}</span>
            <span v-else class="hint-text">Minimum 8 characters</span>
          </div>

          <!-- Password Strength Indicator -->
          <div v-if="formData.newPassword" class="password-strength">
            <div class="strength-bar">
              <div
                class="strength-fill"
                :style="{ width: passwordStrength + '%' }"
              />
            </div>
            <span class="strength-text">{{ passwordStrengthText }}</span>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="form-actions">
          <UiButton
            :disabled="isLoading"
            type="button"
            variant="outline"
            @click="toggleEdit"
          >
            Cancel
          </UiButton>
          <UiButton
            type="submit"
            :disabled="isLoading"
          >
            <span v-if="!isLoading">Save Changes</span>
            <span v-else>Saving...</span>
          </UiButton>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.profile-container {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
}

/* View Mode */
.view-mode {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
}

.avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: var(--primary);
  color: var(--primary-foreground);
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
  margin: 0 0 0.25rem 0;
  font-size: 1.875rem;
  font-weight: 700;
}

.header-content .email {
  margin: 0;
  font-size: 0.875rem;
  color: var(--muted-foreground);
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.info-card {
  padding: 1rem;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
}

.info-card label {
  display: block;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--muted-foreground);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 0.5rem;
}

.info-card p {
  margin: 0;
  font-size: 1rem;
  word-break: break-word;
}

.role-badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: capitalize;
}

.role-student {
  background: color-mix(in oklab, var(--info), transparent 88%);
  color: var(--info);
}

.role-professor {
  background: color-mix(in oklab, var(--chart-5), transparent 88%);
  color: var(--chart-5);
}

.role-admin {
  background: color-mix(in oklab, var(--destructive), transparent 88%);
  color: var(--destructive);
}

/* Edit Mode */
.edit-mode {
  padding: 1.5rem;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
}

.edit-header {
  margin-bottom: 1.5rem;
  border-bottom: 1px solid var(--border);
  padding-bottom: 1rem;
}

.edit-header h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
}

/* Form */
.form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.field input {
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--input);
  border-radius: var(--radius);
  background: var(--background);
  color: var(--foreground);
  font-size: 0.875rem;
}

.error-text {
  font-size: 0.75rem;
  color: var(--destructive);
  font-weight: 500;
}

.hint-text {
  font-size: 0.75rem;
  color: var(--muted-foreground);
}

/* Password Section */
.password-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
  background: var(--background);
  border: 1px solid var(--border);
  border-radius: var(--radius);
}

.password-section h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
}

.section-hint {
  margin: 0;
  font-size: 0.75rem;
  color: var(--muted-foreground);
}

/* Password Strength */
.password-strength {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.5rem;
  background: var(--card);
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
  background: linear-gradient(90deg, var(--destructive), var(--warning), var(--warning), var(--success));
}

.strength-text {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--muted-foreground);
}

/* Form Actions */
.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  padding-top: 1rem;
  border-top: 1px solid var(--border);
}

.form-actions button {
  min-width: 120px;
}

/* Responsive */
@media (max-width: 640px) {
  .profile-header {
    flex-direction: column;
    text-align: center;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  .form-actions {
    flex-direction: column;
  }

  .form-actions button {
    width: 100%;
  }

  .edit-mode {
    padding: 1rem;
  }

  .password-section {
    padding: 0.75rem;
  }
}
</style>
