# social-dashboard Specification

## Purpose
TBD - created by archiving change add-social-dashboard-page. Update Purpose after archive.
## Requirements
### Requirement: Social Dashboard Page
The system SHALL provide a `/social` route that displays Moltbook agent activity in a branded dashboard. The page SHALL require authentication (redirect unauthenticated users to `/`). The page SHALL follow the existing server/client component pattern: server component auth gate → `SocialClient` client component.

#### Scenario: Authenticated user accesses social page
- **WHEN** an authenticated user navigates to `/social`
- **THEN** the page renders with MetricsBar, TabBar, and the default Feed view

#### Scenario: Unauthenticated user redirected
- **WHEN** an unauthenticated user navigates to `/social`
- **THEN** the user is redirected to `/` (login page)

### Requirement: Social Dashboard Tabbed Views
The system SHALL display activity data in 5 tabbed views: Feed, Wins, Daily, Network, and Submolt. Switching tabs SHALL re-fetch data with the appropriate filter. The Feed tab SHALL be the default active tab on page load.

#### Scenario: User switches to Wins tab
- **WHEN** the user clicks the "Wins" tab
- **THEN** the view updates to show only entries with result `viral`, ordered by karma descending

#### Scenario: User switches to Daily tab
- **WHEN** the user clicks the "Daily" tab
- **THEN** the view updates to show daily metric snapshots ordered by date descending

#### Scenario: Network and Submolt show placeholder
- **WHEN** the user clicks "Network" or "Submolt" tab
- **THEN** a "Coming Soon" placeholder is displayed (deferred to future iteration)

### Requirement: Social Metrics Bar
The system SHALL display a metrics bar above the tabbed views showing the agent's current Karma, Rank, Karma Delta, total Posts count, and Win Rate. Metrics SHALL be computed from the latest daily snapshot entry.

#### Scenario: Metrics bar displays current stats
- **WHEN** the social page loads with a daily snapshot available
- **THEN** the MetricsBar shows karma, rank, delta (with +/- prefix), posts count, and win rate percentage

#### Scenario: Metrics bar with no data
- **WHEN** no daily snapshot exists for the active agent
- **THEN** the MetricsBar shows dashes or zeros for all metrics

### Requirement: Social Auto-Refresh
The system SHALL auto-refresh data every 2 minutes while the page is active. The system SHALL also provide a manual refresh button. Auto-refresh SHALL pause when the browser tab is not visible.

#### Scenario: Auto-refresh triggers
- **WHEN** 2 minutes have elapsed since the last fetch
- **THEN** the system re-fetches data for the current view and agent without user interaction

#### Scenario: Manual refresh
- **WHEN** the user clicks the refresh button
- **THEN** data is immediately re-fetched and the refresh timestamp updates

#### Scenario: Tab hidden pauses refresh
- **WHEN** the browser tab loses visibility (document.hidden === true)
- **THEN** the auto-refresh interval is paused until the tab regains visibility

### Requirement: Social Navigation Link
The system SHALL add a "Social" navigation link in the Header component, positioned after the "Memory" link. The link SHALL use the `Users` icon from Lucide React and follow the existing nav link styling pattern.

#### Scenario: Social link visible in header
- **WHEN** any authenticated page is rendered
- **THEN** the Header contains a "Social" link pointing to `/social` with the Users icon

### Requirement: Social Route Auth Protection
The system SHALL protect the `/social` route at the middleware level, in addition to the server component redirect. The middleware SHALL redirect unauthenticated users to `/` when they request `/social`.

#### Scenario: Middleware blocks unauthenticated access
- **WHEN** an unauthenticated request hits `/social`
- **THEN** the middleware redirects to `/` before the page component runs

### Requirement: Social Dashboard Feed View
The system SHALL display a chronological list of activity entries (posts, comments, replies) in the Feed view. Each entry SHALL show a type badge (color-coded: post=blue, comment=purple, reply=emerald), title, content preview, karma count, comment count, and relative timestamp.

#### Scenario: Feed displays mixed activity
- **WHEN** the Feed view loads with activity data
- **THEN** entries are shown in reverse chronological order with type badges, content previews, and metrics

#### Scenario: Feed empty state
- **WHEN** no activity entries exist for the active agent
- **THEN** an empty state message is displayed with guidance text

### Requirement: Social Dashboard Wins View
The system SHALL display a gallery grid of entries marked as `viral` in the Wins view, sorted by karma descending. Each card SHALL highlight the karma count prominently.

#### Scenario: Wins displays viral entries
- **WHEN** the Wins view loads with viral entries
- **THEN** entries are shown in a grid layout sorted by karma descending

#### Scenario: Wins empty state
- **WHEN** no viral entries exist for the active agent
- **THEN** an empty state message is displayed

### Requirement: Social Dashboard Daily View
The system SHALL display daily metric snapshot cards in the Daily view, ordered by date descending. Each card SHALL show the date, karma, rank, delta, followers, posts count, and comments count.

#### Scenario: Daily displays snapshots
- **WHEN** the Daily view loads with snapshot data
- **THEN** cards are shown in reverse date order with all metric fields

#### Scenario: Daily empty state
- **WHEN** no daily snapshots exist for the active agent
- **THEN** an empty state message is displayed

