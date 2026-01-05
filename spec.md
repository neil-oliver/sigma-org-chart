# Org Chart Plugin Enhancement Spec

## Overview

Transform the existing Sigma org chart plugin to handle an 800-person organization with 3-5 levels of depth and up to 25 direct reports per manager. The primary goals are **usability at scale**, **fast person lookup**, and **intuitive navigation** within a modal-sized container.

---

## Core Principles

1. **Progressive Disclosure**: Show overview first, details on demand
2. **Compact by Default**: Maximize information density without sacrificing readability
3. **Context Preservation**: Always know where you are in the org
4. **Fast Search**: Find anyone quickly by name, title, org, or office

---

## View Modes

### 1. Overview Mode (Default)
- **Initial State**: CEO (top level) + direct reports (level 2) visible
- **Level 2 cards**: Displayed in **compact mode** to fit more on screen
- **Deeper levels**: Collapsed, shown as expandable nodes with descendant counts
- **Behavior**: Click any compact card to expand its subtree

### 2. Focused Mode
- Activated via "Focus on subtree" button on any card
- Shows **only** the selected person and their full reporting chain below
- Provides "Exit focus" button to return to Overview Mode
- Breadcrumb updates to reflect focused context

### 3. Search Results Mode
- Activated when user performs a search
- Matching cards are **highlighted** and **auto-scrolled** into view
- Non-matching cards are dimmed but still visible for context
- Search matches across: name, job title, organization unit, office

---

## Card Variants

### Compact Card (~160px wide)
- Small avatar (32-40px)
- Full name (truncated if needed)
- Job title (truncated if needed)
- Subtle expand indicator if has reports (e.g., "+12" badge)
- **Click behavior**: Expands children inline below the card

### Standard Card (Current ~320px)
- Full avatar (80px)
- Full name, job title
- Organization unit badge
- Office location
- Manager reference
- Email/Slack actions
- Direct report count
- Expand/collapse children toggle

### Expanded Card (Optional, on hover/click)
- Same as standard, but could include:
  - Start date
  - Full contact actions
  - Quick links to focus/path views

---

## Navigation Components

### 1. Breadcrumb Trail
- Position: Top of the org chart container
- Shows: `CEO > VP Engineering > Director Platform > [Current Focus]`
- Each segment is clickable to navigate up
- Collapses gracefully if path is long (show first, last, ellipsis)

### 2. Mini-Map (Overview Panel)
- Position: Bottom-right corner, collapsible
- **Simplified view**: Shows **org units/departments as blocks** rather than 800 individual nodes
  - Each block represents a department (e.g., "Engineering", "Sales")
  - Block size proportional to headcount
  - Only shows individual nodes when zoomed into small subtree (<30 people)
- Highlights: Current viewport / focused area
- **Interactions**:
  - Click anywhere to jump to that section
  - Drag the viewport indicator to pan around
- Size: ~200x150px, semi-transparent

### 3. Focus Controls (Per Card)
- **"Focus on subtree"**: Isolates this person and their reports
- **"Show path to top"**: Highlights/expands the chain from this person to CEO
- Accessible via card menu or icon buttons

### 4. Global Controls
- **Expand All / Collapse All**: With smart limits (don't expand 800 cards)
- **Reset View**: Return to default Overview Mode
- **View Mode Toggle**: Switch between compact/standard card density

---

## Search Functionality

### Search Bar
- Position: Top of container, always visible
- Placeholder: "Search by name, title, org, or office..."
- Debounced input (300ms)

### Search Behavior
1. As user types, filter/highlight matching nodes
2. If single strong match, auto-scroll and pulse highlight
3. If multiple matches, show count with prev/next navigation
4. **Result limit**: Show first 100 matches; "Show more" button loads next batch
5. Display format: "Showing 100 of 247 results" when applicable
6. Matching cards expand if collapsed to show in tree
7. Clear search returns to previous view state

### Search Fields
- Full Name (primary)
- Job Title
- Organization Unit
- Office Location

---

## Layout & Rendering

### Horizontal Layout Strategy
- Level 2+ uses **flex-wrap** to prevent horizontal scrolling
- Compact cards wrap into multiple rows when siblings exceed viewport width
- Target: ~6-8 compact cards per row in typical modal width (~1000px)
- Example: 25 direct reports display as 4 rows of 6-7 compact cards each
- **No horizontal scrolling** in overview mode
- **Vertical scrolling is acceptable** with breadcrumbs + mini-map for orientation

### Visual Grouping (Container Approach)
- When a node's children are displayed, they appear inside a **subtle container/box**
- Container has light border or background tint to visually group siblings
- Single connecting line from parent → container (not individual lines to each child)
- Container approach replaces complex line-drawing for wrapped layouts
- Provides clear visual hierarchy: "all these cards report to the same person"

### Connecting Lines
- **Parent → Container**: Single vertical line from parent card to children container
- **No individual lines** to each child card (reduces visual clutter)
- Lines hidden entirely when children wrap to multiple rows
- Optional: toggle lines on/off in settings

### Progressive Loading
- **Initial load**: Top 2 levels only (CEO + direct reports)
- **On expand**: Fetch/render children of expanded node
- **Virtualization**: For levels with 20+ siblings, virtualize off-screen cards

---

## Interaction Patterns

### Card Interactions
| Action | Compact Card | Standard Card |
|--------|--------------|---------------|
| Click | Expand children inline | Toggle children visibility |
| Hover | Show tooltip with full details | Subtle highlight |
| Menu (⋮) | Focus, Path to top, Copy email | Same |
| Click manager name | Navigate to manager's card | Navigate to manager's card |

### Keyboard Navigation (Future Enhancement)
- Arrow keys to navigate between cards
- Enter to expand/focus
- Escape to exit focus mode / clear search
- `/` to focus search bar

---

## Performance Considerations

### Rendering
- Use React.memo for card components
- Virtualize large sibling lists (>15-20 cards)
- Debounce search input
- Lazy render collapsed subtrees

### Data
- Assume data comes pre-loaded from Sigma (800 rows)
- Build tree structure once, memoize
- Track expand state separately from tree structure (current pattern)

### Animations
- Keep transitions short (150-200ms)
- Disable animations for bulk operations (expand all)
- Use CSS transforms over layout-triggering properties

---

## State Management

### Expand State Preservation
- **Exit Focus Mode**: Restore previous expand state (before focus was activated)
- **Clear Search**: Restore pre-search expand state (collapse nodes that were auto-expanded)
- **Modal Close/Reopen**: Reset to default (top 2 levels expanded)

### State Snapshots
- Save expand state snapshot when entering Focus Mode
- Save expand state snapshot when initiating search
- Restore from snapshot on exit/clear

---

## Data Validation & Edge Cases

### Guiding Principle
**Never fail to load the plugin due to data issues.** Always render what we can and gracefully handle malformed data.

### Edge Cases

| Scenario | Handling |
|----------|----------|
| **Missing manager** (manager field empty or null) | Treat as root node; display at top level |
| **Manager not found** (manager name doesn't match any employee) | Treat as root node; optionally show warning indicator |
| **Multiple root nodes** (multiple people with no manager) | Display all as parallel root nodes at top level |
| **Circular reference** (A→B→C→A) | Detect cycle during tree build; break cycle by treating one node as root; log warning |
| **Duplicate names** | Use unique identifier if available; otherwise disambiguate with title/org |
| **Empty org** (no data) | Show friendly empty state message |
| **Single person** | Show single card, no hierarchy UI needed |

### Validation on Load
1. Build adjacency map from manager relationships
2. Detect and break circular references
3. Identify orphan nodes (manager not in dataset)
4. Log warnings for data quality issues (don't surface to end user unless critical)

---

## Settings Additions

### Display Settings
- **Default card size**: Compact / Standard
- **Initial expand depth**: 1 / 2 / 3 levels
- **Show connecting lines**: On / Off
- **Mini-map visibility**: On / Off / Auto-hide

### Search Settings
- **Search fields**: Checkboxes for name, title, org, office
- **Auto-focus search on open**: On / Off

---

## Implementation Phases

### Phase 1: Foundation
- [ ] Compact card component
- [ ] Card size toggle (compact/standard)
- [ ] Visual grouping containers for children (replaces individual connector lines)
- [ ] Flex-wrap layout for sibling cards
- [ ] Default to top 2 levels expanded
- [ ] Improved expand/collapse with descendant counts
- [ ] Data validation (circular refs, missing managers, etc.)

### Phase 2: Search
- [ ] Search bar component
- [ ] Search across all fields
- [ ] Highlight and auto-scroll to matches
- [ ] Result count and prev/next navigation

### Phase 3: Navigation
- [ ] Breadcrumb trail component
- [ ] "Focus on subtree" functionality
- [ ] "Show path to top" functionality
- [ ] Exit focus / reset view

### Phase 4: Mini-Map & Polish
- [ ] Mini-map component
- [ ] Viewport indicator on mini-map
- [ ] Click-to-navigate on mini-map
- [ ] Performance optimizations (virtualization)

### Phase 5: Settings & Refinement
- [ ] Add new settings to Settings panel
- [ ] Keyboard navigation
- [ ] Final polish and edge cases

---

## Design Decisions (Resolved)

1. **Card click behavior in compact mode**: **Expand inline** - clicking a compact card expands its children below it in the tree, keeping context visible

2. **Wrapped rows**: **Wrap into rows** - when a level has many siblings (e.g., 25 direct reports), compact cards wrap into multiple rows rather than horizontal scrolling. This keeps everything visible in the modal without scrolling sideways. Example: 25 compact cards at ~160px each would display as ~4 rows of 6-7 cards in a typical modal width.

3. **Mini-map interaction**: **Both** - click anywhere on mini-map to jump to that section, AND drag to pan the current viewport around

4. **Search result limit**: **Paginated** - show first 100 matches with a "Show more" button to load additional results. Display count: "Showing 100 of 247 results"

5. **Manager display**: **Clickable navigation** - manager name is a link that, when clicked, navigates to that person's card (scrolls/focuses) and optionally shows the full reporting chain path

---

## Success Metrics

- [ ] Full org (800 people) viewable without browser performance issues
- [ ] Any person findable within 3 seconds via search
- [ ] No horizontal scrolling required in overview mode (compact cards wrap)
- [ ] Clear sense of "where am I" at all times via breadcrumbs
- [ ] Smooth transitions between view modes

