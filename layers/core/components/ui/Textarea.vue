<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { useVModel } from "@vueuse/core"
import { cn } from "@core/lib/utils"

const props = defineProps<{
  defaultValue?: string
  modelValue?: string
  class?: HTMLAttributes["class"]
}>()

const emits = defineEmits<{
  (e: "update:modelValue", payload: string): void
}>()

const modelValue = useVModel(props, "modelValue", emits, {
  passive: true,
  defaultValue: props.defaultValue,
})
</script>

<template>
  <textarea
    v-model="modelValue"
    data-slot="textarea"
    :class="cn('ui-textarea', props.class)"
  />
</template>

<style scoped>
.ui-textarea {
  width: 100%;
  min-height: 7rem;
  padding: 0.65rem 0.75rem;
  border: 1px solid var(--input);
  border-radius: calc(var(--radius) - 2px);
  background: var(--card);
  color: var(--foreground);
  font-size: 0.875rem;
  line-height: 1.55;
  box-shadow: var(--shadow-sm);
  resize: vertical;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.ui-textarea::placeholder {
  color: var(--muted-foreground);
}

.ui-textarea:focus {
  outline: 2px solid var(--ring);
  outline-offset: 2px;
  border-color: var(--ring);
}

.ui-textarea:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
