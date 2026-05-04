<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useAuth } from "@core/composables/useAuth";

definePageMeta({
  middleware: ["auth"],
});

const { token } = useAuth();

const allCourses = ref<any[]>([]);
const enrolledCourseIds = ref<number[]>([]);
const loading = ref(true);

const fetchAllCourses = async () => {
  try {
    const res = await $fetch("/api/courses/list-courses");
    if (res.success) {
      allCourses.value = res.courses.filter((course: any) => course.active);
    }
  } catch (error) {
    console.error(error);
  }
};

const fetchEnrolledCourses = async () => {
  try {
    const res = await $fetch("/api/student/activeCourses", {
      headers: {
        Authorization: `Bearer ${token.value}`,
      },
    });

    if (res.success) {
      enrolledCourseIds.value = res.courses.map((course: any) => course.id);
    }
  } catch (error) {
    console.error(error);
  }
};

const activeCourses = computed(() => {
  return allCourses.value.map((course: any) => ({
    ...course,
    isEnrolled: enrolledCourseIds.value.includes(course.id),
  }));
});

const enrolledCourses = computed(() => {
  return activeCourses.value.filter((course: any) => course.isEnrolled);
});

const availableCourses = computed(() => {
  return activeCourses.value.filter((course: any) => !course.isEnrolled);
});

onMounted(async () => {
  await Promise.all([fetchAllCourses(), fetchEnrolledCourses()]);
  loading.value = false;
});
</script>

<template>
  <div class="courses-page">
    <div v-if="loading" class="loading">Loading...</div>

    <div v-else-if="enrolledCourses.length === 0" class="empty-state">
      <p>No enrolled courses</p>
      <NuxtLink to="/enrollment" class="link">Browse courses</NuxtLink>
    </div>

    <div v-else class="course-list">
      <div
        v-for="course in enrolledCourses"
        :key="course.id"
        class="course-card"
      >
        <div class="course-info">
          <span class="course-name">{{ course.name }}</span>
          <span class="course-professor">{{ course.professor_name }}</span>
        </div>
        <span class="badge">Enrolled</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.courses-page {
  display: flex;
  flex-direction: column;
}

.loading,
.empty-state {
  padding: var(--spacing-xl);
  text-align: center;
  color: var(--muted-foreground);
}

.link {
  color: var(--primary);
  text-decoration: none;
  font-weight: 500;
}

.link:hover {
  text-decoration: underline;
}

.course-list {
  display: flex;
  flex-direction: column;
}

.course-card {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-md) var(--spacing-lg);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--muted);
}

.course-card::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  border-radius: var(--radius-lg) 0 0 var(--radius-lg);
  background: var(--primary);
}

.course-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.course-name {
  font-size: 1rem;
  font-weight: 500;
}

.course-professor {
  font-size: 0.875rem;
  color: var(--muted-foreground);
}

.badge {
  padding: 0.25rem 0.625rem;
  border-radius: 999px;
  background: var(--primary);
  color: var(--primary-foreground);
  font-size: 0.75rem;
  font-weight: 500;
}
</style>
