This is a very large request, so I've grouped it into phases that each leave the site working. Phase 1 and 2 are the security and "nothing works" fixes; Phase 3+ is the visual/feature upgrade.

Two things need your input before they can work at all (details at the end): real **email delivery** and **SMS/WhatsApp**.

---

## Phase 1 — Login, roles and OTP (highest priority)

**Three separate login buttons** — Admin (you, the developer), Chairman (your father), Member.
- Each button opens its own login screen. A role is never auto-upgraded: signing in on the Member screen gives member access even if the account is an admin, and the Admin/Chairman screens refuse any account without that role and immediately sign it back out. This removes the "signed in as a member — no Chairman rights" confusion, because each door only opens for its own role.
- Admin and Chairman logins add a second step: after the password is verified, a 6-digit code is emailed to the account's registered email and access is granted only when the code matches (10-minute expiry, limited attempts, all attempts logged). Member login stays password-only.
- Logout is visible in the header and in the portal sidebar for all three roles, always.

**Registration**
- "Register as Chairman / Admin" button on the Admin and Chairman login screens. The form requires the **existing admin's email**; the request is emailed to that admin for approval and the new account gets admin rights only after approval. Admin email is mandatory and must be unique.
- Member registration: email optional, mobile mandatory, plus an **alternative mobile number** for both members and admins.
- Password rules enforced everywhere: longer than 8 characters with at least one uppercase, one lowercase, one digit and one special character. A live strength bar below the field shows Weak / Moderate / Strong / Extra Strong, the reason it's rejected, a "show password" toggle, a "suggest a strong password" button, and an exact mismatch reason on confirm. Fields use browser password-manager attributes so Google offers to save the password.
- The "Password is known to be weak" error comes from the leaked-password check; the strength rules and generator will steer users away from it, and the message will be rewritten in plain language.
- "Please confirm your email, then sign in" disappears: signup completes and signs the user straight in.

**Recovery**
- Login ID and password recovery match on email, mobile, alternative mobile, or Aadhaar across member records, applications and profiles, so registered members stop getting "No account found".
- Reset links are sent by real email (see blockers) and every recovery attempt is logged.

## Phase 2 — Make the portal actually do things

- Chairman approval of a membership application now creates the member record, flips the application status, and the person appears immediately in Registered Members.
- Admin/Chairman can **delete** members, documents, audit reports, photos, achievements, schemes and notifications — removed from the interface and the database.
- Notifications: send to one person or broadcast to everyone; recipients see them in the portal immediately and get an email; users can delete a notification they received; the sender can recall a wrong one.
- Admin/Chairman see full member details (identity, Aadhaar, location, contact) in Registered Members; the public list stays limited.
- Anything the Chairman publishes (promo photos, achievements, dams, schemes, notices) goes live instantly for everyone.
- **Admin activity log**: invites, role changes, approvals/rejections, password changes, deletions and document/audit edits, with timestamp and actor.
- "Register or access your member portal" and the How-to-Register roadmap only show to visitors who are not signed in.

## Phase 3 — Homepage and theme rebuild

Layout in this order, government-portal style, with the blurred glass treatment you asked for:
1. Top utility bar: social icons (Instagram/Facebook/YouTube — each appears only once the Chairman adds a link), text-size controls, skip-to-content.
2. New custom emblem (our own, not the Government of India emblem) + the organization name large and centered in a strong display font + PMMSY-style badge that links to the schemes section.
3. Advanced navy menu bar with dropdowns, matching your screenshot.
4. Scrolling notice bar, editable by the Chairman from a button in the portal.
5. Auto-playing slideshow of Chairman-uploaded media.
6. Aim & Objectives block, numbered, as in your screenshot.
7. Scheme cards (fisheries schemes) reshaped as modern rounded cards with a "Click Here" action.
8. Achievements snapshots on blurred white panels.
9. Member portal CTA + "How to Register?" roadmap (visitors only).
10. FAQ accordion (AI-generated fisheries/registration questions in the same style as your screenshot).
11. Grievance form matching your screenshot.
12. Rich footer: quick links, key schemes, contact, helpline, slogans, and a **visitor counter**.

New logo generated, slogans and dialogues added throughout.

## Phase 4 — AI assistant upgrade

- Answers in the user's chosen language from your uploaded documents, and cites the source file (and page where available) for each answer.
- When it isn't confident, it escalates the question to the Chairman/Admin panel, and the reply comes back into the user's chat.
- Auto-suggest of follow-up questions.

---

## Technical notes

- Database additions: `login_otps`, `admin_activity_log`, `visitor_counter`, `site_links` (social), `notice_bar` content, `alt_phone` columns, plus approval trigger fixes and delete policies. RLS + GRANTs on each.
- Login moves fully to server functions so role checks and OTP verification can't be bypassed from the browser; the client never decides who is an admin.
- Document text is indexed for the AI so citations are real, not guessed.
- Vercel hosting is possible later, but publishing from Lovable already gives you a live link on the same backend — simpler to keep one deployment.

## Two blockers I need from you

1. **Email** — OTP codes, reset links and Chairman notifications need a real sender. The built-in auth mail is rate-limited and unreliable for this. I recommend connecting Resend (free tier covers your volume) with a verified sender address.
2. **SMS / WhatsApp** — there is no free provider. Twilio or GatewayAPI both need a paid account and an API key. Until you provide one, all OTP and notifications go by email + in-portal, which works today at no cost. I'll build the SMS layer behind a switch so it starts working the moment you add the key.

I'll start with Phase 1 as soon as you approve, and go phase by phase so you can test each one.
