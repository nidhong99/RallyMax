# Changelog

All notable changes to the RallyMax platform are documented in this file.
This project follows human-readable changelog guidelines based on [Keep a Changelog](https://keepachangelog.com/).

---

## [Unreleased] - 2026-10-19

### 🛡️ Access Control & UX Improvements (Player vs. Host)
- **Restricted Event Creation to Hosts & Admins**:
  - Removed "+ Create Session" quick action button from the top navbar ([Navigation.tsx](src/components/Navigation.tsx)) for `PLAYER` accounts.
  - Removed "+ Create session now" empty-state button in [EventExplorer.tsx](src/components/EventExplorer.tsx) for `PLAYER` accounts.
  - Completely hid the "Hosting" sub-tab, create buttons, and row "Clone" buttons in [MyEventsView.tsx](src/components/MyEventsView.tsx) from `PLAYER` accounts.
  - Guarded the "Clone Session" (Sao chép) action in [EventDetailModal.tsx](src/components/EventDetailModal.tsx) to require active host or admin permissions (`isCurrentUserHost`).
- **Early Permission Guard in Event Creation Modal**:
  - Added an early access check in [CreateEventModal.tsx](src/components/CreateEventModal.tsx). If a `PLAYER` user opens the modal, an Astryx `Banner` is displayed immediately with an explanation and a "Close" button.
  - The multi-step form fields, location inputs, and submit button are completely withheld so non-hosts never waste time filling out details only to be blocked upon submission.

### 🔐 Authentication & Role Permissions
- **Database-Driven Role System**:
  - Removed all hardcoded email addresses (`nidhong99@gmail.com`, `75dangtheanh@gmail.com`) across [AppContext.tsx](src/context/AppContext.tsx), [Navigation.tsx](src/components/Navigation.tsx), [EventExplorer.tsx](src/components/EventExplorer.tsx), and [AdminDashboardView.tsx](src/components/AdminDashboardView.tsx).
  - All access rights, hosting privileges, and administrative tabs are now 100% determined dynamically from `currentUser.role` (`'ADMIN'`, `'HOST'`, `'PLAYER'`) stored in Supabase `profiles`.
  - Fixed an unhandled reference to `email` inside `login()` in [AppContext.tsx](src/context/AppContext.tsx).

### 🔁 Recurring Sessions & Series Support
- **Multi-Session Generation**:
  - Added recurring event generation in [CreateEventModal.tsx](src/components/CreateEventModal.tsx) supporting Weekly (`WEEKLY`) and Daily (`DAILY`) cycles up to 12 sessions per series.
  - Introduced `recurrence_group_id`, `recurrence_frequency`, `recurrence_index`, and `recurrence_count` fields in `Event` schema ([src/types/database.ts](src/types/database.ts)).
- **Series Navigation & Visual Badges**:
  - Added teal recurring badges (`Định kỳ i/n` / `Recurring i/n`) on [EventCard.tsx](src/components/EventCard.tsx) and [MyEventsView.tsx](src/components/MyEventsView.tsx).
  - Added interactive sibling session switcher in [EventDetailModal.tsx](src/components/EventDetailModal.tsx) to jump between dates in the same series.
- **Supabase Migration**:
  - Added idempotent migration script at `supabase/migrations/20261019_add_recurring_events.sql` to apply the columns without downtime or data loss.

### 🏸 User Application Feedback on Event Cards
- **Joined Status Badges on Cards**:
  - Updated [EventCard.tsx](src/components/EventCard.tsx) with real-time status indicators (`✅ Đã duyệt giữ chỗ`, `⏳ Chờ duyệt`, `🏸 Đã check-in`) so players immediately know whether they have already applied or been confirmed for a session without opening the modal.
- **Dynamic CTA Button**:
  - The primary action button on event cards updates dynamically:
    - Host: `"Quản lý kèo"` / `"Manage"`
    - Applied Player: `"Xem đơn"` / `"View Application"`
    - New Player: `"Tham gia"` / `"Join"`

### 📖 Documentation & Developer Onboarding
- **Unified Developer Onboarding Guide ([README.md](README.md))**:
  - Consolidated `SUPABASE_SETUP_GUIDE.md` and `ROLE_BASED_ACCESS_CONTROL_GUIDE.md` into a single, comprehensive onboarding guide at the repository root.
  - Includes 5-minute quickstart, complete BCNF database schema with recurring events and role-based columns, OAuth configurations, RLS security policies, and permission matrix.

---

## Reference Guides
- [README.md](README.md): Master onboarding guide, quickstart, and unified setup documentation.
- [ROLE_BASED_ACCESS_CONTROL_GUIDE.md](ROLE_BASED_ACCESS_CONTROL_GUIDE.md): Architectural guide on roles, permissions matrix, and Supabase RLS policies.
- [SUPABASE_SETUP_GUIDE.md](SUPABASE_SETUP_GUIDE.md): Setup instructions, environment variables, and migration instructions.

