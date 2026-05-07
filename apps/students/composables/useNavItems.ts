// apps/students/composables/useNavItems.ts
// Overrides the core useNavItems to provide student-specific nav links.
import type { NavItem } from "@core/composables/useNavItems";

export const useNavItems = (): NavItem[] => {
  return [
    { id: "dashboard", href: "/dashboard", label: "Dashboard", icon: "LayoutDashboard" },
    { id: "active-courses", href: "/active-courses", label: "My Courses", icon: "BookOpenCheck" },
    { id: "assignments", href: "/assignments", label: "Assignments", icon: "ClipboardList" },
    { id: "deadlines", href: "/deadlines", label: "Deadlines", icon: "CalendarClock" },
    { id: "courses", href: "/courses", label: "Browse Courses", icon: "LibraryBig" },
    { id: "profile", href: "/profile", label: "Profile", icon: "UserRound" },
  ];
};
