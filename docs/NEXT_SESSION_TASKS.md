# Next Session Priority Tasks

## 🔥 Critical Issues (Immediate)

### 1. Dashboard API 500 Errors
**Problem**: Dashboard stats and recent-activity endpoints return 500 Internal Server Error
**Impact**: Dashboard page shows error messages to users
**Investigation needed**:
- Check actual error details in backend logs (current logs only show generic 500)
- May need database field migration or more comprehensive data compatibility
- Possible TypeORM query issues with existing data structure

### 2. Data Migration Strategy  
**Problem**: Existing consultations have `chiefComplaint`/`historyOfPresentIllness` fields but new code expects `reason`/`symptoms`
**Options**:
- Database migration script to update field names
- Temporary read compatibility layer (more comprehensive than current dashboard fix)
- Data transformation service

## 🛠️ Technical Debt

### 1. Field Name Inconsistency
**Status**: Mostly resolved, some edge cases remain
- Frontend/backend now aligned on reason/symptoms
- Dashboard has minimal fallback for old data
- Consider comprehensive migration vs. permanent compatibility layer

### 2. Bundle Size Optimization
**Progress**: Backward compatibility removed (saved 26+ lines)
**Next steps**: 
- Review other modules for similar cleanup opportunities
- Implement tree-shaking optimizations
- Analyze current bundle size warnings (CSS exceeds budget)

## 📋 Development Priorities

### 1. Testing Implementation
**Current**: 5-10% coverage
**Need**: Comprehensive testing strategy
- Unit tests for services and components
- Integration tests for API endpoints
- E2E tests for critical user flows

### 2. Performance Optimization
**Areas identified**:
- Bundle size exceeds budget warnings
- Database query optimization potential
- Frontend state management (consider NgRx)

## 🎯 Next Session Focus

**Primary Goal**: Fix dashboard 500 errors
**Secondary Goal**: Implement data migration strategy
**Time estimate**: 2-3 hours

### Recommended Approach:
1. Enable detailed error logging in backend
2. Identify specific query/data issues
3. Implement targeted fix (migration vs. compatibility)
4. Test dashboard functionality end-to-end
5. Document solution for future reference

## 📝 Notes for Context

**Branch**: `fix/consultation-creation-form` 
**Status**: Consultation creation/editing fixed, field standardization complete
**Remaining**: Dashboard API issues preventing full functionality

**Key accomplishments**: 
- Consultation forms now work correctly
- Field names standardized across codebase
- Code cleanup reduced complexity
- UX improved with clear editing restrictions

**Architecture decisions made**:
- Reason/symptoms as primary field names
- Notes and vital signs only editable in consultations
- DoctorId automatically populated from current user
- PATCH method for consultation updates