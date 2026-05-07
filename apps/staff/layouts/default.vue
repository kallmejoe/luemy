<script setup lang="ts">
import AppShell from '@core/components/AppShell.vue'

const navItems = useNavItems()
</script>

<template>
  <AppShell :nav-items="navItems" portal-name="Staff portal" feedback-source="staff">
    <slot />
  </AppShell>
</template>
