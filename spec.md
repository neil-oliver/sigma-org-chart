# Org Chart Plugin - UX Improvement Spec

## Current State Summary

The plugin has a solid foundation with many features implemented:

### ✅ Implemented Features
- **Dual layout modes**: Tree (hierarchical) and Radial (network-style)
- **Pan/Zoom infinite canvas** with drag, scroll-wheel, and double-click support
- **Search with typeahead** across name, email, title, and org unit
- **Focus mode** with breadcrumb navigation for drilling into subtrees
- **Keyboard navigation** (arrow keys, Enter, Space, Escape)
- **Minimap** for orientation in large trees
- **Detail sidebar** via right-click for full user information
- **Card size toggle** (Standard vs Compact)
- **Org analytics panel** (depth, span of control, level distribution)
- **Unmapped employees view** for data quality visibility
- **Theme customization** (Light/Dark/Custom with color pickers)
- **Performance warning** at 200+ visible nodes

### 🔴 Critical Issues
1. **Filter panel is non-functional** - UI exists but filters are never applied
2. **Hidden interactions** - Right-click and double-click are not discoverable
3. **No touch/mobile support** - Pan/zoom only works with mouse

### 🟡 Medium Priority Issues
4. **Toolbar overflow** - Too many controls, no responsive behavior
5. **No onboarding** - First-time users don't know about rich features
6. **Search highlight overlap** - Action buttons can overlap expanded children
7. **Print is broken** - No print-specific styling

### 🟢 Polish Items
8. **Settings dialog inconsistency** - Native checkbox, sparse "General" tab
9. **Radial layout depth limit** - Only shows 2 rings, no indication of more
10. **Card content confusion** - "X direct reports (Y shown)" is misleading

---

## Phase 1: Critical Fixes

### 1.1 Make Filters Actually Work

**Problem**: `FilterPanel` component renders UI for org unit, office, and level filters, but the `filters` state is never used to filter `nodesToRender` in `OrgChart.tsx`.

**Solution**:
- Apply filters to the tree traversal/rendering logic
- When `filters.orgUnits` has values, only show nodes in those org units (and their ancestors)
- When `filters.offices` has values, only show nodes in those offices (and their ancestors)
- When `filters.maxLevel` is set, hide nodes deeper than that level
- Show "X of Y employees visible" when filters are active
- Add "Clear filters" indicator that's always visible when filters are active

**Files to modify**:
- `src/components/OrgChart.tsx` - Apply filters to rendering
- `src/components/FilterPanel.tsx` - Improve UX, show active filter count

---

### 1.2 Fix Interaction Discoverability

**Problem**: Key interactions are hidden behind right-click (details) and double-click (focus). These are not discoverable, especially on touch devices.

**Solution**:

#### A. Add visible action menu to cards
- Add a `⋮` (more) button to both `UserCard` and `CompactUserCard`
- On click, show a dropdown menu with:
  - "View details" (opens DetailSidebar)
  - "Focus on team" (if has children)
  - "Copy email" (if has email)
- Position: top-right corner of card

#### B. Improve search highlight actions
- Move "Focus on team" and "Dismiss" buttons to a floating pill above the card (not below)
- Add keyboard shortcut: `Escape` to dismiss highlight

#### C. Add interaction hints to cards
- Tooltip on hover: "Click to expand • Right-click for details"
- For compact cards: include double-click hint if has children

**Files to modify**:
- `src/components/UserCard.tsx` - Add menu button
- `src/components/CompactUserCard.tsx` - Add menu button
- `src/components/OrgChart.tsx` - Fix highlight button positioning
- New: `src/components/CardMenu.tsx` - Reusable dropdown menu

---

### 1.3 Touch & Mobile Support

**Problem**: Plugin is unusable on touch devices - no pinch-to-zoom, pan conflicts with scroll, right-click impossible.

**Solution**:

#### A. Touch gesture support
- Add `touch-action: none` to canvas and handle touch events manually
- Implement pinch-to-zoom using two-finger gestures
- Single finger drag = pan (already works via mouse events, need touch equivalents)
- Long-press (500ms) = open card menu (replaces right-click)

#### B. Responsive toolbar
- On narrow viewports (<768px), collapse secondary tools into overflow menu
- Priority order for visible items:
  1. Search bar (always visible)
  2. Zoom controls
  3. Expand/Collapse buttons
  4. Everything else in "More" dropdown

#### C. Mobile-friendly detail view
- On narrow viewports, `DetailSidebar` should be full-width overlay instead of side panel

**Files to modify**:
- `src/components/OrgChart.tsx` - Add touch event handlers
- `src/components/DetailSidebar.tsx` - Responsive width
- New: `src/components/ToolbarOverflow.tsx` - Collapsible toolbar

---

## Phase 2: UX Enhancements

### 2.1 First-Run Onboarding

**Problem**: New users don't know about keyboard navigation, right-click details, focus mode, etc.

**Solution**:
- Show a one-time tooltip tour on first load (store flag in localStorage)
- 4-5 steps highlighting:
  1. Search bar - "Find anyone instantly"
  2. Click a card - "Click to expand/collapse"
  3. Card menu - "Click ⋮ for more actions"
  4. Breadcrumb - "Navigate back through hierarchy"
  5. Keyboard hint - "Use arrow keys to navigate"
- "Skip tour" and "Don't show again" options
- Accessible via Help icon in toolbar anytime

**Files to create**:
- `src/components/OnboardingTour.tsx`
- `src/hooks/useOnboarding.ts`

---

### 2.2 Improve Toolbar Organization

**Problem**: Row 2 toolbar has too many controls, poor visual grouping.

**Solution**:
- Group related controls more clearly:
  ```
  [Expand ▾] [Card Size ▾] [Layout ▾] | [Filter] | [Navigate ▾] | ← Zoom → | [Analytics] [Print] [Help]
  ```
- Use dropdown menus for groups with multiple options:
  - "Expand" dropdown: Expand All, Collapse All, Reset Default
  - "Card Size" dropdown: Standard, Compact (currently toggle works fine)
  - "Navigate" dropdown: appears when node selected (Go to parent, Go to child, Focus)
- Move zoom percentage display inside zoom buttons: `[- 100% +]`

**Files to modify**:
- `src/components/OrgChart.tsx` - Reorganize toolbar

---

### 2.3 Search UX Improvements

**Problem**:
- No indication when search returns many results
- No prev/next navigation for multiple matches
- Highlight dismissal not keyboard accessible

**Solution**:
- When multiple results match, show "1 of X results" with prev/next buttons
- Add keyboard shortcuts: `↑`/`↓` to cycle through results when search focused
- `Escape` in search clears the search and dismisses highlight
- Highlight the matching text portion in search results dropdown

**Files to modify**:
- `src/components/SearchBar.tsx` - Add result count, prev/next
- `src/components/OrgChart.tsx` - Track current result index

---

### 2.4 Fix Card Content Clarity

**Problem**: `UserCard` shows confusing text "X direct reports (Y shown)" where the logic seems inverted.

**Solution**:
- When collapsed: "12 direct reports" (just the total)
- When expanded: "12 direct reports" (same, no need to say "shown")
- Remove the `visibleChildCount` prop which isn't adding value
- The expand/collapse chevron already indicates state

**Files to modify**:
- `src/components/UserCard.tsx` - Simplify report count display

---

## Phase 3: Polish & Refinement

### 3.1 Print Support

**Problem**: Print just calls `window.print()` with no styling adjustments.

**Solution**:
- Add `@media print` styles in `index.css`:
  - Hide toolbar, minimap, sidebars
  - Set background to white
  - Expand all visible nodes (or current view)
  - Fit to page width
  - Add page title from settings
- Optional: Add print preview dialog with options (current view vs full org)

**Files to modify**:
- `src/index.css` - Add print styles
- `src/components/OrgChart.tsx` - Optional print preview

---

### 3.2 Settings Dialog Polish

**Problem**:
- "General" tab only has title field (sparse)
- Dynamic theming toggle uses native checkbox
- Color pickers are native inputs

**Solution**:
- Move display settings to General tab:
  - Title
  - Default card size (Standard/Compact)
  - Default expand depth (1/2/3)
  - Show minimap (On/Off)
- Use shadcn Switch component instead of native checkbox
- Group color pickers into collapsible sections
- Add "Preview card" that shows a sample card with current theme

**Files to modify**:
- `src/Settings.tsx` - Reorganize and polish UI

---

### 3.3 Radial Layout Enhancements

**Problem**:
- Only shows 2 rings deep
- No indication that more levels exist beyond ring 2

**Solution**:
- Add visual indicator on ring 2 nodes that have children: subtle "+" badge
- On clicking ring 2 node with children, offer to focus on that subtree
- Add ring 3 support (with performance consideration - only render when ring 1 node is focused)

**Files to modify**:
- `src/components/RadialOrgChart.tsx` - Add ring 3, depth indicators

---

### 3.4 Better Empty States

**Problem**: Generic messages like "No Team Members Found" don't help users fix issues.

**Solution**:
- "No data source selected" → Show data source connection instructions
- "No team members found" → "No employees matched. Did you map the Full Name column?" with link to settings
- "No organization chart data" → "We couldn't build a hierarchy. Check that Manager column values match employee names."
- Include small illustration/icon for each state

**Files to modify**:
- `src/App.tsx` - Improve empty states
- `src/components/OrgChart.tsx` - Improve empty state

---

## Implementation Order

| Priority | Task | Effort | Impact |
|----------|------|--------|--------|
| 1 | **1.1 Make filters work** | Medium | High - broken feature |
| 2 | **1.2 Interaction discoverability** | Medium | High - usability |
| 3 | **2.4 Fix card content clarity** | Small | Medium - clarity |
| 4 | **2.2 Toolbar organization** | Medium | Medium - cleanliness |
| 5 | **2.3 Search UX improvements** | Medium | Medium - usability |
| 6 | **1.3 Touch/mobile support** | Large | Medium - reach |
| 7 | **3.2 Settings polish** | Small | Low - polish |
| 8 | **3.4 Better empty states** | Small | Low - polish |
| 9 | **3.1 Print support** | Medium | Low - niche use |
| 10 | **2.1 Onboarding tour** | Medium | Low - one-time value |
| 11 | **3.3 Radial enhancements** | Medium | Low - secondary layout |

---

## Technical Notes

### Files Overview

```
src/
├── App.tsx                     # Main app, config, empty states
├── Settings.tsx                # Settings dialog (needs polish)
├── components/
│   ├── OrgChart.tsx            # Main chart component (toolbar, canvas, state)
│   ├── UserCard.tsx            # Standard card (needs menu button)
│   ├── CompactUserCard.tsx     # Compact card (needs menu button)
│   ├── SearchBar.tsx           # Search (needs result navigation)
│   ├── FilterPanel.tsx         # Filters (need to wire up)
│   ├── DetailSidebar.tsx       # Detail panel (needs responsive)
│   ├── Breadcrumb.tsx          # Navigation breadcrumb ✓
│   ├── Minimap.tsx             # Overview map ✓
│   ├── ChildrenContainer.tsx   # Tree connector lines ✓
│   ├── OrgAnalytics.tsx        # Stats panel ✓
│   └── RadialOrgChart.tsx      # Radial layout (needs depth fix)
├── hooks/
│   ├── useOrgChart.ts          # Tree state management ✓
│   └── useKeyboardNavigation.ts # Keyboard nav ✓
└── utils/
    └── orgChartUtils.ts        # Tree building ✓
```

### State Management Considerations

Current state lives in `OrgChart.tsx`:
- `focusedNodeId` - which subtree is focused
- `filters` - filter state (NOT APPLIED)
- `highlightedUserId` - search highlight
- `viewMode` - chart vs unmapped
- `layoutMode` - tree vs radial
- `zoomLevel`, `panPosition` - canvas transform
- `showAnalytics`, `showFilters` - panel visibility

The `useOrgChart` hook manages:
- `orgTree` - built tree structure
- `expandState` - which nodes are expanded
- `cardSizeMode` - compact vs standard

### Performance Considerations

- Current performance warning at 200 nodes is good
- Filters should improve performance by reducing rendered nodes
- Touch events need careful handling to avoid jank
- Consider debouncing pan/zoom updates

---

## Success Criteria

- [ ] Filters actually filter the displayed tree
- [ ] All interactions accessible via visible UI (no hidden gestures required)
- [ ] Plugin usable on iPad/tablet with touch gestures
- [ ] Toolbar fits comfortably on 1024px wide viewport
- [ ] New users can understand basic interactions within 30 seconds
- [ ] Print produces readable single-page output
- [ ] Settings dialog feels complete and polished

---

## Out of Scope (Future Considerations)

- Export to image/PDF (beyond print)
- Drag-and-drop org restructuring
- Real-time collaboration
- Integration with external directory services
- Custom card templates
- Saved views/bookmarks

