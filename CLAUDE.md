# CLAUDE.md - Main Project Instructions

This file provides high-level guidance to Claude Code (claude.ai/code) when working with the Allodoc medical management system.

## 🏥 Project Overview

Allodoc is a comprehensive medical management system consisting of:
- **Backend**: NestJS API with PostgreSQL, TypeORM, JWT auth, multi-tenancy
- **Frontend**: Angular 16 SPA with Material Design, reactive forms, RxJS

## 📁 Project Structure

```
allodoc/
├── backend/                 # NestJS backend API
│   ├── src/                # Source code
│   ├── test/               # Test files
│   └── CLAUDE.md          # Backend-specific instructions
├── frontend/               # Angular frontend application
│   ├── src/                # Source code
│   └── CLAUDE.md          # Frontend-specific instructions
├── CLAUDE.md              # This file - main instructions
├── PROJECT_STATUS.md      # Combined progress tracking
├── ARCHITECTURE.md        # Architecture decisions
└── SESSION_LOG.md         # Work session history
```

## 🚀 Quick Start for New Sessions

1. **Check Current Status**:
   - Read `PROJECT_STATUS.md` for overall progress
   - Check `SESSION_LOG.md` for recent work
   - Review git status and recent commits

2. **Understand Context**:
   - Backend instructions: `backend/CLAUDE.md`
   - Frontend instructions: `frontend/CLAUDE.md`
   - Architecture decisions: `ARCHITECTURE.md`

3. **Start Working**:
   - Use TodoWrite tool for task management
   - Follow code quality standards in respective CLAUDE.md files
   - Update documentation as you work

## 🔗 Key Resources

### Git Workflow
- **Branching Strategy**: See `GIT_WORKFLOW.md` for complete Git workflow
- **Current Branch**: `develop` (main integration branch)
- **Branch Naming**: `<type>/<scope>-<description>` (e.g., `feature/backend-email`)

### Backend
- **API Documentation**: http://localhost:3000/api/docs (Swagger)
- **Development Server**: `npm run start:dev`
- **Database**: PostgreSQL on localhost:5432
- **Key File**: `backend/src/main.ts`

### Frontend
- **Development Server**: `npm start` (http://localhost:4200)
- **API Proxy**: Configured to backend at :3000
- **Key File**: `frontend/src/app/app.module.ts`

## 🏗️ Architecture Principles

1. **Separation of Concerns**: Clear boundaries between frontend/backend
2. **Multi-Tenancy**: Organization-based data isolation
3. **Security First**: JWT auth, role-based access, guards
4. **Type Safety**: Full TypeScript with strict mode
5. **Modular Design**: Feature-based module organization

## 📋 Working Guidelines

### When Starting Any Task
1. Read relevant documentation first
2. Use TodoWrite to plan multi-step tasks
3. Check existing patterns before implementing new features
4. Run tests/linting after changes

### When Finishing Work
1. Update progress in PROJECT_STATUS.md
2. Add entry to SESSION_LOG.md
3. Commit changes with descriptive messages
4. Note any blockers or next steps

### Documentation Updates
- Keep all .md files current
- Document architectural decisions
- Update API documentation inline
- Track technical debt

## 🔄 Development Workflow

1. **Feature Development**:
   ```bash
   # Backend
   cd backend
   npm run start:dev
   
   # Frontend (in new terminal)
   cd frontend
   npm start
   ```

2. **Testing**:
   ```bash
   # Backend
   npm run test
   npm run test:e2e
   
   # Frontend
   npm test
   ```

3. **Code Quality**:
   ```bash
   # Backend
   npm run lint
   npm run format
   
   # Frontend
   ng lint
   ```

## 🎯 Current Focus Areas

Check PROJECT_STATUS.md for detailed task lists. Generally:
- Backend: Testing coverage, API enhancements, security improvements
- Frontend: Testing implementation, performance optimization
- DevOps: Production deployment preparation

## 📝 Important Notes

- **Multi-tenant**: All entities must be scoped to organizations
- **Authentication**: JWT tokens with refresh mechanism
- **Database**: Development uses sync, production uses migrations
- **API Versioning**: Currently v1 at /api/v1/*

## 🚨 Common Issues & Solutions

1. **CORS Issues**: Check proxy.conf.json in frontend
2. **Auth Failures**: Verify JWT token and organization context
3. **Database Errors**: Check migrations and TypeORM sync setting
4. **Build Failures**: Clear node_modules and reinstall

Remember: Always read the module-specific CLAUDE.md files for detailed instructions!