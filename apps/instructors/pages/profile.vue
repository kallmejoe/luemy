<template>
  <div class="profile-page">
    <ProfileForm />
    <div class="feedback-block">
      <FeedbackForm app="instructor" />
    </div>
  </div>
</template>

<script setup lang="ts">
import ProfileForm from '@core/components/ProfileForm.vue'
import FeedbackForm from '@core/components/FeedbackForm.vue'

definePageMeta({
  middleware: ['auth']
})
</script>

<style scoped>
.profile-page {
  background: var(--color-background);
  min-height: 100vh;
  padding: var(--spacing-lg);
  display: grid;
  gap: var(--spacing-lg);
}

.feedback-block {
  max-width: 56rem;
}
</style>
