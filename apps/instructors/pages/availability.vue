<template>
  <div class="availability-page">
    <AvailabilityMonthlyCalendar />
  </div>
</template>

<script setup lang="ts">
 
definePageMeta({
  middleware: ["auth"],
})
</script>

<style scoped>
.availability-page {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-height: 100%;
  padding: 0;
}
</style>
