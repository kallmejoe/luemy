<script setup lang="ts">
import { ref, onMounted } from "vue"

interface Student {
  id: number
  name: string
  email: string
  major: string | null
  enrolled_courses_count: number
}

defineOptions({ name: "StaffStudents" })

definePageMeta({
  middleware: ["auth"],
})

const students = ref<Student[]>([])
const loading = ref(true)

const fetchStudents = async () => {
  try {
    const res = await $fetch("/api/staff/students", {
      headers: {
        Authorization: `Bearer ${useCookie("token").value}`,
      },
    })
    if (res.success) {
      students.value = res.students
    }
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

onMounted(fetchStudents)
</script>

<template>
  <div class="students-page">
    <div class="students-heading">
      <h1 class="page-title">Students</h1>
      <p class="page-subtitle">View all enrolled students</p>
    </div>

    <div v-if="loading" class="loading-state">
      <p>Loading students...</p>
    </div>

    <div v-else class="students-table-wrapper">
      <table class="students-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Major</th>
            <th>Enrolled Courses</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="student in students" :key="student.id">
            <td class="cell-name">{{ student.name }}</td>
            <td>{{ student.email }}</td>
            <td>{{ student.major || "—" }}</td>
            <td class="cell-count">{{ student.enrolled_courses_count }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="!loading && students.length === 0" class="empty-state">
      <h2>No students found</h2>
      <p>There are no students enrolled in the system yet.</p>
    </div>
  </div>
</template>

<style scoped>
.students-page {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.students-heading {
  position: sticky;
  top: 0;
  z-index: 5;
  padding-bottom: 0.75rem;
  background: var(--background);
}

.page-title {
  font-size: 1.875rem;
  font-weight: 700;
  color: var(--color-text);
  margin: 0 0 0.5rem 0;
}

.page-subtitle {
  font-size: 0.95rem;
  color: var(--muted-foreground);
  margin: 0;
}

.students-table-wrapper {
  overflow-x: auto;
  border: 1px solid var(--border);
  border-radius: var(--radius);
}

.students-table {
  width: 100%;
  border-collapse: collapse;
}

.students-table th {
  text-align: left;
  padding: 0.75rem 1rem;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--muted-foreground);
  background: var(--card);
  border-bottom: 1px solid var(--border);
}

.students-table td {
  padding: 0.75rem 1rem;
  font-size: 0.9rem;
  color: var(--color-text);
  border-bottom: 1px solid var(--border);
}

.students-table tbody tr:last-child td {
  border-bottom: none;
}

.students-table tbody tr:hover {
  background: var(--accent);
}

.cell-name {
  font-weight: 600;
}

.cell-count {
  text-align: center;
  font-weight: 600;
  color: var(--primary);
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  color: var(--muted-foreground);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 4rem 2rem;
  text-align: center;
}

.empty-state h2 {
  margin: 0;
  font-size: 1.5rem;
  color: var(--color-text);
}

.empty-state p {
  margin: 0;
  color: var(--muted-foreground);
}

@media (max-width: 640px) {
  .page-title {
    font-size: 1.5rem;
  }
}
</style>
