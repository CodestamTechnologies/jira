# Radius Variable Usage Issues

This document lists all places where the `--radius` CSS variable from `globals.css` is not being used.

## Summary

The `--radius` variable (0.2rem) is configured in Tailwind as:
- `rounded-lg` → `var(--radius)` (0.2rem)
- `rounded-md` → `calc(var(--radius) - 2px)`
- `rounded-sm` → `calc(var(--radius) - 4px)`

## Issues Found

### 1. `rounded-xl` - Not using variable (should use `rounded-lg`)

**Files:**
- `src/components/ui/card.tsx:12` - Card component uses `rounded-xl`
- `src/components/chart-area-interactive.tsx:198` - SelectContent uses `rounded-xl`
- `src/components/ui/sidebar.tsx:336` - Sidebar variant uses `rounded-xl`

**Impact:** These use Tailwind's default `rounded-xl` (0.75rem) instead of the CSS variable.

### 2. `rounded-[2px]` - Hardcoded value (should use `rounded-sm`)

**Files:**
- `src/components/ui/chart.tsx:213` - Chart indicator uses `rounded-[2px]`
- `src/components/ui/chart.tsx:307` - Chart item uses `rounded-[2px]`

**Impact:** Hardcoded 2px value doesn't respect the design system radius variable.

### 3. `rounded-none` - Explicitly no radius

**Files:**
- `src/features/activity-logs/components/activity-log-filters.tsx:50` - Card uses `rounded-none`

**Impact:** This might be intentional, but should be reviewed if consistency is desired.

### 4. Email Templates - Hardcoded border-radius in inline styles

**Files:**
- `src/lib/email/templates/task-email-templates.ts` - Multiple `border-radius: 8px`, `6px`, `4px`
- `src/lib/email/templates/member-email-templates.ts` - Multiple `border-radius: 8px`
- `src/lib/email/templates/project-email-templates.ts` - Multiple `border-radius: 8px`, `6px`
- `src/lib/email/templates/comment-email-templates.ts` - Multiple `border-radius: 8px`, `6px`, `4px`

**Impact:** Email HTML requires inline styles, but these could potentially use CSS variables if the email client supports it. However, many email clients don't support CSS variables, so inline styles might be necessary.

### 5. Reports Service - Hardcoded border-radius in CSS strings

**Files:**
- `src/features/reports/reports-service.ts` - Multiple hardcoded `border-radius` values (8px, 5px, 12px)

**Impact:** Generated HTML reports use hardcoded values. Could potentially use CSS variables if reports are viewed in a browser context.

## Notes

- `rounded-full` is acceptable (used for circular elements, 50% border-radius)
- `rounded-[inherit]` is acceptable (inherits from parent)
- Email templates and reports may require hardcoded values due to compatibility constraints

