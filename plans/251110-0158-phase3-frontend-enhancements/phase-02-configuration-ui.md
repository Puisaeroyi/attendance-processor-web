# Phase 2: Configuration UI Implementation

**Date:** 2025-11-10
**Priority:** High (Security-Critical)
**Timeline:** 3-4 days
**Implementation Status:** Not Started
**Review Status:** Pending

## Context Links
- **Parent Plan:** [plan.md](./plan.md)
- **Dependencies:** `users.yaml`, `rule.yaml` files, `lib/config/yamlLoader.ts` (exists)
- **Security Reference:** [Phase 2 Code Review](../../251109-1500-web-ui-implementation/reports/251109-phase2-backend-code-review.md) - YAML injection risks

## Overview

Create web UI for editing `users.yaml` and `rule.yaml` config files. Use **form-based approach** (safer than raw YAML editor) with Zod validation. Allows user managers to add/edit/delete users and adjust shift times without file system access. CRITICAL: Must prevent YAML injection attacks.

## Key Insights from Research

**Form-Based > Monaco Editor:**
- **Security:** No direct YAML editing = no injection risk
- **UX:** Guided forms easier for non-technical users
- **Validation:** Zod schemas enforce structure before save
- **Trade-off:** Less flexibility for power users (acceptable for config files)

**YAML Injection Risks:**
- Malicious user inputs: `!!python/object/apply:os.system ['rm -rf /']`
- Prototype pollution via nested keys: `__proto__.isAdmin: true`
- **Mitigation:** Whitelist fields, sanitize strings, validate with Zod, use `yaml.load()` with `schema: yaml.FAILSAFE_SCHEMA`

**React Hook Form + Zod:**
- Already in `package.json` (`react-hook-form: ^7.66.0`, `zod: ^4.1.12`)
- Declarative validation, type-safe, integrates with forms
- `@hookform/resolvers` connects Zod to RHF

## Requirements

**Functional:**
- **User Management:**
  - View list of operators from `users.yaml`
  - Add new user (username, output_name, output_id)
  - Edit existing user (name, ID)
  - Delete user (with confirmation)
  - Save changes to `users.yaml` (preserve comments if possible)
- **Shift Configuration:**
  - Visual editor for shift times (A/B/C)
  - Edit check-in/check-out ranges
  - Edit break windows
  - Save changes to `rule.yaml` (preserve structure)
- **Preview & Validation:**
  - Show preview of YAML before save
  - Validate with Zod schema
  - Show validation errors clearly
  - Rollback on save failure

**Non-Functional:**
- Form submission <200ms
- Preserve YAML comments (if possible, else warn user)
- Atomic writes (no partial saves)
- Backup previous config before overwrite

## Architecture

**Component Hierarchy:**
```
app/config/page.tsx (new route)
  ├─ ConfigTabs
  │   ├─ UserManagementTab
  │   │   ├─ UserList
  │   │   └─ UserForm (add/edit)
  │   └─ ShiftConfigTab
  │       ├─ ShiftEditor (A/B/C)
  │       └─ BreakEditor
  └─ ConfigPreview (YAML preview before save)
```

**Data Flow:**
1. **Load:** API `/api/v1/config/users` returns parsed `users.yaml`
2. **Edit:** User modifies form, Zod validates client-side
3. **Preview:** Generate YAML from form data, show diff
4. **Save:** POST to `/api/v1/config/users` with validated data
5. **Server:** Validate again (server-side Zod), write to filesystem
6. **Rollback:** Keep backup, restore if write fails

**State Management:**
- React Context: `ConfigContext` for shared state (users, shifts)
- React Hook Form: Local form state per tab
- Optimistic updates: Show success immediately, rollback on error

## Related Code Files

**Existing (Modify):**
- `lib/config/yamlLoader.ts` - Add safe save functions
- `types/attendance.ts` - Add config types (if missing)

**New (Create):**
- `app/config/page.tsx` - Main config page (protected route)
- `app/api/v1/config/users/route.ts` - GET/POST for users.yaml
- `app/api/v1/config/shifts/route.ts` - GET/POST for rule.yaml shifts
- `components/config/UserManagementTab.tsx` - User CRUD UI
- `components/config/ShiftConfigTab.tsx` - Shift time editor
- `components/config/UserForm.tsx` - Add/edit user form
- `components/config/ShiftEditor.tsx` - Visual shift time picker
- `components/config/ConfigPreview.tsx` - YAML preview modal
- `lib/config/yamlWriter.ts` - Safe YAML serialization
- `lib/config/validation.ts` - Zod schemas for users/shifts
- `lib/config/__tests__/yamlWriter.test.ts` - Test injection prevention

## Implementation Steps

1. **Define Zod Schemas** (`lib/config/validation.ts`):
   - `UserSchema`: `{ username, output_name, output_id }` - strict string patterns
   - `ShiftSchema`: `{ name, window, check_in, check_out, break_config }`
   - Sanitize: No special chars (`!!`, `__proto__`, etc.)
2. **Create Safe YAML Writer** (`lib/config/yamlWriter.ts`):
   - Use `yaml.dump()` with `schema: yaml.CORE_SCHEMA` (safe subset)
   - Add backup: Copy current file to `.bak` before write
   - Atomic write: Write to temp file, rename on success
   - Preserve comments: Read original, merge (if feasible, else warn)
3. **Create API Routes:**
   - `GET /api/v1/config/users` - Read users.yaml, return JSON
   - `POST /api/v1/config/users` - Validate + write users.yaml
   - `GET /api/v1/config/shifts` - Read rule.yaml shifts section
   - `POST /api/v1/config/shifts` - Validate + update rule.yaml
4. **Create User Management UI:**
   - `UserManagementTab` - Table of users + Add button
   - `UserForm` - React Hook Form with Zod resolver
   - Add/Edit modal with validation errors
   - Delete confirmation dialog
5. **Create Shift Config UI:**
   - `ShiftConfigTab` - Tabs for A/B/C shifts
   - `ShiftEditor` - Time pickers for ranges (use native `<input type="time">`)
   - Visual representation (timeline graphic - optional)
6. **Create Config Preview:**
   - `ConfigPreview` modal - Shows YAML diff (before/after)
   - Syntax highlighting (optional: use `react-syntax-highlighter`)
   - Save/Cancel buttons
7. **Add Route Protection** (optional):
   - Basic auth check (if implementing roles)
   - Warning: "Config changes affect all users"
8. **Test Security:**
   - Try injecting `!!python/object` - should reject
   - Try `__proto__` in username - should sanitize
   - Try SQL injection patterns - should escape
9. **Integration Test:**
   - Add new user via UI, verify in users.yaml
   - Edit shift time, verify in rule.yaml
   - Delete user, confirm removal
   - Test rollback on validation failure
10. **Error Handling:**
    - Show user-friendly errors (not stack traces)
    - Handle filesystem errors (permissions, disk full)
    - Validate before showing preview (prevent bad saves)

## Todo List

- [ ] Create Zod schemas for users and shifts
- [ ] Implement safe YAML writer with backup
- [ ] Create GET `/api/v1/config/users` route
- [ ] Create POST `/api/v1/config/users` route
- [ ] Create GET `/api/v1/config/shifts` route
- [ ] Create POST `/api/v1/config/shifts` route
- [ ] Build `UserManagementTab` component
- [ ] Build `UserForm` component (React Hook Form + Zod)
- [ ] Build `ShiftConfigTab` component
- [ ] Build `ShiftEditor` time picker component
- [ ] Build `ConfigPreview` modal
- [ ] Add validation error displays
- [ ] Test YAML injection prevention (security tests)
- [ ] Test user add/edit/delete flow
- [ ] Test shift config save/rollback
- [ ] Apply Neo Brutalism styling
- [ ] Add loading states during save
- [ ] Test filesystem error handling

## Success Criteria

- [ ] Add new user via UI, persists to users.yaml correctly
- [ ] Edit user name/ID, updates users.yaml
- [ ] Delete user with confirmation, removes from users.yaml
- [ ] Edit shift check-in time, updates rule.yaml
- [ ] YAML structure preserved (no corruption)
- [ ] Injection attempts rejected (test with `!!python`, `__proto__`)
- [ ] Validation errors show clearly (Zod messages)
- [ ] Backup created before each save
- [ ] Rollback works on save failure
- [ ] Config preview shows accurate YAML
- [ ] All security tests pass

## Risk Assessment

**CRITICAL RISK - YAML Injection:**
- **Impact:** RCE, prototype pollution, config corruption
- **Mitigation:**
  1. Whitelist allowed fields (never freeform YAML)
  2. Sanitize strings (reject `!!`, `__proto__`, control chars)
  3. Use `yaml.FAILSAFE_SCHEMA` (no custom types)
  4. Validate with Zod (server-side + client-side)
  5. Write security tests (inject malicious payloads)

**HIGH RISK - Config Corruption:**
- **Impact:** App breaks, manual file editing needed
- **Mitigation:**
  1. Backup before write (`.bak` file)
  2. Atomic writes (temp file + rename)
  3. Validate before write (parse YAML, check structure)
  4. Show preview to user (catch issues early)

**MEDIUM RISK - Comment Loss:**
- **Impact:** Users lose helpful YAML comments
- **Mitigation:**
  1. Warn user: "Comments may be lost"
  2. Future: Parse comments, re-insert (complex)
  3. Alternative: Keep docs separate from config

**Questions:**
- Should we version config files (git-like history)? (Future enhancement)
- Allow export/import configs as backup? (Yes, add download button)
- Protect route with authentication? (Yes if multi-user, else optional)

## Security Considerations

**YAML Injection Prevention (CRITICAL):**
```typescript
// BAD - Allows arbitrary YAML
yaml.load(userInput); // ❌ UNSAFE

// GOOD - Whitelist + sanitize
const schema = z.object({
  username: z.string().regex(/^[a-zA-Z0-9_]+$/), // Alphanumeric only
  output_name: z.string().max(100),
  output_id: z.string().regex(/^TPL\d{4}$/), // Strict pattern
});
const validated = schema.parse(userInput);
yaml.dump(validated, { schema: yaml.CORE_SCHEMA }); // ✅ SAFE
```

**Server-Side Validation (Defense in Depth):**
- Never trust client-side validation alone
- Re-validate all inputs on server (Zod schema)
- Check file permissions before write
- Log config changes (audit trail)

**Filesystem Security:**
- Write to temp file first, rename atomically
- Set proper permissions (644 for config files)
- Handle race conditions (concurrent edits)

## Next Steps After Completion

1. Add config versioning (track changes over time)
2. Export/import configs as JSON/YAML
3. Add role-based access (admin-only editing)
4. Advanced: Visual shift timeline editor
5. Integrate with Phase 1 analytics (show affected users)
