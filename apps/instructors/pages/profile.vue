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
}
</style>
