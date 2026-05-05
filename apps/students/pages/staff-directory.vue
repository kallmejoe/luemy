<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useAuth } from "@core/composables/useAuth";

definePageMeta({
  middleware: ["auth"],
});

interface OfficeHour {
  day: string;
  start: string;
  end: string;
}

interface StaffProfile {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  department: string | null;
  assignedCourses: string[];
  officeHours: OfficeHour[];
}

const { token } = useAuth();
const search = ref("");
const loading = ref(true);
const staff = ref<StaffProfile[]>([]);

const fetchStaff = async () => {
  try {
    const res = await $fetch<{ success: boolean; staff?: StaffProfile[] }>(
      "/api/staff/directory",
      {
        headers: {
          Authorization: `Bearer ${token.value}`,
        },
      }
    );

    if (res.success && res.staff) {
      staff.value = res.staff;
    }
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
};

const filteredStaff = computed(() => {
  const query = search.value.trim().toLowerCase();
  if (!query) {
    return staff.value;
  }

  return staff.value.filter((member) => {
    const courseText = member.assignedCourses.join(" ").toLowerCase();
    const officeHoursText = member.officeHours
      .map((slot) => `${slot.day} ${slot.start} ${slot.end}`)
      .join(" ")
      .toLowerCase();

    return (
      member.name.toLowerCase().includes(query) ||
      member.email.toLowerCase().includes(query) ||
      (member.phone || "").toLowerCase().includes(query) ||
      (member.department || "").toLowerCase().includes(query) ||
      courseText.includes(query) ||
      officeHoursText.includes(query)
    );
  });
});

onMounted(() => {
  fetchStaff();
});
</script>

<template>
  <div class="staff-directory-page">
    <div class="staff-directory-header">
      <h1 class="staff-directory-title">Academic Staff Directory</h1>
      <p class="staff-directory-subtitle">Find instructor contact details, assigned courses, and office hours.</p>
    </div>

    <div class="search-wrapper">
      <input
        v-model="search"
        type="search"
        class="search-input"
        placeholder="Search by name, email, phone, course, or office hours"
      />
    </div>

    <div v-if="loading" class="state-card">Loading staff directory...</div>

    <div v-else-if="staff.length === 0" class="state-card">No academic staff profiles are available yet.</div>

    <div v-else-if="filteredStaff.length === 0" class="state-card">
      No staff profiles match your search.
    </div>

    <div v-else class="staff-grid">
      <article v-for="member in filteredStaff" :key="member.id" class="staff-card">
        <header class="staff-card-header">
          <h2 class="staff-name">{{ member.name }}</h2>
          <p class="staff-department">{{ member.department || "Department not specified" }}</p>
        </header>

        <section class="staff-section">
          <h3>Contact</h3>
          <p><strong>Email:</strong> {{ member.email }}</p>
          <p><strong>Phone:</strong> {{ member.phone || "Not provided" }}</p>
        </section>

        <section class="staff-section">
          <h3>Assigned Courses</h3>
          <ul v-if="member.assignedCourses.length">
            <li v-for="course in member.assignedCourses" :key="course">{{ course }}</li>
          </ul>
          <p v-else>No assigned courses.</p>
        </section>

        <section class="staff-section">
          <h3>Office Hours</h3>
          <ul v-if="member.officeHours.length">
            <li v-for="slot in member.officeHours" :key="`${slot.day}-${slot.start}-${slot.end}`">
              {{ slot.day }}: {{ slot.start }} - {{ slot.end }}
            </li>
          </ul>
          <p v-else>No office hours listed.</p>
        </section>
      </article>
    </div>
  </div>
</template>

<style scoped>
.staff-directory-page {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding-bottom: 2rem;
}

.staff-directory-header {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.staff-directory-title {
  margin: 0;
  font-size: 1.5rem;
  color: var(--foreground);
}

.staff-directory-subtitle {
  margin: 0;
  color: var(--muted-foreground);
  font-size: 0.95rem;
}

.search-wrapper {
  display: flex;
}

.search-input {
  width: 100%;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--background);
  color: var(--foreground);
  padding: 0.6rem 0.8rem;
  font-size: 0.9rem;
}

.search-input:focus {
  outline: 2px solid var(--ring);
  outline-offset: 1px;
}

.state-card {
  border: 1px dashed var(--border);
  border-radius: var(--radius);
  background: var(--card);
  color: var(--muted-foreground);
  padding: 1.25rem;
}

.staff-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
  gap: 1rem;
}

.staff-card {
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--card);
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}

.staff-card-header {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.staff-name {
  margin: 0;
  font-size: 1.1rem;
  color: var(--foreground);
}

.staff-department {
  margin: 0;
  font-size: 0.85rem;
  color: var(--muted-foreground);
}

.staff-section h3 {
  margin: 0 0 0.35rem;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--muted-foreground);
}

.staff-section p {
  margin: 0.2rem 0;
  font-size: 0.9rem;
}

.staff-section ul {
  margin: 0;
  padding-left: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  font-size: 0.9rem;
}

@media (max-width: 640px) {
  .staff-directory-title {
    font-size: 1.3rem;
  }
}
</style>
