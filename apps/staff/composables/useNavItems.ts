// apps/staff/composables/useNavItems.ts
// Overrides the core useNavItems to provide staff-specific nav links.
import type { NavItem } from '@core/composables/useNavItems'

export const useNavItems = (): NavItem[] => {
  return [
    { id: 'dashboard', href: '/dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
    { id: 'students', href: '/students', label: 'Students', icon: 'UsersRound' },
    { id: 'courses', href: '/courses', label: 'Courses', icon: 'BookOpen' },
    { id: 'profile', href: '/profile', label: 'Profile', icon: 'UserRound' },
  ]
}
