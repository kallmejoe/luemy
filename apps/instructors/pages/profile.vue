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
  background: var(--color-background);
  min-height: 100vh;
  padding: var(--spacing-lg);
  display: grid;
  gap: var(--spacing-lg);
}
</style>
