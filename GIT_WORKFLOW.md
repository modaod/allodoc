# GIT WORKFLOW - Allodoc Project

This document defines the Git branching strategy and workflow for the Allodoc medical management system.

**Created**: August 7, 2025  
**Strategy**: Git Flow (Modified for Monorepo)

---

## 📊 Branch Structure Overview

```
main                    [Production-ready code]
├── develop            [Integration branch]
├── feature/*          [New features]
├── fix/*             [Bug fixes]
├── hotfix/*          [Urgent production fixes]
├── release/*         [Release preparation]
├── test/*            [Testing implementations]
├── refactor/*        [Code refactoring]
├── perf/*            [Performance improvements]
└── docs/*            [Documentation updates]
```

---

## 🎯 Branch Types and Workflow

### Main Branches

#### `main`
- **Purpose**: Production-ready code
- **Protected**: Yes - requires PR review
- **Merges from**: release/*, hotfix/*
- **Deploy**: Production environment

#### `develop`
- **Purpose**: Integration branch for features
- **Protected**: Yes - requires PR review
- **Merges from**: feature/*, fix/*, test/*, refactor/*
- **Deploy**: Development/staging environment

### Supporting Branches

#### `feature/*`
- **Purpose**: New feature development
- **Branch from**: develop
- **Merge to**: develop
- **Naming**: `feature/<scope>-<description>`
- **Example**: `feature/backend-email-notifications`
- **Lifetime**: Delete after merge

#### `fix/*`
- **Purpose**: Bug fixes (non-urgent)
- **Branch from**: develop
- **Merge to**: develop
- **Naming**: `fix/<scope>-<issue>`
- **Example**: `fix/frontend-consultation-display`
- **Lifetime**: Delete after merge

#### `hotfix/*`
- **Purpose**: Urgent production fixes
- **Branch from**: main
- **Merge to**: main AND develop
- **Naming**: `hotfix/<issue>`
- **Example**: `hotfix/auth-token-expiry`
- **Lifetime**: Delete after merge

#### `release/*`
- **Purpose**: Release preparation
- **Branch from**: develop
- **Merge to**: main AND develop
- **Naming**: `release/<version>`
- **Example**: `release/1.0.0`
- **Lifetime**: Delete after merge

#### `test/*`
- **Purpose**: Test implementation
- **Branch from**: develop
- **Merge to**: develop
- **Naming**: `test/<scope>-<type>`
- **Example**: `test/backend-unit-tests`
- **Lifetime**: Delete after merge

#### `refactor/*`
- **Purpose**: Code refactoring
- **Branch from**: develop
- **Merge to**: develop
- **Naming**: `refactor/<scope>-<area>`
- **Example**: `refactor/backend-repository-pattern`
- **Lifetime**: Delete after merge

#### `perf/*`
- **Purpose**: Performance improvements
- **Branch from**: develop
- **Merge to**: develop
- **Naming**: `perf/<scope>-<optimization>`
- **Example**: `perf/frontend-bundle-size`
- **Lifetime**: Delete after merge

---

## 🏷️ Naming Conventions

### Branch Naming Pattern
```
<type>/<scope>-<description>
```

### Scopes for Monorepo
- `backend` - Backend-specific changes
- `frontend` - Frontend-specific changes
- `fullstack` - Changes affecting both
- `devops` - Infrastructure/deployment
- `docs` - Documentation only

### Examples
```bash
feature/backend-redis-caching
feature/frontend-patient-dashboard
feature/fullstack-notification-system
fix/backend-permission-errors
fix/frontend-form-validation
test/backend-service-unit
test/frontend-component-integration
perf/frontend-lazy-loading
refactor/backend-dto-structure
docs/api-documentation
```

---

## 📝 Commit Message Convention

### Format
```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Test additions or corrections
- `chore`: Maintenance tasks
- `build`: Build system changes
- `ci`: CI/CD changes
- `revert`: Revert previous commit

### Scopes
- `backend`
- `frontend`
- `api`
- `db`
- `auth`
- `patients`
- `consultations`
- `prescriptions`
- `appointments`

### Examples
```bash
feat(backend): add email notification service
fix(frontend): resolve consultation empty fields issue
test(backend): add unit tests for patient repository
perf(frontend): optimize bundle size with tree shaking
docs(api): update swagger documentation
```

---

## 🔄 Common Workflows

### Starting a New Feature
```bash
# Update develop branch
git checkout develop
git pull origin develop

# Create feature branch
git checkout -b feature/backend-email-service

# Work on feature...
git add .
git commit -m "feat(backend): implement email service"

# Push to remote
git push -u origin feature/backend-email-service

# Create Pull Request to develop
```

### Fixing a Bug
```bash
# Start from develop
git checkout develop
git pull origin develop

# Create fix branch
git checkout -b fix/frontend-prescription-validation

# Fix the bug...
git add .
git commit -m "fix(frontend): correct prescription validation logic"

# Push and create PR
git push -u origin fix/frontend-prescription-validation
```

### Emergency Hotfix
```bash
# Start from main (production)
git checkout main
git pull origin main

# Create hotfix branch
git checkout -b hotfix/critical-auth-issue

# Fix the issue...
git add .
git commit -m "hotfix: resolve authentication bypass vulnerability"

# Push to remote
git push -u origin hotfix/critical-auth-issue

# After PR approval and merge to main:
git checkout develop
git merge main  # Sync the fix to develop
```

### Preparing a Release
```bash
# Start from develop
git checkout develop
git pull origin develop

# Create release branch
git checkout -b release/1.0.0

# Update version numbers, final testing...
git add .
git commit -m "chore: prepare release 1.0.0"

# Push to remote
git push -u origin release/1.0.0

# After testing, merge to main and develop via PR
```

### Working on Tests
```bash
# Start from develop
git checkout develop
git pull origin develop

# Create test branch
git checkout -b test/backend-consultation-unit

# Implement tests...
git add .
git commit -m "test(backend): add consultation service unit tests"

# Push and create PR
git push -u origin test/backend-consultation-unit
```

---

## 🚀 Pull Request Process

### PR Title Format
```
[<type>] <scope>: <description>
```

Examples:
- `[feat] backend: Add email notification service`
- `[fix] frontend: Resolve consultation display issues`
- `[test] backend: Add patient service unit tests`

### PR Description Template
```markdown
## Summary
Brief description of changes

## Type of Change
- [ ] Bug fix (non-breaking change)
- [ ] New feature (non-breaking change)
- [ ] Breaking change
- [ ] Documentation update
- [ ] Performance improvement
- [ ] Test implementation

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated if needed
- [ ] No console.log or debug code
- [ ] Changes generate no new warnings

## Screenshots (if applicable)
[Add screenshots for UI changes]

## Related Issues
Closes #[issue number]
```

---

## 🔐 Branch Protection Rules

### For `main`
- Require pull request before merging
- Require at least 2 approvals
- Dismiss stale PR approvals when new commits are pushed
- Require status checks to pass
- Require branches to be up to date before merging
- Include administrators in restrictions
- Restrict who can push to matching branches

### For `develop`
- Require pull request before merging
- Require at least 1 approval
- Require status checks to pass
- Require branches to be up to date before merging
- Allow force pushes with lease (for rebasing)

---

## 📋 Current Active Branches

### Priority Tasks (from PROJECT_STATUS.md)
Based on current project status, these branches should be created:

#### High Priority
- `test/backend-unit-tests` - Backend service and repository tests
- `test/frontend-unit-tests` - Frontend component and service tests
- `test/backend-integration` - API endpoint testing
- `fix/backend-permission-issues` - File permission errors

#### Medium Priority
- `feature/backend-email-notifications` - Email notification system
- `feature/frontend-advanced-search` - Full-text search
- `feature/backend-file-upload` - Document upload system
- `perf/frontend-bundle-optimization` - Bundle size reduction

---

## 🎯 Migration from Current Structure

### Current State
- Branch: `dev/config` (contains all work)
- Needs: Reorganization into proper flow

### Migration Steps
1. Push current `dev/config` to remote
2. Create `develop` from `main`
3. Merge `dev/config` into `develop`
4. Delete `dev/config` branch
5. Create feature branches from `develop`

### Commands for Migration
```bash
# Push current work
git push origin dev/config

# Create develop branch
git checkout main
git pull origin main
git checkout -b develop
git merge dev/config
git push -u origin develop

# Clean up
git branch -d dev/config
git push origin --delete dev/config

# Start working on new branches
git checkout develop
git checkout -b test/backend-unit-tests
```

---

## 📚 Quick Reference

### Switch to develop
```bash
git checkout develop
git pull origin develop
```

### Create new branch
```bash
git checkout -b <branch-type>/<scope>-<description>
```

### Push new branch
```bash
git push -u origin <branch-name>
```

### Update branch with develop
```bash
git checkout <your-branch>
git merge develop
# or
git rebase develop
```

### Delete branch after merge
```bash
# Local
git branch -d <branch-name>

# Remote
git push origin --delete <branch-name>
```

---

## 🤝 Team Collaboration Tips

1. **Always pull before creating new branches**
2. **Keep branches focused on single concerns**
3. **Write clear commit messages**
4. **Update develop frequently to avoid conflicts**
5. **Review PRs promptly**
6. **Delete branches after merging**
7. **Use draft PRs for work in progress**
8. **Communicate breaking changes**

---

## 📖 Additional Resources

- [Git Flow Original](https://nvie.com/posts/a-successful-git-branching-model/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [GitHub Flow](https://guides.github.com/introduction/flow/)

---

**Note for Claude Code**: This workflow should be followed when creating branches and commits. Always check this document when uncertain about branch naming or workflow procedures.