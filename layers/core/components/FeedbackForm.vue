<script setup lang="ts">
import { computed, ref } from "vue";
import { useRoute } from "vue-router";
import { useAuth } from "@core/composables/useAuth";
import UiAlert from "@core/components/ui/alert/Alert.vue";
import UiAlertDescription from "@core/components/ui/alert/AlertDescription.vue";
import UiButton from "@core/components/ui/Button.vue";
import UiInput from "@core/components/ui/Input.vue";
import UiLabel from "@core/components/ui/Label.vue";
import UiTextarea from "@core/components/ui/Textarea.vue";

type AppSource = "student" | "staff" | "instructor";

interface Props {
  app: AppSource;
  title?: string;
  submitLabel?: string;
}

const props = withDefaults(defineProps<Props>(), {
  title: "Report a bug",
  submitLabel: "Send report"
});

const emit = defineEmits<{
  (e: "submitted", payload: { id: number | string | bigint; app: AppSource }): void;
}>();

const route = useRoute();
const { token } = useAuth();

const subject = ref("");
const details = ref("");
const loading = ref(false);
const successMessage = ref("");
const errorMessage = ref("");

const appLabel = computed(() => {
  if (props.app === "staff") return "Staff";
  if (props.app === "instructor") return "Instructor";
  return "Student";
});

function validate(): boolean {
  errorMessage.value = "";

  if (!subject.value.trim()) {
    errorMessage.value = "Please enter a short subject.";
    return false;
  }

  if (!details.value.trim()) {
    errorMessage.value = "Please describe the bug details.";
    return false;
  }

  return true;
}

async function handleSubmit() {
  successMessage.value = "";
  errorMessage.value = "";

  if (!validate()) return;

  if (!token.value) {
    errorMessage.value = "You must be logged in to submit feedback.";
    return;
  }

  loading.value = true;

  try {
    const response = await $fetch<{ success: boolean; message?: string; id?: number | string | bigint }>("/api/feedback", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token.value}`
      },
      body: {
        app: props.app,
        subject: subject.value.trim(),
        details: details.value.trim(),
        pagePath: route.path
      }
    });

    if (!response.success) {
      errorMessage.value = response.message || "Failed to submit feedback.";
      return;
    }

    successMessage.value = response.message || "Feedback submitted successfully.";
    subject.value = "";
    details.value = "";

    if (response.id !== undefined) {
      emit("submitted", { id: response.id, app: props.app });
    }
  } catch (error: unknown) {
    const err = error as { data?: { message?: string }; message?: string };
    errorMessage.value = err?.data?.message || err?.message || "Failed to submit feedback.";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <form class="feedback-form" @submit.prevent="handleSubmit">
    <div v-if="title" class="feedback-header">
      <h2>{{ title }}</h2>
      <p>Source app: {{ appLabel }}</p>
    </div>

    <p v-else class="feedback-app-inline">Source app: {{ appLabel }}</p>

    <UiAlert v-if="errorMessage" variant="destructive">
      <UiAlertDescription>{{ errorMessage }}</UiAlertDescription>
    </UiAlert>

    <UiAlert v-if="successMessage">
      <UiAlertDescription>{{ successMessage }}</UiAlertDescription>
    </UiAlert>

    <div class="field">
      <UiLabel for="feedback-subject">Subject</UiLabel>
      <UiInput
        id="feedback-subject"
        v-model="subject"
        placeholder="Short summary of the bug"
        maxlength="120"
        required
      />
    </div>

    <div class="field">
      <UiLabel for="feedback-details">Details</UiLabel>
      <UiTextarea
        id="feedback-details"
        v-model="details"
        placeholder="What happened, what you expected, and steps to reproduce"
        required
      />
    </div>

    <UiButton type="submit" :disabled="loading">
      {{ loading ? "Sending..." : submitLabel }}
    </UiButton>
  </form>
</template>

<style scoped>
.feedback-form {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  width: 100%;
}

.feedback-header h2 {
  margin: 0;
  color: var(--foreground);
  font-size: 1.15rem;
}

.feedback-header p {
  margin: 0.2rem 0 0;
  color: var(--muted-foreground);
  font-size: 0.85rem;
}

.feedback-app-inline {
  margin: 0;
  color: var(--muted-foreground);
  font-size: 0.85rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}
</style>
