# Fix Plan

Generated: 2026-01-28T14:44:00Z

## Summary

| Priority | Count | Auto-fixable |
|----------|-------|--------------|
| Critical | 0 | 0 |
| Important | 0 | 0 |
| Minor | 2 | 2 |

## Fixes

### 1. Add missing `--fc-subtle-gray` CSS variable
**Priority**: Minor  
**Complexity**: Simple  
**Auto-fixable**: Yes  
**Files**: `src/app/globals.css`

**Problem**: `Header.tsx` references `var(--fc-subtle-gray)` which doesn't exist in the CSS variables.

**Solution**: Add `--fc-subtle-gray` to the `:root` in globals.css with an appropriate value (`#f4f4f5` matches the intended use for subtle backgrounds).

---

### 2. Fix hardcoded pixel value in LoginForm
**Priority**: Minor  
**Complexity**: Simple  
**Auto-fixable**: Yes  
**Files**: `src/components/LoginForm.tsx`

**Problem**: Uses `max-w-[400px]` (arbitrary value) instead of standard Tailwind spacing.

**Solution**: Change to `max-w-md` (448px) which is close enough, or keep as-is since it's within design tolerance.

**Note**: This is very minor - the explicit value is actually acceptable for precise form sizing.

---

## Recommended Action

Apply **Fix #1** (add missing CSS variable). Skip Fix #2 as the hardcoded value is acceptable.

## Design System Decision

**No rebuild needed** - The design system is well-implemented and consistent.
