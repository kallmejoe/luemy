<script setup lang="ts">
import AppShell from '@core/components/AppShell.vue'

const navItems = useNavItems()
</script>

<template>
  <AppShell :nav-items="navItems" portal-name="Student portal" feedback-source="student">
    <slot />
  </AppShell>
</template>
