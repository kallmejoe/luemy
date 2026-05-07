# Folder Structure

This document explains the Luemy project organization to help new developers navigate the codebase.

## Root Directory

```
luemy/
├── apps/           # Three separate Nuxt applications
├── layers/         # Shared Nuxt layer
├── server/         # Backend API & database
├── docs/           # This documentation
├── db/             # SQLite database files
├── public/         # Static assets
├── scripts/        # Build/deploy scripts
└── nginx/         # Nginx configuration
```

## Apps Directory

Each app is a standalone Nuxt application extending the core layer.

```
apps/
├── students/           # Student portal (role: student)
│   ├── pages/        # Vue pages
│   ├── layouts/     # Layout overrides
│   ├── components/  # App-specific components
│   ├── composables/ # App-specific composables
│   ├── middleware/ # Auth middleware
│   └── nuxt.config.ts
│
├── staff/            # Staff portal (role: admin)
│   ├── pages/
│   ├── layouts/
│   ├── composables/
│   ├── middleware/
│   └── nuxt.config.ts
│
└── instructors/       # Instructor portal (role: professor)
    ├── pages/
    ├── layouts/
    ├── components/
    ├── composables/
    ├── middleware/
    └── nuxt.config.ts
```

### App Files

Each app requires these files:

| File | Purpose |
|------|---------|
| `app.vue` | Entry point (typically `<NuxtLayout><NuxtPage /></NuxtLayout>`) |
| `layouts/default.vue` | Layout with AppShell component |
| `composables/useNavItems.ts` | Navigation items |
| `middleware/auth.ts` | Auth guard (JWT + role check) |
| `nuxt.config.ts` | App-specific Nuxt config |

## Layers Directory

Shared layer used by all apps.

```
layers/core/
├── app.vue              # Root app component
├── app/
│   └── layouts/        # Shared layouts
├── components/         # Auto-imported components
│   ├── AppShell.vue    # Main layout (sidebar + workspace)
│   ├── CourseSearchFilter.vue
│   ├── LoginForm.vue
│   ├── ProfileForm.vue
│   ├── SignupForm.vue
│   ├── UserProfile.vue
│   └── ui/             # shadcn-style components
│       ├── Button.vue
│       ├── Input.vue
│       ├── Label.vue
│       ├── Navbar.vue
│       ├── Textarea.vue
│       └── alert/
├── composables/         # Auto-imported composables
│   ├── useAuth.ts     # Login/logout/refresh/role-check
│   ├── useUser.ts     # Global user state
│   ├── useNavItems.ts # Nav item type
│   └── useTheme.ts   # Theme toggle
├── hooks/             # Custom hooks
├── lib/               # Utilities & theme
│   ├── theme.css      # CSS variables (145 lines)
│   ├── utils.ts      # cn() utility (clsx + tailwind-merge)
│   └── *-variants.ts # Component variants
├── middleware/        # Core auth middleware
├── plugins/           # Nuxt plugins
│   ├── api-route-skip.ts
│   └── auth.ts
└── nuxt.config.ts    # Layer config
```

### Component Categories

- **Shared**: Reusable across all apps → `layers/core/components/`
- **App-specific**: Used by one app only → `apps/[app-name]/components/`

## Server Directory

Backend API built with Nitro (Nuxt's server engine).

```
server/
├── api/                # API endpoints (file-based routing)
│   ├── auth/          # Authentication
│   │   ├── login.post.ts
│   │   ├── signup.post.ts
│   │   └── me.get.ts
│   ├── courses/       # Course management
│   │   ├── index.get.ts
│   │   ├── index.post.ts
│   │   ├── create.post.ts
│   │   ├── list-courses.get.ts
│   │   ├── my-courses.get.ts
│   │   ├── [id].get.ts
│   │   ├── [id].put.ts
│   │   ├── [id]/
│   │   └── student/
│   ├── assignments/   # Assignment management
│   │   ├── index.post.ts
│   │   ├── grade.post.ts
│   │   ├── submit.post.ts
│   │   ├── upcoming.get.ts
│   │   ├── submissions.get.ts
│   │   ├── student-assignments.get.ts
│   │   ├── professor-assignments.get.ts
│   │   ├── [id].get.ts
│   │   ├── [id].get.ts
│   │   ├── submission/
│   │   └── professor/
│   ├── availability/ # Office hours
│   │   ├── add.post.ts
│   │   ├── list.get.ts
│   │   └── [id].delete.ts
│   ├── staff/        # Staff functions
│   │   ├── students.get.ts
│   │   ├── directory.get.ts
│   │   └── office-hours.post.ts
│   ├── student/      # Student functions
│   │   ├── activeCourses.get.ts
│   │   └── enroll.post.ts
│   └── user.put.ts   # Profile update
├── utils/             # Server utilities
│   ├── db.ts        # Database initialization
│   └── init.ts      # Legacy (imports db.ts)
└── plugins/          # Nitro plugins
    └── db.ts       # Database plugin
```

### API File Naming

Nuxt uses directory-based routing:

- `[name].get.ts` → GET /api/name
- `[name].post.ts` → POST /api/name
- `[name].put.ts` → PUT /api/name
- `[name].delete.ts` → DELETE /api/name
- `[id].get.ts` → GET /api/name/:id (dynamic parameter)

## Core Layer Components

### AppShell.vue

Main layout component used by all apps:

```vue
<template>
  <div class="appshell">
    <Sidebar :items="navItems" />
    <main class="workspace">
      <slot />
    </main>
    <MobileNav v-if="isMobile" :items="navItems" />
  </div>
</template>
```

Props:
- `navItems`: Array of nav items (href, label, icon)
- `portalName`: Portal title in sidebar

### UI Components

Located in `layers/core/components/ui/`:

| Component | Purpose |
|-----------|---------|
| `Button.vue` | Reusable button with variants (default, destructive, outline, ghost, link) |
| `Input.vue` | Styled input field |
| `Label.vue` | Form label |
| `Textarea.vue` | Multi-line input |
| `Navbar.vue` | Navigation bar |
| `Alert.vue` | Alert messages (error, success, warning, info) |

## Public Directory

Static assets served at the root:

```
public/
├── favicon.ico
└── _robots.txt
```

## Database

```
db/
└── database.sqlite  # SQLite database file
```

To reset: `rm db/database.sqlite` then restart dev server.

## Scripts

```
scripts/
└── seed-db.ts        # Database seeding script
```