<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { cn } from "@core/lib/utils"

const props = defineProps<{
  for?: string
  class?: HTMLAttributes["class"]
}>()
</script>

<template>
  <label
    data-slot="label"
    :for="props.for"
    :class="cn('ui-label', props.class)"
  >
    <slot />
  </label>
</template>

<style scoped>
.ui-label {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--foreground);
  font-size: 0.95rem;
  font-weight: 600;
  line-height: 1.2;
}
</style>
