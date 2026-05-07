# Team Workflow

How our team develops features and fixes bugs.

## Overview

We follow a structured development process with code reviews to ensure quality and knowledge sharing.

```
Issue Assignment → Discussion → Branch → Development → PR → Review → Merge → Deploy
```

## Workflow Steps

### 1. Get Assigned an Issue

- Issues are created on Jira with clear acceptance criteria
- Team discusses requirements in a daily standup or sprint planning
- Ask clarifying questions before starting
- Make sure you understand exactly what's needed

### 2. Create a Branch

Always create a new branch from `main`:

```bash
git checkout main
git pull origin main
git checkout -b LUEMY-XXX-short-description
```

Branch naming convention:
- `LUEMY-XXX` = Jira issue number
- `short-description` = brief explanation in kebab-case

Examples:
- `LUEMY-123-add-student-enrollment`
- `LUEMY-456-fix-login-redirect`

### 3. Make Commits

Commit frequently with clear, atomic messages.

```
git add .
git commit -m "LUEMY-123: Add enrollment endpoint"
```

**Commit message rules:**
1. Start with Jira issue number: `LUEMY-123:`
2. Use present tense: "Add", "Fix", "Update"
3. Keep it short but descriptive
4. One purpose per commit

**Good commits:**
- `LUEMY-123: Add student enrollment endpoint`
- `LUEMY-124: Fix auth redirect on dashboard`
- `LUEMY-125: Add loading state to courses page`

**Bad commits:**
- `LUEMY-123: WIP stuff`
- `LUEMY-123: Changes`
- `LUEMY-123: Fix and add feature`

### 4. Open a Pull Request

When ready to merge:

1. Push your branch:
```bash
git push -u origin LUEMY-123-short-description
```

2. Open PR on GitHub with:
   - **Title**: `[LUEMY-123] Short description`
   - **Description**: Link to Jira issue, explain what was done
   - **Reviewers**:
     - Assign AI reviewer (CodeRabbit or similar)
     - Assign at least one human reviewer
   - **Labels**: Add appropriate labels

3. Link the Jira issue to the PR

### 5. Wait for Review

- **AI Reviewer**: Checks style, security, best practices
- **Human Reviewer**: Validates logic, requirements, edge cases

Address feedback by:
1. Making changes in your branch
2. Amending or adding commits
3. Pushing again (PR updates automatically)

### 6. Merge

Once approved:
1. Squash and merge on GitHub
2. Delete the branch (option available after merge)
3. Issue moves to "Done" on Jira

### 7. Iterate

Repeat for the next issue.

---

## Code Review Guidelines

### As an Author

- Keep PRs small and focused
- Write clear description
- Test locally before requesting review
- Respond to feedback promptly

### As a Reviewer

- Review within 24 hours
- Be specific with feedback
- Suggest improvements, don't just point out issues
- Approve when satisfied

---

## Common Issues and Solutions

### Merge Conflicts

```bash
# Update main
git checkout main
git pull origin main

# Rebase onto main
git checkout LUEMY-123-branch
git rebase main

# Resolve conflicts, then
git push -f
```

### Need to Amend Commit

```bash
git commit --amend -m "LUEMY-123: Updated message"
git push -f
```

### Wrong Branch

```bash
# Save changes
git stash

# Switch to correct branch
git checkout correct-branch

# Apply changes
git stash pop
```

---

## Best Practices

1. **Discuss before building** - Confirm requirements with team
2. **Small PRs** - Easier to review, faster feedback
3. **Test locally** - Verify before pushing
4. **Keep git history clean** - Atomic, readable commits
5. **Respond to reviews** - Don't let PRs stall
6. **Ask for help** - If stuck, reach out to team