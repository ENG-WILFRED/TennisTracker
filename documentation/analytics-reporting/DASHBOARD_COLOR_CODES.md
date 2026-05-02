# Dashboard Color Codes

This document collects the color codes used throughout the TennisTracker dashboard UI. It focuses on the palette and semantic colors found in dashboard components such as `AdminDashboard.tsx`, `FinanceDashboard.tsx`, coach dashboard components, and `RefereeDashboard.tsx`.

## 1. Core dashboard palette
These colors form the dark theme and surface system used across dashboards.

| Name | Hex | Usage |
| --- | --- | --- |
| `dark` | `#0a180a` / `#0f1f0f` | Main page background, deep panel background, dark text backgrounds |
| `sidebar` | `#152515` / `#152515` | Sidebar and navigation background |
| `card` | `#162616` / `#1a3020` | Card surface background |
| `card2` | `#1b2f1b` | Secondary card/background alternate |
| `card3` | `#203520` | Tertiary card background |
| `cardBorder` | `#2d5a35` | Card/border accent and separators |
| `border` | `#243e24` | Panel borders and dividers |
| `border2` | `#326832` | Stronger accent border |
| `mid` | `#2a5224` / `#2d5a27` | Active navigation, hover backgrounds, secondary brand surface |
| `bright` | `#3a7230` / `#3d7a32` | Strong success accent and highlight bars |

## 2. Primary accent palette
A consistent green-based accent palette appears in most dashboard pages.

| Name | Hex | Usage |
| --- | --- | --- |
| `lime` | `#7dc142` | Primary CTA buttons, success badges, active status, brand accent |
| `accent` | `#a8d84e` | Secondary accent backgrounds and highlight text |
| `yellow` | `#f0c040` | Warning or informational highlights |
| `blue` | `#4a9eff` | Action buttons, links, info states |
| `red` | `#d94f4f` | Destructive buttons and alerts |

## 3. Text colors

| Name | Hex | Usage |
| --- | --- | --- |
| `text` | `#e8f5e0` / `#e4f2da` | Main text on dark backgrounds |
| `text2` | `#c2dbb0` | Secondary text and labels |
| `muted` | `#7aaa6a` | Muted text and disabled-looking captions |
| `muted2` | `#5e8e50` / `#7aaa68` | Secondary muted states and label text |

## 4. Status and chart colors

| Purpose | Hex | Usage |
| --- | --- | --- |
| `success` / positive status | `#5fc45f` | Healthy system status, verified/OK badges |
| `danger` / error | `#e57373` | Overdue and negative financial values |
| `silver` tier | `#aaaaaa` | Membership tier accents |
| `bronze` tier | `#cd7f32` | Membership tier accents |
| `paid` status | `#7dc142` | Paid transaction badges |
| `pending` status | `#f0c040` | Pending transaction badges |
| `overdue` status | `#e57373` | Overdue transaction badges |

## 5. Referee dashboard status badge palette
The referee dashboard defines status badge colors explicitly for task states.

| Status | Background | Border | Text |
| --- | --- | --- | --- |
| `ASSIGNED` | `#bfdbfe` | `#3b82f6` | `#1e40af` |
| `ACCEPTED` | `#e9d5ff` | `#a855f7` | `#6b21a8` |
| `IN_PROGRESS` | `#fef3c7` | `#f59e0b` | `#92400e` |
| `COMPLETED` | `#bbf7d0` | `#10b981` | `#065f46` |
| `FAILED` | `#fecaca` | `#ef4444` | `#7f1d1d` |
| `CANCELLED` | `#e5e7eb` | `#6b7280` | `#374151` |

## 6. Supplemental accent colors
These are used in bottles, icon labels, or more specific UI elements.

| Hex | Use |
| --- | --- |
| `#ff6b9d` | Player reachout activity icon accent |
| `#4da6ff` | Email activity icon accent |
| `#0f1f0f` | Text on lime buttons, strong contrast button text |
| `#fff` | White text on red or dark buttons |

## 7. Files where these palettes appear
The dashboards share a repeated color system across these files:

- `src/components/dashboards/AdminDashboard.tsx`
- `src/components/dashboards/FinanceDashboard.tsx`
- `src/components/dashboards/referee/RefereeDashboard.tsx`
- `src/components/dashboards/coach/ActivityModal.tsx`
- `src/components/dashboards/coach/AnalyticsSection.tsx`
- `src/components/dashboards/coach/CalendarView.tsx`
- `src/components/dashboards/coach/EarningsAndWallet.tsx`
- `src/components/dashboards/coach/PlayerManagement.tsx`
- `src/components/dashboards/coach/SessionManagement.tsx`
- `src/components/dashboards/coach/CommunityPanel.tsx`

## 8. Practical guidance
- Use `G.dark`/`G.sidebar`/`G.card` for page foundation and panel surfaces.
- Use `G.lime` / `G.accent` / `G.bright` for primary CTA and success states.
- Use `G.yellow`, `G.blue`, and `G.red` for statuses, warnings, and destructive actions.
- Use `G.text`, `G.text2`, `G.muted`, and `G.muted2` for typography hierarchy.

This reference captures the current dashboard color palette in use across the TennisTracker app. If you need a color map for a specific dashboard component, I can expand it with exact element-level usage.