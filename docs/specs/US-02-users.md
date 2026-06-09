# US-02 — User Management

## Context
The system adopts role-based access control (RBAC). There are two profiles: **Administrator** and **User**. Only the Administrator can manage users.

---

## US-02.1 — List users

**As an** Administrator,
**I want to** view all registered users in the system,
**So that** I have visibility of the team and their access profiles.

### Acceptance Criteria

- [ ] The screen displays a list/table with all registered users
- [ ] Columns displayed: **Name**, **Email**, **Profile**, **Status** (Active/Inactive), **Registration date**
- [ ] Filtering by **profile** and **status** is available
- [ ] Searching by name or email is available
- [ ] The list is paginated (maximum 20 records per page)
- [ ] Inactive users are displayed with differentiated styling (e.g., gray text)

---

## US-02.2 — Create user

**As an** Administrator,
**I want to** register new users in the system,
**So that** I can grant access to the team according to their roles.

### Acceptance Criteria

- [ ] The registration form contains the fields:
  - **Full name** (required)
  - **Email** (required, unique in the system)
  - **Profile** (required — selection: Administrator, User)
  - **Initial password** (required) — temporary, will be replaced by the user on first login
  - **Password confirmation** (required)
- [ ] The system validates if the email is already registered before saving
- [ ] The password must have at least **8 characters**
- [ ] The password confirmation must be identical to the password
- [ ] Upon saving, the user is created **Inactive** and flagged with **mustChangePassword = true** (see US-02.6)
- [ ] The form displays an informational notice explaining that the user will be required to change the password on first login and will be activated automatically afterward
- [ ] The success message reinforces the same flow ("They will change the password on first login and be activated automatically")
- [ ] On validation errors, displays a specific message per field

### Business Rules

- BR-06: It is not possible to register two users with the same email
- BR-07: The **Administrator** profile can only be assigned by another Administrator
- BR-08: The password is stored with bcrypt hash (never in plain text)
- BR-13: Users created by an Administrator are persisted as **inactive** and **must change the password on first login**

---

## US-02.3 — Edit user

**As an** Administrator,
**I want to** edit the data of a registered user,
**So that** I can correct information or change the access profile.

### Acceptance Criteria

- [ ] The edit form displays the current user data pre-filled
- [ ] Editable fields: **Name**, **Email**, and **Profile**
- [ ] The password field is displayed blank — it is only changed if a new value is entered
- [ ] If the password is changed, password confirmation is required
- [ ] Upon saving, displays a success message
- [ ] The Administrator can edit their own data, except their own profile

### Business Rules

- BR-09: An Administrator cannot downgrade their own profile to prevent access loss
- BR-10: Email change validates uniqueness before saving

---

## US-02.4 — Activate and deactivate user

**As an** Administrator,
**I want to** activate or deactivate a user's account,
**So that** I can control access without needing to delete records.

### Acceptance Criteria

- [ ] In the user list, each record has an action to **Deactivate** (for active users) or **Activate** (for inactive users)
- [ ] When deactivating, the system displays a confirmation before executing
- [ ] A deactivated user cannot log in (see US-01.1)
- [ ] If the deactivated user has an active session, it is terminated on the next request
- [ ] The user's history and data are preserved
- [ ] Displays a success message after the action

### Business Rules

- BR-11: An Administrator cannot deactivate their own account
- BR-12: There must always be at least one active Administrator in the system

---

## US-02.5 — Unlock user

**As an** Administrator,
**I want to** manually unlock a user account locked due to login attempts,
**So that** I can restore access without waiting for the automatic timeout.

### Acceptance Criteria

- [ ] On the edit or listing screen, locked users are identified with a visual indicator
- [ ] The Administrator can click **"Unlock"** to immediately release access
- [ ] After unlocking, the attempt counter is reset
- [ ] Displays a success message after the action

---

## US-02.6 — Mandatory password change on first login

**As a** newly created User,
**I want to** be required to change the temporary password the Administrator set on my account during my first login,
**So that** I am the only one who knows my access credentials and my account can be activated automatically.

### Acceptance Criteria

- [ ] When a new user is created (US-02.2), the system persists them with `isActive = false` and `mustChangePassword = true`
- [ ] Authentication endpoint accepts login for users with `mustChangePassword = true` even when `isActive = false` (carve-out of BR-03)
- [ ] Successful authentication for such a user redirects to a dedicated **First-login password change** screen — the user cannot reach any other authenticated route until the change is completed
- [ ] The First-login screen displays:
  - A clear notice explaining why the change is mandatory and that the account will be activated upon success
  - Fields: **current password**, **new password**, **confirm new password**
  - Validation: minimum 8 characters, confirmation must match, new password must differ from the current one
- [ ] On successful change:
  - The user's password is updated (bcrypt hash, per BR-08)
  - `mustChangePassword` is cleared to `false`
  - `isActive` is set to `true` automatically
  - The session continues without requiring a new login; user is redirected to their default landing page (`/users` for Admin, `/account` for User)
- [ ] On failure (wrong current password, validation error), the user remains on the First-login screen with an explanatory message
- [ ] A user whose `mustChangePassword` flag is already `false` and tries to access the First-login screen is redirected to the home route
- [ ] The change-password REST endpoint (`PATCH /users/me/password`) is the same one used by the regular Account screen and applies the auto-activation behavior whenever `mustChangePassword = true`

### Business Rules

- BR-03 (revised): Inactive users cannot log in **unless** they still owe a mandatory first-login password change
- BR-13: Users created by an Administrator are persisted as **inactive** with `mustChangePassword = true`
- BR-14: A user authenticated under the first-login flow has a JWT marked with `mustChangePassword = true`; the front-end must restrict navigation to the First-login screen until the flag is cleared
- BR-15: A successful mandatory password change atomically clears `mustChangePassword` and activates the user
- BR-16: The auth response (`POST /auth/login`, `GET /auth/me`) exposes `mustChangePassword` and a `redirectTo` hint so clients can enforce the flow

### Technical Notes

- The flag lives on `User` (`must_change_password BOOLEAN NOT NULL DEFAULT false`); migration `add_must_change_password`
- Domain methods on the `User` entity: `requirePasswordChange()`, `clearPasswordChangeRequirement()`
- `ChangePasswordUseCase` is the single source of truth: when `user.mustChangePassword === true`, it both clears the flag and activates the user before persisting
- `/auth/me` queries the database (not the JWT) so the front-end gets the fresh `mustChangePassword` / `isActive` after the change without needing a re-login
- Front-end guard lives in `AdminLayout`: any authenticated user with `mustChangePassword = true` is force-redirected to `/first-login`

---

## Permission Matrix — Users

| Action                                  | Administrator | User |
|-----------------------------------------|:---:|:---:|
| List users                              | Y  | N  |
| Create user                             | Y  | N  |
| Edit user                               | Y  | N  |
| Activate / Deactivate                   | Y  | N  |
| Unlock                                  | Y  | N  |
| Edit own profile                        | Y  | Y  |
| Complete mandatory first-login change   | Y  | Y  |

---

## Technical Notes

- Route protected by authentication middleware and profile verification
- Any User access to user management routes must return `403 Forbidden`
- Passwords are never returned in API responses (not even hashed)
