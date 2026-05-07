// apps/instructors/composables/useNavItems.ts
// Overrides the core useNavItems to provide instructor-specific nav links.
import type { NavItem } from '@core/composables/useNavItems'

export const useNavItems = (): NavItem[] => {
  return [
    { id: 'dashboard', href: '/dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
    { id: 'courses', href: '/courses', label: 'Courses', icon: 'BookOpen' },
    { id: 'availability', href: '/availability', label: 'Availability', icon: 'Calendar' },
    { id: 'assignments', href: '/assignments', label: 'Assignments', icon: 'ClipboardList' },
    { id: 'grading', href: '/grading', label: 'Grading', icon: 'GraduationCap' },
    { id: 'profile', href: '/profile', label: 'Profile', icon: 'UserRound' },
  ]
}
