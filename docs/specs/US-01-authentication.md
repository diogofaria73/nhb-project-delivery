# US-01 — Authentication

## Context
Web platform with authentication. All users must authenticate before accessing any functionality. There is no social authentication or SSO at this time.

---

## US-01.1 — Login with email and password

**As a** registered user,
**I want to** log in with my email and password,
**So that** I can access the system securely.

### Acceptance Criteria

- [ ] The login screen is the application's landing page (route `/login`)
- [ ] The form contains the fields **Email** and **Password**
- [ ] The email field validates proper format before submission
- [ ] The password field is of type `password` (characters hidden)
- [ ] Upon submission, the system validates credentials against the database
- [ ] Password is compared via bcrypt hash (never in plain text)
- [ ] On success, a JWT token is generated and stored in the client session
- [ ] The user is redirected to the panel corresponding to their profile:
  - **Administrator** → admin panel (user management)
  - **User** → project dashboard
- [ ] On failure (invalid credentials), display a generic message: _"Incorrect email or password"_ (do not specify which field is wrong)
- [ ] The error message does not reveal whether the email exists in the database

### Business Rules

- BR-01: The JWT token must have an 8-hour validity
- BR-02: Every authenticated request must validate the token on the server
- BR-03: Users with an **inactive** account cannot log in — display: _"Inactive user. Please contact the administrator."_

---

## US-01.2 — Lockout after invalid attempts

**As a** system,
**I want to** temporarily lock accounts with multiple failed login attempts,
**So that** I protect against brute force attacks.

### Acceptance Criteria

- [ ] The system counts invalid login attempts per email
- [ ] After **5 consecutive failed attempts**, the account is temporarily locked for **15 minutes**
- [ ] During lockout, any new attempt displays: _"Account temporarily locked. Please try again in 15 minutes."_
- [ ] The attempt counter is reset after a successful login
- [ ] The counter is automatically reset after the lockout period expires
- [ ] The administrator can manually unlock the account before the timeout (see US-02)

### Business Rules

- BR-04: Lockout is per account (email), not per IP
- BR-05: The remaining lockout time is not displayed to the user for security reasons

---

## US-01.3 — Logout

**As an** authenticated user,
**I want to** end my session,
**So that** no one can access the system in my place.

### Acceptance Criteria

- [ ] There is a **"Sign Out"** button/link visible on all authenticated screens
- [ ] On click, the JWT token is invalidated on the client
- [ ] The user is redirected to the login screen
- [ ] After logout, the browser's "back" button does not allow returning to authenticated pages

---

## Technical Notes

- Communication exclusively via **HTTPS**
- Passwords stored with **bcrypt** (minimum 12 rounds)
- JWT signed with a secret key via environment variable (`JWT_SECRET`)
- Do not store password or token in `localStorage` — use `httpOnly cookie` or `sessionStorage`
