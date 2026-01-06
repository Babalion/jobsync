# JobSync Extension Plan

This roadmap proposes extensions to the current JobSync codebase (job tracking, dashboard, admin catalogs, map, import/export). It is organized by phases and rated by benefit, ease, and complexity.

## Rating scale
- Benefit: Low, Medium, High
- Ease: Easy, Medium, Hard (delivery effort using existing patterns)
- Complexity: Low, Medium, High (architectural risk or new infrastructure)

## Roadmap
| Phase | Feature | Primary benefit | Ease | Complexity |
| --- | --- | --- | --- | --- |
| Short | Interview and contact tracking | Centralize interview rounds and recruiter info | Medium | Medium |
| Short | CSV import and backup/restore | Faster onboarding and safer data portability | Easy | Low |
| Short | Custom status and job source management | Tailor the pipeline to personal workflows | Medium | Medium |
| Short | TODOs hub and next-step assistant | Clear daily priorities and guided actions | Medium | Medium |
| Short | Notification center | Centralize alerts, errors, and auto-added job updates | Medium | Medium |
| Mid | Kanban board and bulk actions | Quick status changes and pipeline visibility | Medium | Medium |
| Mid | Calendar view and reminders | Avoid missed deadlines and follow-ups | Medium | High |
| Mid | Google Calendar sync | Keep deadlines in the user's primary calendar | Hard | High |
| Mid | Tags and saved filters | Organize large job lists and reuse queries | Medium | Medium |
| Mid | Analytics and company insights | Identify strong sources and bottlenecks | Medium | Medium |
| Long | Resume and cover letter system (profile, builder, per-job variants) | Consistent materials that adapt per application | Hard | High |
| Long | AI assistant (summary, resume match, templates) | Speed up prep and improve relevance | Hard | High |
| Long | Automated capture (browser extension + email/newsletter ingestion) | One-click intake from job sources | Hard | High |
| Long | Mobile app (multi-platform) with Firebase sync | On-the-go updates, offline, and push alerts | Hard | High |
| Long | Company ratings and reviews integration | Better company screening signals | Hard | High |

## Feature elaboration
### Interview and contact tracking
Add CRUD for contacts and interviews and surface them on job details. The schema already includes `Contact` and `Interview`, so the main work is UI and actions.
Notes:
- Add `scheduledAt`, `round`, and `locationType` fields to `Interview` if needed.
- Build actions similar to `jobLocation.actions.ts`, plus client components under `src/components/interviews`.
- Add an interview timeline or list inside `dashboard/myjobs/[id]`.

### CSV import and backup/restore
Provide a CSV upload flow that maps columns to job fields and validates with existing schemas.
Notes:
- Reuse `papaparse` and `AddJobFormSchema` like `ImportJobJSON`.
- Add column mapping and preview before writing to the DB.
- Offer a full JSON backup endpoint and restore flow for jobs, companies, titles, and locations.

### Custom status and job source management
Let users define their own pipeline stages and sources instead of only seeded values.
Notes:
- Add admin tabs for `JobStatus` and `JobSource` similar to companies and locations.
- Decide whether statuses are global or per-user; per-user needs schema changes.
- Prevent deletion of statuses or sources that are in use.

### TODOs hub and next-step assistant
Add a main `dashboard/todos` page that summarizes actionable next steps and suggested follow-ups.
Notes:
- Create a `Todo` or `ActionItem` model or derive tasks from job status, due dates, and interviews.
- Group items by urgency (overdue, due soon, follow-up, waiting) with quick actions (mark done, snooze).
- Start with rule-based suggestions and optionally add AI suggestions behind a toggle.
- Allow user-defined goals (applications per week) and surface progress.

### Notification center
Add a unified inbox for system messages, alerts, and auto-generated events.
Notes:
- Create a `Notification` model with type, severity, title, body, and links to jobs or companies.
- Auto-create notifications for approaching deadlines, auto-imported jobs, and failed integrations.
- Provide a bell icon with unread count, filtering (errors vs info), and bulk dismiss.
- Store read/dismiss state and optionally surface a daily digest.

### Kanban board and bulk actions
Create a drag-and-drop board view and faster multi-select updates.
Notes:
- Add a `dashboard/board` route with columns for each status.
- Use existing `updateJobStatus` to persist drag-and-drop changes.
- Add bulk actions to the list view (multi-select, status update, delete).

### Calendar view and reminders
Visualize deadlines and interview dates and send reminder notifications.
Notes:
- Add a `dashboard/calendar` view using `react-day-picker` or a calendar library.
- Show `dueDate`, `appliedDate`, and interview dates in a single timeline.
- Introduce a `Notification` model and a scheduled job for reminders.

### Google Calendar sync
Keep JobSync dates in the user's Google Calendar.
Notes:
- Add OAuth consent flow and store refresh tokens securely.
- Map jobs and interviews to events with stable IDs for idempotent sync.
- Decide sync direction (one-way export vs two-way) and handle conflicts.
- Respect time zones and allow per-user calendar selection.

### Tags and saved filters
Support richer organization for large job lists.
Notes:
- Add `Tag` and `JobTag` tables and a tag selector in the job form.
- Store saved filters and sort options per user.
- Add tag-based filters and quick filter chips in the list view.

### Analytics and company insights
Expand dashboard metrics to answer conversion and source-quality questions.
Notes:
- Extend `dashboard.actions.ts` with funnel metrics and time-to-interview stats.
- Add charts for source performance and status transitions.
- Surface company-level summaries (applications per company, outcome ratios).

### Resume and cover letter system (profile, builder, per-job variants)
Create a profile hub for skills, education, and experience, then generate resumes and cover letters.
Notes:
- Add `Profile`, `Skill`, `Education`, and `Experience` models tied to the user.
- Build a guided resume builder with templates and PDF export (Lebenslauf.de-style layouts).
- Store versions in a `Document` model and attach them to jobs for per-application variants.
- LinkedIn import should use user-provided export files or manual mapping to avoid API restrictions.
- Allow per-job tuning (highlighted skills, tailored summary, custom sections).

### AI assistant (summary, match, templates)
Use LLMs to extract key details and speed up preparation.
Notes:
- Add an AI service wrapper (LangChain plus OpenAI or local LLM).
- Generate job summaries, key skills, and fit scores from descriptions.
- Offer resume and cover letter optimization suggestions with user review.
- Provide interview prep prompts and question lists per job.

### Automated capture (browser extension + email/newsletter ingestion)
Reduce manual entry by capturing jobs from external sources.
Notes:
- Build a browser extension that posts job URLs to an intake endpoint.
- Add OpenGraph and basic HTML parsing for auto-fill fields.
- Add email ingestion for job alerts and newsletters and parse structured job fields.
- Deduplicate by company, title, and URL before creating new records.

### Mobile app (multi-platform) with Firebase sync
Provide a mobile companion for quick updates, offline access, and notifications.
Notes:
- Pick a cross-platform stack (React Native + Expo) and reuse API contracts.
- Decide whether Firebase is a sync layer or primary backend and keep self-hosted users in mind.
- Add push notifications for reminders and interviews.
- Ensure offline edits are queued and reconciled on reconnect.

### Company ratings and reviews integration
Surface employee sentiment and company signals within the company view.
Notes:
- Verify data sources and terms of service; prefer official APIs or licensed datasets.
- Cache ratings and update on a schedule to avoid rate limits.
- Add fields to `Company` for rating summary and review links.
