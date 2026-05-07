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
  Moon,
  PanelLeftClose,
  Sun,
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
import { useTheme } from '@core/composables/useTheme'

type AppSource = 'student' | 'staff' | 'instructor'

const props = defineProps<{
  navItems: NavItem[]
  portalName?: string
  feedbackSource: AppSource
}>()

const route = useRoute()
const { logout } = useAuth()
const { isDark, toggleTheme } = useTheme()
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
      <div class="sidebar-header">
        <div class="brand">
          <div class="brand-icon">
            <GraduationCap :size="22" stroke-width="2.2" />
          </div>
          <span class="brand-text">Luemy</span>
        </div>
      </div>

      <nav class="sidebar-nav">
        <NuxtLink
          v-for="item in navItems"
          :key="item.id"
          :to="item.href"
          :class="['nav-item', activeItem === item.id ? 'nav-item--active' : '']"
        >
          <div class="nav-item-indicator" />
          <div class="nav-item-icon">
            <component :is="iconFor(item)" :size="19" stroke-width="2" />
          </div>
          <span class="nav-item-label">{{ item.label }}</span>
        </NuxtLink>
      </nav>

      <div class="sidebar-bottom">
        <div class="sidebar-separator" />

        <div class="sidebar-actions">
          <button
            type="button"
            class="action-btn"
            :title="isDark ? 'Light mode' : 'Dark mode'"
            @click="toggleTheme"
          >
            <div class="action-icon">
              <Moon v-if="isDark" :size="18" stroke-width="2" />
              <Sun v-else :size="18" stroke-width="2" />
            </div>
            <span class="action-label">{{ isDark ? 'Light' : 'Dark' }}</span>
          </button>

          <button
            type="button"
            class="action-btn"
            title="Report a bug"
            @click="openReportModal"
          >
            <div class="action-icon">
              <Bug :size="18" stroke-width="2" />
            </div>
            <span class="action-label">Report</span>
          </button>

          <button
            type="button"
            class="action-btn action-btn--danger"
            title="Log out"
            @click="handleLogout"
          >
            <div class="action-icon">
              <LogOut :size="18" stroke-width="2" />
            </div>
            <span class="action-label">Log out</span>
          </button>
        </div>
      </div>
    </aside>

    <div v-if="sidebarOpen" class="mobile-backdrop" @click="closeSidebar" />

    <aside :class="['mobile-sidebar', sidebarOpen ? 'mobile-sidebar--open' : '']" aria-label="Mobile navigation">
      <div class="mobile-header">
        <div class="brand">
          <div class="brand-icon">
            <GraduationCap :size="20" stroke-width="2.2" />
          </div>
          <span class="brand-text">Luemy</span>
        </div>
        <button type="button" class="close-btn" aria-label="Close menu" @click="closeSidebar">
          <X :size="20" stroke-width="2" />
        </button>
      </div>

      <nav class="sidebar-nav">
        <NuxtLink
          v-for="item in navItems"
          :key="item.id"
          :to="item.href"
          :class="['nav-item', activeItem === item.id ? 'nav-item--active' : '']"
          @click="closeSidebar"
        >
          <div class="nav-item-indicator" />
          <div class="nav-item-icon">
            <component :is="iconFor(item)" :size="19" stroke-width="2" />
          </div>
          <span class="nav-item-label">{{ item.label }}</span>
        </NuxtLink>
      </nav>

      <div class="sidebar-bottom">
        <div class="sidebar-separator" />
        <div class="sidebar-actions">
          <button
            type="button"
            class="action-btn"
            :title="isDark ? 'Light mode' : 'Dark mode'"
            @click="toggleTheme"
          >
            <div class="action-icon">
              <Moon v-if="isDark" :size="18" stroke-width="2" />
              <Sun v-else :size="18" stroke-width="2" />
            </div>
            <span class="action-label">{{ isDark ? 'Light' : 'Dark' }}</span>
          </button>

          <button
            type="button"
            class="action-btn"
            title="Report a bug"
            @click="openReportModal"
          >
            <div class="action-icon">
              <Bug :size="18" stroke-width="2" />
            </div>
            <span class="action-label">Report</span>
          </button>
        </div>
      </div>
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
  grid-template-columns: 17rem minmax(0, 1fr);
  height: 100%;
  min-height: 0;
  background: var(--background);
}

.app-sidebar {
  background: var(--sidebar);
  color: var(--sidebar-foreground);
  border-right: 1px solid var(--sidebar-border);
  display: flex;
  flex-direction: column;
  width: 17rem;
  overflow: hidden;
}

.sidebar-header {
  padding: var(--spacing-lg) var(--spacing-lg) var(--spacing-md);
}

.brand {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.brand-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  background: linear-gradient(135deg, var(--sidebar-primary), var(--sidebar-accent));
  border-radius: var(--radius-md);
  color: var(--sidebar-primary-foreground);
}

.brand-text {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--sidebar-foreground);
  letter-spacing: -0.03em;
}

.sidebar-nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 0 var(--spacing-sm);
  gap: 0.25rem;
  overflow-y: auto;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  height: 2.5rem;
  width: 100%;
  border-radius: var(--radius-md);
  padding: 0 var(--spacing-sm);
  color: var(--sidebar-muted);
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
  background: transparent;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.nav-item:hover {
  color: var(--sidebar-foreground);
  background: var(--sidebar-accent);
}

.nav-item--active {
  color: var(--sidebar-foreground);
  background: var(--sidebar-accent);
}

.nav-item-indicator {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 0;
  height: 1.25rem;
  background: var(--sidebar-primary);
  border-radius: 0 3px 3px 0;
  transition: width 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.nav-item--active .nav-item-indicator {
  width: 3px;
}

.nav-item-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 1.5rem;
  height: 1.5rem;
  opacity: 0.75;
  transition: opacity 0.2s ease;
}

.nav-item:hover .nav-item-icon,
.nav-item--active .nav-item-icon {
  opacity: 1;
}

.nav-item-label {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sidebar-bottom {
  padding: var(--spacing-sm);
}

.sidebar-separator {
  height: 1px;
  background: var(--sidebar-border);
  margin-bottom: var(--spacing-sm);
}

.sidebar-actions {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  height: 2.25rem;
  width: 100%;
  border-radius: var(--radius-md);
  padding: 0 var(--spacing-sm);
  color: var(--sidebar-muted);
  font-size: 0.875rem;
  font-weight: 500;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  font-family: inherit;
}

.action-btn:hover {
  color: var(--sidebar-foreground);
  background: var(--sidebar-accent);
}

.action-btn--danger:hover {
  color: var(--destructive);
  background: color-mix(in oklch, var(--destructive) 12%, transparent);
}

.action-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.25rem;
  height: 1.25rem;
  flex-shrink: 0;
}

.action-label {
  white-space: nowrap;
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
    width: min(20rem, 86vw);
    flex-direction: column;
    padding: var(--spacing-md);
    transform: translateX(-100%);
    transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .mobile-sidebar--open {
    transform: translateX(0);
  }

  .mobile-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--spacing-sm) var(--spacing-sm) var(--spacing-md);
  }

  .close-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.25rem;
    height: 2.25rem;
    border: none;
    border-radius: var(--radius-md);
    background: transparent;
    color: var(--sidebar-muted);
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .close-btn:hover {
    background: var(--sidebar-accent);
    color: var(--sidebar-foreground);
  }

  .mobile-sidebar .sidebar-nav {
    flex: 1;
    padding: 0 var(--spacing-sm);
  }

  .mobile-sidebar .sidebar-bottom {
    padding: var(--spacing-sm);
  }
}
</style>