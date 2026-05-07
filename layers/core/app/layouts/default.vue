<script setup lang="ts">
import AppShell from '@core/components/AppShell.vue'

const navItems = useNavItems()
</script>

<template>
  <AppShell :nav-items="navItems">
    <slot />
  </AppShell>
</template>
