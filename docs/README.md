# Luemy - Course Management System

Luemy is a multi-tenant educational platform built with Nuxt 4 that enables three distinct user roles to manage courses, assignments, and academic workflows.

## Overview

Luemy provides a complete course management system with three separate portals:

| Portal | Role | Description |
|--------|------|-------------|
| **Student App** | `student` | View courses, access assignments, submit work, track progress |
| **Staff App** | `admin` | Manage students, create courses, monitor submissions |
| **Instructor App** | `professor` | Create courses, assign grades, set availability |

## Tech Stack

- **Framework**: Nuxt 4 (SSR disabled - SPA mode)
- **Database**: SQLite via `better-sqlite3`
- **Authentication**: JWT via `jose` library
- **Password Hashing**: `bcrypt`
- **Styling**: Tailwind CSS v4 with custom CSS variables
- **Icons**: `nuxt-icon`
- **TypeScript**: Full type safety

## Quick Start

```bash
# Install dependencies
bun install

# Start development servers
bun run dev:students   # localhost:3000
bun run dev:staff     # localhost:3001
bun run dev:instructors # localhost:3002
```

## Documentation

- [Folder Structure](./FOLDER-STRUCTURE.md) - Code organization
- [Database Schema](./DATABASE.md) - Data models
- [API Reference](./API.md) - Backend endpoints
- [Developer Commands](./DEVELOPMENT.md) - Build & run commands
- [Team Workflow](./WORKFLOW.md) - Development process

## Key Concepts

### Authentication
- JWT tokens with 7-day expiration
- Token includes: `{ userId, email, role }`
- Bearer token in `Authorization` header

### Role-Based Access
- **No role-based routing** in layouts
- Server endpoints validate JWT and check role when needed
- Returns appropriate HTTP status codes

### Component Scope
- Shared components: `layers/core/components/`
- App-specific: `apps/[app-name]/components/`

## Project Structure

```
apps/           # Each app is a separate Nuxt application
  ├── students/
  ├── staff/
  └── instructors/
layers/core/    # Shared layer with components, composables, themes
server/
  ├── api/      # Backend endpoints
  ├── utils/    # Database utilities
  └── plugins/   # Nitro plugins
docs/          # Documentation
db/             # SQLite database
```