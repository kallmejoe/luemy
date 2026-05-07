<script setup lang="ts">
import {
  Info,
  Users,
  Upload,
  Check,
  Minus,
  BookOpen,
  GraduationCap,
  FileText,
  Plus,
  ChevronLeft,
  Eye,
  Clock,
  ClipboardList,
  ScrollText,
  X,
} from "lucide-vue-next"

const props = defineProps<{ name: string; size?: number }>()

const iconComponents = {
  info: Info,
  users: Users,
  upload: Upload,
  check: Check,
  dash: Minus,
  book: BookOpen,
  course: GraduationCap,
  document: FileText,
  plus: Plus,
  arrowleft: ChevronLeft,
  eye: Eye,
  clock: Clock,
  assignment: ClipboardList,
  list: ScrollText,
  close: X,
}

const icon = computed(() => iconComponents[props.name] || Minus)
</script>

<template>
  <component :is="icon" :size="props.size || 16" :stroke-width="1.75" />
</template>
