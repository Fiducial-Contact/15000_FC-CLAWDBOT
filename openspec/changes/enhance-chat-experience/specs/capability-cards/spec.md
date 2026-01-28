## ADDED Requirements

### Requirement: Capability Card Status Indication

Each capability card SHALL indicate whether the feature is fully available, partially available, or coming soon.

#### Scenario: Fully available capability

- **WHEN** a capability is fully supported by both Gateway Skills and UI
- **THEN** the card SHALL display normally without any badge
- **AND** clicking suggestions SHALL work as expected

#### Scenario: Coming soon capability

- **WHEN** a capability requires UI features not yet implemented (e.g., Voice requires recording)
- **THEN** the card SHALL display a "Coming Soon" badge
- **AND** the card SHALL be visually dimmed (reduced opacity)
- **AND** clicking the card SHALL NOT send suggestions

#### Scenario: Partially available capability

- **WHEN** a capability's text-based features work but media features don't
- **THEN** the card SHALL display normally
- **AND** only text-based suggestions SHALL be included

### Requirement: Capability Categories Accuracy

The capability categories SHALL accurately reflect features that work in the current UI.

#### Scenario: Categories match UI capabilities

- **WHEN** the empty state renders
- **THEN** the following categories SHALL be shown:

| Category | Status | Reason |
|----------|--------|--------|
| Video Post (AE/Premiere) | Available | Text Q&A works |
| Marketing | Available | Text generation works |
| Summarize | Available | URL summarization works |
| More Tools | Available | Weather, queries work |
| Image Creation | Coming Soon | UI cannot display images |
| Video Tools | Coming Soon | UI cannot download files |
| Voice | Coming Soon | UI cannot record audio |
| Reminders | Available | Text-based reminders work |

#### Scenario: Suggestions match capability status

- **WHEN** a capability is marked "Coming Soon"
- **THEN** its suggestion buttons SHALL be disabled or hidden
- **AND** clicking SHALL NOT trigger any action
