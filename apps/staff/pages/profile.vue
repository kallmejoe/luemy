<template>
  <div class="profile-page">
    <ProfileForm />
  </div>
</template>

<script setup lang="ts">
import ProfileForm from '@core/components/ProfileForm.vue'

definePageMeta({
  middleware: ['auth']
})
</script>

<style scoped>
.profile-page {
  min-height: 100vh;
  padding: var(--spacing-lg);
  background: var(--color-background);
  display: grid;
  gap: var(--spacing-lg);
}

@media (max-width: 640px) {
  .profile-page {
    padding: var(--spacing-md);
  }
}
</style>
