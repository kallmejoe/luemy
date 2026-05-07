# Developer Commands

Reference for building, running, and debugging Luemy.

## Development Servers

```bash
# Student app (localhost:3000)
bun run dev:students

# Staff app
bun run dev:staff

# Instructor app
bun run dev:instructors
```

## Building

```bash
# Build individual apps
bun run build:students
bun run build:staff
bun run build:instructors

# Preview production build
bun run preview

# Generate (Nuxt prepare)
bun run generate
```

## Database

### Reset Database

```bash
# Delete database file
rm db/database.sqlite

# Restart dev server to reinitialize
```

The database auto-initializes when the server starts.

### View Database

```bash
# Using sqlite3 CLI
sqlite3 db/database.sqlite ".tables"
sqlite3 db/database.sqlite "SELECT * FROM users"
```

## Linting

```bash
# Run ESLint on entire project
npx eslint .

# Fix auto-fixable issues
npx eslint . --fix

# Run only on specific file
npx eslint apps/staff/pages/api-docs.vue
```

## TypeScript

```bash
# Typecheck all apps
npx nuxt typecheck apps/students
npx nuxt typecheck apps/staff
npx nuxt typecheck apps/instructors

# Prepare Nuxt (auto-runs on postinstall)
npx nuxt prepare
```

## Git

```bash
# Check status
git status

# View changes
git diff

# Create commit
git add .
git commit -m "LUEMY-XXX: Description"

# Push
git push origin branch-name

# Pull main
git checkout main
git pull origin main
```

## Project Scripts

Check `package.json` for all scripts:

```json
{
  "scripts": {
    "dev:students": "nuxt dev -p 3000",
    "dev:staff": "nuxt dev -p 3001",
    "dev:instructors": "nuxt dev -p 3002",
    "build:students": "nuxt build -p 3000",
    "build:staff": "nuxt build -p 3001",
    "build:instructors": "nuxt build -p 3002",
    "preview": "nuxt preview",
    "generate": "nuxt generate",
    "postinstall": "nuxt prepare"
  }
}
```

## Common Issues

### Server Port Already in Use

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### Cache Issues

```bash
# Clear Nuxt cache
rm -rf .nuxt

# Rebuild
npx nuxt prepare
```

### Database Locked

```bash
# Close any DB connections, then reset
rm db/database.sqlite
```

### Module Not Found

```bash
# Reinstall dependencies
bun install
npx nuxt prepare
```