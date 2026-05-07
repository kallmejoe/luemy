<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
const { initializeTheme } = useTheme()

onMounted(() => {
  initializeTheme()
})
</script>

