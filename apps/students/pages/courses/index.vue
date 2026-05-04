<script setup lang="ts">
import { ref, onMounted } from "vue";
import UiButton from "@core/components/ui/Button.vue";

definePageMeta({
  middleware: ["auth"],
});

const token = useCookie("token");

const courses = ref<any[]>([]);
const activeCourseIds = ref<number[]>([]);
const selectedCourseIds = ref<number[]>([]);

const fetchCourses = async () => {
  try {
    const res = await $fetch("/api/courses/list-courses");
    if (res.success) {
      courses.value = res.courses.filter((course: any) => course.active);
    }
  } catch (error) {
    console.error(error);
  }
};

const fetchActiveCourses = async () => {
  try {
    const res = await $fetch("/api/student/activeCourses", {
      headers: {
        Authorization: `Bearer ${token.value}`,
      },
    });

    if (res.success) {
      activeCourseIds.value = res.courses.map((course: any) => course.id);
    }
  } catch (error) {
    console.error(error);
  }
};

onMounted(async () => {
  await Promise.all([fetchCourses(), fetchActiveCourses()]);
});

const handleEnrollment = async (courseId: number) => {
  try {
    const res = await $fetch("/api/student/enroll", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token.value}`,
      },
      body: {
        courseIds: [courseId],
      },
    });

    if (res.success) {
      await fetchActiveCourses();
      alert("Successfully enrolled!");
    } else {
      alert(res.message || "Error occurred");
    }
  } catch (error) {
    console.error(error);
    alert("Enrollment failed");
  }
};

const isEnrolled = (courseId: number) =>
  activeCourseIds.value.includes(courseId);
</script>

<template>
  <div class="enrollment-page">
    <h1 class="page-title">Available Courses</h1>
    <div class="course-list">
      <div
        v-for="course in courses"
        :key="course.id"
        class="course-card"
        :class="{ enrolled: isEnrolled(course.id) }"
      >
        <div class="course-row">
          <div class="course-info">
            <NuxtLink :to="`/courses/${course.id}`" class="course-name">
              {{ course.name }}
            </NuxtLink>
            <span class="course-professor">{{ course.professor_name }}</span>
          </div>
          <div class="course-actions">
            <UiButton v-if="!isEnrolled(course.id)" size="sm" @click="handleEnrollment(course.id)">
              Enroll
            </UiButton>
            <NuxtLink v-else :to="`/courses/${course.id}`" class="view-link">
              View Course
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.enrollment-page {
  display: flex;
  flex-direction: column;
  padding: var(--spacing-md);
  gap: var(--spacing-lg);
}

.page-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--foreground);
}

.course-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.course-card {
  position: relative;
  display: flex;
  align-items: center;
  padding: var(--spacing-md) var(--spacing-lg);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--card);
  transition: all 0.2s ease;
}

.course-card::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  border-radius: var(--radius-lg) 0 0 var(--radius-lg);
  background: transparent;
  transition: background 0.2s ease;
}

.course-card:hover {
  background: var(--accent);
}

.course-card.enrolled {
  background: var(--muted);
}

.course-card.enrolled::before {
  background: var(--primary);
}

.course-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-md);
  width: 100%;
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
  font-weight: 600;
  color: var(--primary);
  text-decoration: none;
  transition: opacity 0.2s;
}

.course-name:hover {
  opacity: 0.8;
}

.course-professor {
  font-size: 0.875rem;
  color: var(--muted-foreground);
}

.course-actions {
  display: flex;
  gap: var(--spacing-sm);
}

.view-link {
  padding: 0.375rem 0.75rem;
  border-radius: var(--radius);
  background: var(--primary);
  color: var(--primary-foreground);
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 500;
  transition: opacity 0.2s;
  white-space: nowrap;
}

.view-link:hover {
  opacity: 0.9;
}

@media (max-width: 640px) {
  .enrollment-page {
    padding: var(--spacing-sm);
  }

  .course-row {
    flex-direction: column;
    align-items: flex-start;
  }

  .course-actions {
    width: 100%;
  }
}
</style>
