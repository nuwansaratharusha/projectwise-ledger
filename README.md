# Project Ledger Pro

Build a production-quality responsive web application named “Project Ledger”.

PROJECT PURPOSE

Project Ledger is a simple, modern and premium project management and financial tracking application for a freelancer, small studio or independent business owner.

The application must track two main categories of projects:

1. Client Projects

   Projects completed for clients that generate direct revenue.

2. Investment Projects

   Internal projects, owned websites, products, content initiatives and personal-brand projects that consume time or money and may generate future value.

The system must make it easy to answer these questions:

- What projects am I currently working on?

- Which projects are completed?

- Which projects are late?

- How much money should I receive?

- How much money have I already received?

- Which client payments are overdue?

- How much money have I invested in internal projects?

- How much investment budget remains?

- What milestones are unfinished?

- Which projects require immediate attention?

TECHNOLOGY

Use the standard Lovable stack:

- React

- TypeScript

- Vite

- Tailwind CSS

- shadcn/ui

- Lucide icons

- Supabase PostgreSQL database

- Supabase authentication

- Supabase Row Level Security

Use real database data throughout the application. Do not leave the final application dependent on hardcoded frontend mock data.

PRODUCT PRINCIPLES

The product must be:

- Minimal

- Professional

- Premium

- Fast

- Easy to understand

- Responsive

- Accessible

- Suitable for desktop, tablet and mobile

- Designed for daily use

- Free from unnecessary visual clutter

Do not make it look like a generic admin template.

Avoid:

- Excessive gradients

- Large decorative illustrations

- Glassmorphism everywhere

- Heavy drop shadows

- Too many charts

- Too many dashboard cards

- Unnecessary animations

- Bright colours without meaning

- Overcrowded navigation

Use whitespace, typography, alignment, subtle borders and clear hierarchy to create the premium appearance.

BRAND AND VISUAL STYLE

Application name: Project Ledger

Tagline:

“Projects, progress, payments and investments in one place.”

Visual direction:

- Neutral white and light grey surfaces in light mode

- Deep charcoal and slate surfaces in dark mode

- One restrained primary accent colour

- Green only for successful or paid states

- Amber for warnings and pending states

- Red for overdue, failed or critical states

- Muted blue or indigo for active work

- Thin borders

- Subtle shadows only where necessary

- Rounded corners between 8px and 12px

- Use Geist or Inter as the main typeface

- Use tabular numbers for financial values where appropriate

- Support light and dark modes

- Maintain strong colour contrast

Use consistent status badges throughout the application.

APPLICATION LAYOUT

Create a desktop layout with:

1. Collapsible left sidebar

2. Top navigation bar

3. Main content area

4. Global search

5. “New Project” primary action

6. User menu

7. Light and dark theme switcher

Sidebar navigation:

- Dashboard

- Projects

- Payments

- Investments

- Clients

- Reports

- Settings

The Payments page should show financial transactions and client receivables.

The Investments page should show only investment projects and investment expenses.

On mobile, replace the sidebar with a clean mobile navigation drawer.

AUTHENTICATION

Create:

- Sign-in page

- Sign-up page

- Forgot-password flow

- Sign-out functionality

- Protected application routes

Use Supabase Auth.

Every user must only be able to view, create, update and delete their own data.

Create a profiles table connected to auth.users.

DATABASE STRUCTURE

Create the following database tables.

1. profiles

Fields:

- id: uuid, primary key, references auth.users

- full_name: text

- business_name: text, nullable

- default_currency: text, default “USD”

- timezone: text, nullable

- avatar_url: text, nullable

- created_at: timestamptz

- updated_at: timestamptz

2. clients

Fields:

- id: uuid, primary key

- user_id: uuid, references profiles.id

- name: text, required

- company_name: text, nullable

- email: text, nullable

- phone: text, nullable

- website: text, nullable

- address: text, nullable

- notes: text, nullable

- status: enum or text with values active, inactive

- created_at: timestamptz

- updated_at: timestamptz

3. projects

Fields:

- id: uuid, primary key

- user_id: uuid, references profiles.id

- client_id: uuid, nullable, references clients.id

- name: text, required

- slug: text

- description: text, nullable

- project_type: enum with values client, investment

- work_mode: enum with values one_time, recurring, internal_product, content_branding

- status: enum with values planned, active, waiting, on_hold, completed, archived

- priority: enum with values low, medium, high, urgent

- currency: text

- agreed_value: numeric, default 0

- investment_budget: numeric, default 0

- start_date: date, nullable

- target_date: date, nullable

- completed_at: timestamptz, nullable

- expected_outcome: text, nullable

- next_action: text, nullable

- cover_color: text, nullable

- created_at: timestamptz

- updated_at: timestamptz

Rules:

- client_id may be null for investment projects.

- agreed_value is mainly used for client projects.

- investment_budget is mainly used for investment projects.

- Do not automatically mark a project completed when milestones are completed.

- The user must explicitly complete a project.

4. milestones

Fields:

- id: uuid, primary key

- user_id: uuid, references profiles.id

- project_id: uuid, references projects.id with cascade delete

- title: text, required

- description: text, nullable

- status: enum with values not_started, in_progress, done

- due_date: date, nullable

- billable_amount: numeric, default 0

- sort_order: integer

- completed_at: timestamptz, nullable

- created_at: timestamptz

- updated_at: timestamptz

5. transactions

Use this as a financial ledger.

Fields:

- id: uuid, primary key

- user_id: uuid, references profiles.id

- project_id: uuid, references projects.id with cascade delete

- transaction_type: enum with values income, expense

- category: text

- amount: numeric, required and greater than zero

- currency: text

- transaction_date: date

- expected_date: date, nullable

- status: enum with values expected, completed, cancelled

- payment_method: text, nullable

- reference_number: text, nullable

- notes: text, nullable

- created_at: timestamptz

- updated_at: timestamptz

Transaction categories may include:

Income:

- Deposit

- Milestone Payment

- Final Payment

- Maintenance Fee

- Other Income

Expense:

- Hosting

- Domain

- Software

- Contractor

- Marketing

- Photography

- Design

- Development

- Content

- Other Expense

6. project_notes

Fields:

- id: uuid, primary key

- user_id: uuid, references profiles.id

- project_id: uuid, references projects.id with cascade delete

- content: text, required

- created_at: timestamptz

- updated_at: timestamptz

7. activity_logs

Fields:

- id: uuid, primary key

- user_id: uuid, references profiles.id

- project_id: uuid, nullable, references projects.id with cascade delete

- action_type: text

- title: text

- description: text, nullable

- metadata: jsonb, nullable

- created_at: timestamptz

Create useful database indexes for:

- user_id

- project_id

- project status

- project type

- target date

- transaction date

- expected transaction date

- client id

SECURITY

Enable Row Level Security on all user-owned tables.

Create policies so authenticated users can only:

- Select their own records

- Insert records containing their own user ID

- Update their own records

- Delete their own records

Do not expose one user’s project, client, milestone, transaction, note or activity data to another user.

Ensure user ownership is assigned safely and is not dependent only on a frontend form value.

CALCULATED FINANCIAL VALUES

Do not manually store duplicate financial totals when they can be calculated from transactions.

For client projects calculate:

Total received:

Sum of completed income transactions.

Expected income:

Sum of expected income transactions.

Balance due:

Maximum of agreed project value minus total received, or zero.

Payment progress:

Total received divided by agreed project value multiplied by 100.

Automatically display payment status:

- Not Applicable when the project is an investment project

- Unpaid when agreed value is greater than zero and total received is zero

- Partially Paid when total received is greater than zero but less than agreed value

- Paid when total received is equal to or greater than agreed value

- Overdue when an expected income transaction is past its expected date and is not completed

For investment projects calculate:

Total spent:

Sum of completed expense transactions.

Remaining investment budget:

Investment budget minus total spent.

Budget usage percentage:

Total spent divided by investment budget multiplied by 100.

Show an over-budget warning when total spent exceeds investment budget.

Do not perform foreign exchange conversion in version one.

Each project should use one selected currency.

PROJECT PROGRESS

Calculate project progress from milestone statuses:

- A completed milestone contributes 100 percent.

- An in-progress milestone contributes 50 percent.

- A not-started milestone contributes 0 percent.

If a project has no milestones, show progress as unavailable instead of showing a misleading zero.

Allow users to reorder milestones.

DASHBOARD

Build a clean dashboard with the following summary metrics:

1. Outstanding Receivables

   Sum of balances due from active client projects.

2. Collected This Month

   Sum of completed income transactions during the current month.

3. Active Client Projects

   Count of client projects with active status.

4. Active Investment Projects

   Count of investment projects with active status.

5. Overdue Items

   Number of overdue projects and overdue expected payments.

6. Investment Spent

   Sum of completed investment-project expenses.

Below the metrics, display:

- Projects requiring attention

- Upcoming project deadlines

- Overdue expected payments

- Recently recorded transactions

- Recently completed milestones

- Recent project activity

A project requires attention when:

- Its target date is overdue and it is not completed

- It has an overdue expected payment

- Its priority is urgent

- It is an investment project that exceeded its budget

- It has an active status but no recent activity

Keep the dashboard concise. Do not use large decorative charts.

PROJECTS PAGE

Create a project table as the default view.

Table columns:

- Project

- Client or Brand

- Type

- Status

- Priority

- Progress

- Financial Position

- Target Date

- Actions

For a client project, Financial Position should show:

- Amount received

- Balance due

For an investment project, Financial Position should show:

- Amount spent

- Remaining budget

Add:

- Search by project or client name

- Filter by project type

- Filter by work mode

- Filter by project status

- Filter by priority

- Filter by payment status

- Filter by overdue state

- Sort by project name

- Sort by target date

- Sort by newest

- Sort by oldest

- Sort by project value

- Sort by balance due

- Clear all filters

- Empty state

- Loading state

- Error state

Add a table and card view switcher.

The table view should remain the default on desktop.

PROJECT CREATION

Create a “New Project” dialog or side sheet.

Use a clear multi-section form, not a long confusing form.

Section 1: Basic information

- Project name

- Project description

- Project type

- Work mode

- Status

- Priority

Section 2: Client or ownership

For client projects:

- Select an existing client

- Add a new client inline

For investment projects:

- Show “Internal / Owned Project”

- Client selection should not be required

Section 3: Financial information

For client projects:

- Currency

- Agreed value

For investment projects:

- Currency

- Investment budget

- Expected outcome

Section 4: Schedule

- Start date

- Target date

- Next action

Validate all inputs and display clear inline error messages.

PROJECT DETAILS EXPERIENCE

When a project row is clicked, open a large responsive side drawer on desktop.

Allow a full-page detail route on mobile or when opened directly through a URL.

The project details area should include:

Header:

- Project name

- Client or internal brand

- Type badge

- Status badge

- Priority

- Progress

- Target date

- Edit project action

- Complete project action

- Archive project action

- More-actions menu

Tabs:

1. Overview

2. Milestones

3. Money

4. Notes

5. Activity

OVERVIEW TAB

Display:

- Description

- Project type

- Work mode

- Client

- Status

- Priority

- Start date

- Target date

- Next action

- Expected outcome for investments

- Financial summary

- Progress summary

MILESTONES TAB

Allow users to:

- Add milestone

- Edit milestone

- Delete milestone

- Change milestone status

- Reorder milestones

- Set due date

- Set optional billable amount

Display overdue milestone warnings.

Use optimistic UI carefully, with proper failure handling.

MONEY TAB

For client projects display:

- Agreed project value

- Total received

- Balance due

- Expected payments

- Payment completion percentage

- Transaction history

For investment projects display:

- Investment budget

- Total spent

- Remaining budget

- Budget usage

- Expense history

Allow users to:

- Add expected payment

- Record payment received

- Record expense

- Edit transaction

- Delete transaction

- Mark expected payment as completed

- Cancel expected transaction

Display transactions in chronological order with:

- Date

- Type

- Category

- Amount

- Status

- Reference

- Notes

- Actions

Use clear confirmation dialogs before destructive actions.

NOTES TAB

Allow users to:

- Add project note

- Edit note

- Delete note

Show the date and time for each note.

Keep the note system simple and text-based.

ACTIVITY TAB

Record and display meaningful events such as:

- Project created

- Project status changed

- Project completed

- Project archived

- Milestone added

- Milestone completed

- Payment recorded

- Expense recorded

- Note added

- Target date changed

Display activity in a clean chronological timeline.

Do not create excessive activity records for every minor interface interaction.

PAYMENTS PAGE

Create a financial ledger page focused on client income.

Display:

- Outstanding receivables

- Received this month

- Overdue expected payments

- Recently received payments

Create a table with:

- Date

- Expected date

- Project

- Client

- Category

- Amount

- Status

- Payment method

- Reference

- Actions

Filters:

- Completed

- Expected

- Overdue

- Cancelled

- Project

- Client

- Date range

- Category

Allow CSV export of the currently filtered transaction list.

INVESTMENTS PAGE

Show only investment projects.

Display:

- Total investment budgets

- Total amount spent

- Remaining combined budget

- Number of over-budget projects

Create a table or clean list with:

- Project

- Status

- Progress

- Budget

- Amount spent

- Remaining budget

- Budget usage

- Target date

Highlight over-budget projects clearly but not aggressively.

CLIENTS PAGE

Create a client directory.

Display:

- Client or company name

- Active projects

- Completed projects

- Total agreed project value

- Total received

- Outstanding balance

- Contact information

Clicking a client should open a client detail page or drawer showing:

- Client information

- Active projects

- Completed projects

- Payment history

- Outstanding balances

- Notes

REPORTS PAGE

Keep reports simple in version one.

Include:

- Income by month

- Expenses by month

- Income versus expenses

- Client project value

- Outstanding receivables

- Investment spending by category

- Project completion count

Allow date-range filtering.

Use only a few clear charts where charts add genuine value.

Also include a downloadable CSV export for:

- Projects

- Clients

- Transactions

- Milestones

SETTINGS PAGE

Include:

- Full name

- Business name

- Default currency

- Timezone

- Theme preference

- Data export

- Account sign-out

Do not build complex organisation or team-management features in version one.

GLOBAL SEARCH

Add a global search input in the top navigation.

Search across:

- Project names

- Client names

- Project descriptions

- Project notes

Search results should be grouped by entity type.

QUICK ACTIONS

Add a “New” button with actions:

- New project

- New client

- Record payment

- Record expense

- Add milestone

Optionally add a Command/Ctrl + K command palette after the core product is stable.

DATE AND CURRENCY FORMATTING

Use the user’s chosen default currency where no project-specific currency exists.

Format monetary values consistently.

Show negative or over-budget values clearly.

Use locale-aware dates.

Use relative text only when helpful, such as:

- Due tomorrow

- 3 days overdue

- Paid 2 days ago

Always make the exact date available.

RECURRING PROJECTS

Support recurring work such as website maintenance.

For recurring projects display:

- Billing frequency: monthly, quarterly, yearly or custom

- Next billing date

- Recurring fee

- Active, paused or ended recurring state

Do not automatically charge clients.

The system may create an expected transaction for the next billing period, but the user must record the actual payment manually.

If recurring functionality makes the first implementation too complex, create the database-compatible UI and mark automated billing-period generation as a second-phase feature.

SAMPLE DATA

After authentication, provide an optional “Load sample projects” action.

Use the following sample projects:

1. IT Signature Project – Video

2. Itsignature.com – Front-end

3. IT Signature – Video Sharing Block

4. gb1980.com – Website and Images

5. batiks.lk – Website

6. Mamma Rosa – Website Maintenance

7. Gunathilaka Batiks

8. POS System UK

9. A Great Destination – Website

10. A Great Destination – Short Content and Posts

11. Personal Branding

12. batiks.org – E-commerce

Do not permanently assume the financial category of every project.

Assign editable sample classifications where reasonable, but make it easy to change each project between client and investment.

Sample suggested classifications:

Client projects:

- gb1980.com – Website and Images

- Mamma Rosa – Website Maintenance

- Gunathilaka Batiks

- POS System UK

- A Great Destination – Website

- A Great Destination – Short Content and Posts

Investment projects:

- IT Signature Project – Video

- Itsignature.com – Front-end

- IT Signature – Video Sharing Block

- batiks.lk – Website

- Personal Branding

- batiks.org – E-commerce

Include a visible label explaining that sample classifications are editable.

EMPTY STATES

Create useful empty states.

Examples:

Dashboard:

“No projects yet. Create your first project to start tracking progress and money.”

Payments:

“No transactions recorded yet.”

Milestones:

“No milestones yet. Add the major deliverables required to complete this project.”

Clients:

“No clients yet. Add a client or create a client project.”

Empty states should have one clear action, not several competing buttons.

FEEDBACK AND INTERACTIONS

Use:

- Skeleton loading states

- Non-intrusive success toasts

- Clear error messages

- Confirmation dialogs for deletion

- Disabled states during saving

- Accessible keyboard navigation

- Visible focus styles

- Tooltips only when labels are not sufficiently clear

Do not hide important actions behind icons without labels or tooltips.

RESPONSIVE DESIGN

Desktop:

- Collapsible sidebar

- Project table

- Large project side drawer

Tablet:

- Compact sidebar or navigation drawer

- Responsive tables

- Project drawer using most of the screen

Mobile:

- Navigation drawer

- Project card list instead of a compressed wide table

- Full-screen project details

- Touch-friendly buttons and form controls

- Sticky primary action where appropriate

PERFORMANCE

- Avoid unnecessary data refetching

- Paginate or progressively load large transaction lists

- Use efficient Supabase queries

- Do not load every project’s complete history on the dashboard

- Add database indexes where appropriate

- Keep the initial bundle reasonable

- Avoid unnecessary dependencies

DATA INTEGRITY

- Transaction amounts must be positive numbers

- Project names are required

- Client projects may have a client, but allow the client to be added later

- Completed projects should store completed_at

- Reopening a completed project should clear completed_at

- Expense transactions should count toward spending

- Income transactions should count toward received money

- Expected transactions should not count as received or spent

- Cancelled transactions should not affect totals

- Deleting a project should require explicit confirmation

- Prefer archiving to deletion for completed projects

FIRST VERSION SCOPE

Build these features completely:

- Authentication

- Dashboard

- Projects

- Project detail interface

- Clients

- Milestones

- Income and expense transactions

- Calculated balances

- Calculated progress

- Search

- Filtering

- Sorting

- Notes

- Activity history

- Light and dark modes

- CSV export

- Responsive design

- Row Level Security

Do not build these features in version one:

- Stripe payments

- Automated invoices

- Client portal

- Team collaboration

- Time tracking

- File storage

- Email reminders

- Bank account connections

- AI-generated reports

- Complicated accounting

- Tax calculations

- Currency conversion

CODE QUALITY

- Use reusable typed components

- Avoid very large page components

- Create typed database models

- Separate data access from visual components

- Use consistent naming

- Remove unused code

- Add error boundaries where appropriate

- Handle loading and failed database states

- Do not use “any” TypeScript types unless absolutely unavoidable

- Keep business calculations in reusable tested helper functions

- Do not duplicate payment calculations across multiple pages

BUILD ORDER

Implement the application in this order:

Phase 1:

- Authentication

- Database tables

- Row Level Security

- Base application layout

Phase 2:

- Projects

- Clients

- Project creation and editing

- Project filtering

Phase 3:

- Milestones

- Transactions

- Financial calculations

- Project progress calculations

Phase 4:

- Dashboard

- Payments page

- Investments page

- Reports

Phase 5:

- Notes

- Activity history

- CSV exports

- Responsive refinement

- Accessibility refinement

- Light and dark mode refinement

Before proceeding from one major phase to the next, verify that the existing features work correctly.

ACCEPTANCE CRITERIA

The application is ready when:

1. A new user can register and sign in.

2. A user can create a client.

3. A user can create either a client or investment project.

4. A user can add milestones to a project.

5. Project progress is calculated correctly.

6. A user can record partial and full client payments.

7. Client balance due is calculated correctly.

8. A user can record investment expenses.

9. Remaining investment budget is calculated correctly.

10. Overdue projects and payments are visible.

11. The dashboard reflects real database data.

12. Filters and search work correctly.

13. A user cannot access another user’s data.

14. The application works on desktop and mobile.

15. Financial records can be exported to CSV.

16. Loading, empty and error states are present.

17. No major screen depends on hardcoded mock data.

18. The visual design feels minimal, modern and premium.

Start by creating the database schema, Row Level Security policies, authentication pages and application shell.

Then implement the projects and clients workflow.

After each major section, test it using realistic sample data and fix errors before continuing.

Do not simplify or remove financial ledger functionality without explaining why.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/4ab86f39-ccfe-4caf-bec8-919ec5f24808).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
