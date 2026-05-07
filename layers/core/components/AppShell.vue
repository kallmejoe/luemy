<script setup lang="ts">
import {
  BookOpen,
  BookOpenCheck,
  Bug,
  CalendarClock,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  LibraryBig,
  LogOut,
  Menu,
  PanelLeftClose,
  UserRound,
  UsersRound,
  X,
} from 'lucide-vue-next'
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import type { NavItem } from '@core/composables/useNavItems'
import UserProfile from '@core/components/UserProfile.vue'
import FeedbackForm from '@core/components/FeedbackForm.vue'
import { useAuth } from '@core/composables/useAuth'

type AppSource = 'student' | 'staff' | 'instructor'

const props = defineProps<{
  navItems: NavItem[]
  portalName?: string
  feedbackSource: AppSource
}>()

const route = useRoute()
const { logout } = useAuth()
const sidebarOpen = ref(false)
const reportModalOpen = ref(false)

const icons = {
  BookOpen,
  BookOpenCheck,
  CalendarClock,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  LibraryBig,
  UserRound,
  UsersRound,
}

const activeItem = computed(() => {
  const pathname = route.path

  for (const item of props.navItems) {
    if (item.href === '/') {
      if (pathname === '/') return item.id
    } else if (pathname.startsWith(item.href)) {
      return item.id
    }
  }

  return props.navItems[0]?.id || ''
})

function iconFor(item: NavItem) {
  return icons[(item.icon || 'LayoutDashboard') as keyof typeof icons] || LayoutDashboard
}

function closeSidebar() {
  sidebarOpen.value = false
}

function handleLogout() {
  closeSidebar()
  logout()
}

function openReportModal() {
  reportModalOpen.value = true
  closeSidebar()
}

function closeReportModal() {
  reportModalOpen.value = false
}

function handleFeedbackSubmitted() {
  reportModalOpen.value = false
}
</script>

<template>
  <div class="app-shell">
    <aside class="app-sidebar" aria-label="Primary navigation">
      <div class="sidebar-brand">
        <div class="brand-mark">L</div>
        <div>
          <p class="brand-name">Luemy</p>
          <p class="brand-context">{{ portalName || 'Learning portal' }}</p>
        </div>
      </div>

      <nav class="sidebar-nav">
        <NuxtLink
          v-for="item in navItems"
          :key="item.id"
          :to="item.href"
          :class="['sidebar-link', activeItem === item.id ? 'sidebar-link--active' : '']"
          :title="item.label"
        >
          <component :is="iconFor(item)" class="sidebar-icon" aria-hidden="true" />
          <span>{{ item.label }}</span>
        </NuxtLink>
      </nav>

      <button type="button" class="sidebar-feedback" @click="openReportModal">
        <Bug class="sidebar-icon" aria-hidden="true" />
        <span>Report Bug</span>
      </button>

      <button type="button" class="sidebar-logout" @click="handleLogout">
        <LogOut class="sidebar-icon" aria-hidden="true" />
        <span>Log out</span>
      </button>
    </aside>

    <div v-if="sidebarOpen" class="mobile-backdrop" @click="closeSidebar" />

    <aside :class="['mobile-sidebar', sidebarOpen ? 'mobile-sidebar--open' : '']" aria-label="Mobile navigation">
      <div class="mobile-sidebar-header">
        <div class="sidebar-brand">
          <div class="brand-mark">L</div>
          <div>
            <p class="brand-name">Luemy</p>
            <p class="brand-context">{{ portalName || 'Learning portal' }}</p>
          </div>
        </div>
        <button type="button" class="icon-button" aria-label="Close navigation" @click="closeSidebar">
          <X aria-hidden="true" />
        </button>
      </div>

      <nav class="sidebar-nav">
        <NuxtLink
          v-for="item in navItems"
          :key="item.id"
          :to="item.href"
          :class="['sidebar-link', activeItem === item.id ? 'sidebar-link--active' : '']"
          @click="closeSidebar"
        >
          <component :is="iconFor(item)" class="sidebar-icon" aria-hidden="true" />
          <span>{{ item.label }}</span>
        </NuxtLink>
      </nav>

      <button type="button" class="sidebar-feedback" @click="openReportModal">
        <Bug class="sidebar-icon" aria-hidden="true" />
        <span>Report Bug</span>
      </button>
    </aside>

    <section class="app-workspace">
      <header class="mobile-topbar">
        <button type="button" class="icon-button" aria-label="Open navigation" @click="sidebarOpen = true">
          <Menu aria-hidden="true" />
        </button>
        <div class="mobile-title">
          <PanelLeftClose aria-hidden="true" />
          <span>{{ portalName || 'Learning portal' }}</span>
        </div>
        <UserProfile />
      </header>

      <main class="app-content">
        <slot />
      </main>
    </section>

    <div v-if="reportModalOpen" class="report-modal-backdrop" @click="closeReportModal" />
    <div v-if="reportModalOpen" class="report-modal" role="dialog" aria-modal="true" aria-label="Report bug">
      <div class="report-modal-header">
        <h2>Report a bug</h2>
        <button type="button" class="icon-button" aria-label="Close report bug popup" @click="closeReportModal">
          <X aria-hidden="true" />
        </button>
      </div>
      <p class="report-modal-subtitle">
        Route captured automatically: {{ route.path }}
      </p>
      <FeedbackForm
        :app="feedbackSource"
        submit-label="Submit bug report"
        title=""
        @submitted="handleFeedbackSubmitted"
      />
    </div>
  </div>
</template>

<style scoped>
.app-shell {
  display: grid;
  grid-template-columns: 15.5rem minmax(0, 1fr);
  height: 100%;
  min-height: 0;
  background: var(--background);
}

.app-sidebar,
.mobile-sidebar {
  background: var(--sidebar);
  color: var(--sidebar-foreground);
  border-right: 1px solid var(--sidebar-border);
}

.app-sidebar {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  min-height: 0;
  padding: var(--spacing-md);
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  min-height: 2.75rem;
}

.brand-mark {
  display: grid;
  width: 2.25rem;
  height: 2.25rem;
  place-items: center;
  border-radius: var(--radius-md);
  background: var(--sidebar-primary);
  color: var(--sidebar-primary-foreground);
  font-weight: 800;
}

.brand-name,
.brand-context {
  margin: 0;
}

.brand-name {
  font-size: 0.95rem;
  font-weight: 750;
}

.brand-context {
  color: var(--sidebar-muted);
  font-size: 0.75rem;
}

.sidebar-nav {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: var(--spacing-xs);
  min-height: 0;
}

.sidebar-link,
.sidebar-logout {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  min-height: 2.5rem;
  width: 100%;
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  padding: 0 var(--spacing-sm);
  color: var(--sidebar-muted);
  text-decoration: none;
  font: inherit;
  font-size: 0.9rem;
  font-weight: 650;
  background: transparent;
  cursor: pointer;
  transition: background-color 0.16s ease, color 0.16s ease, border-color 0.16s ease;
}

.sidebar-link:hover,
.sidebar-logout:hover {
  background: var(--sidebar-accent);
  color: var(--sidebar-accent-foreground);
}

.sidebar-link--active {
  background: var(--sidebar-accent);
  border-color: var(--sidebar-border);
  color: var(--sidebar-accent-foreground);
}

.sidebar-icon {
  width: 1.05rem;
  height: 1.05rem;
  flex: 0 0 auto;
}

.sidebar-logout {
  color: var(--destructive);
}

.sidebar-feedback {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  min-height: 2.5rem;
  width: 100%;
  border: 1px solid var(--sidebar-border);
  border-radius: var(--radius-md);
  padding: 0 var(--spacing-sm);
  color: var(--sidebar-accent-foreground);
  text-decoration: none;
  font: inherit;
  font-size: 0.9rem;
  font-weight: 650;
  background: color-mix(in oklab, var(--sidebar-accent) 68%, transparent);
  cursor: pointer;
  transition: background-color 0.16s ease, color 0.16s ease, border-color 0.16s ease;
}

.sidebar-feedback:hover {
  background: var(--sidebar-accent);
}

.app-workspace {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
}

.mobile-topbar {
  display: none;
}

.app-content {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: var(--spacing-lg);
}

.mobile-sidebar,
.mobile-backdrop {
  display: none;
}

.report-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 130;
  background: color-mix(in oklab, var(--overlay) 82%, transparent);
}

.report-modal {
  position: fixed;
  top: 50%;
  left: 50%;
  z-index: 140;
  width: min(36rem, calc(100vw - 2rem));
  max-height: calc(100vh - 2rem);
  overflow-y: auto;
  transform: translate(-50%, -50%);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: var(--spacing-md);
  background: var(--card);
  box-shadow: var(--shadow-lg);
}

.report-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-xs);
}

.report-modal-header h2 {
  margin: 0;
  font-size: 1.05rem;
  color: var(--foreground);
}

.report-modal-subtitle {
  margin: 0 0 var(--spacing-sm);
  color: var(--muted-foreground);
  font-size: 0.82rem;
}

.icon-button {
  display: inline-grid;
  width: 2.35rem;
  height: 2.35rem;
  place-items: center;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--card);
  color: var(--foreground);
  cursor: pointer;
}

.icon-button svg {
  width: 1.1rem;
  height: 1.1rem;
}

.mobile-title {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  color: var(--muted-foreground);
  font-size: 0.85rem;
  font-weight: 650;
}

.mobile-title svg {
  width: 1rem;
  height: 1rem;
}

@media (max-width: 860px) {
  .app-shell {
    grid-template-columns: 1fr;
  }

  .app-sidebar {
    display: none;
  }

  .mobile-topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--spacing-sm);
    min-height: 4rem;
    border-bottom: 1px solid var(--border);
    padding: 0 var(--spacing-md);
    background: var(--background);
  }

  .app-content {
    padding: var(--spacing-md);
  }

  .mobile-backdrop {
    position: fixed;
    inset: 0;
    z-index: 80;
    display: block;
    background: var(--overlay);
  }

  .mobile-sidebar {
    position: fixed;
    inset: 0 auto 0 0;
    z-index: 90;
    display: flex;
    width: min(19rem, 86vw);
    flex-direction: column;
    gap: var(--spacing-lg);
    padding: var(--spacing-md);
    transform: translateX(-100%);
    transition: transform 0.18s ease;
  }

  .mobile-sidebar--open {
    transform: translateX(0);
  }

  .mobile-sidebar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--spacing-sm);
  }
}
</style>
