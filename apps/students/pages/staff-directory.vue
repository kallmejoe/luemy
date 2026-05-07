<script setup lang="ts">
definePageMeta({
  middleware: ["auth"],
});

onMounted(() => {
  navigateTo("/dashboard");
});
</script>

<template>
  <div class="removed-page">Redirecting...</div>
</template>

<style scoped>
.removed-page {
  color: var(--muted-foreground);
}
</style>
