---
name: Focused Academic Modern
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2fd'
  on-surface: '#131b2e'
  on-surface-variant: '#444651'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#757682'
  outline-variant: '#c5c5d3'
  surface-tint: '#4059aa'
  primary: '#00236f'
  on-primary: '#ffffff'
  primary-container: '#1e3a8a'
  on-primary-container: '#90a8ff'
  inverse-primary: '#b6c4ff'
  secondary: '#855300'
  on-secondary: '#ffffff'
  secondary-container: '#fea619'
  on-secondary-container: '#684000'
  tertiary: '#00311f'
  on-tertiary: '#ffffff'
  tertiary-container: '#004a31'
  on-tertiary-container: '#27c38a'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dce1ff'
  primary-fixed-dim: '#b6c4ff'
  on-primary-fixed: '#00164e'
  on-primary-fixed-variant: '#264191'
  secondary-fixed: '#ffddb8'
  secondary-fixed-dim: '#ffb95f'
  on-secondary-fixed: '#2a1700'
  on-secondary-fixed-variant: '#653e00'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
typography:
  headline-xl:
    fontFamily: Be Vietnam Pro
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-xl-mobile:
    fontFamily: Be Vietnam Pro
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Be Vietnam Pro
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Be Vietnam Pro
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 30px
    letterSpacing: 0em
  headline-md:
    fontFamily: Be Vietnam Pro
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 30px
    letterSpacing: 0em
  headline-sm:
    fontFamily: Be Vietnam Pro
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
    letterSpacing: 0em
  body-reading:
    fontFamily: Be Vietnam Pro
    fontSize: 17px
    fontWeight: '400'
    lineHeight: 28px
    letterSpacing: 0.01em
  body-default:
    fontFamily: Be Vietnam Pro
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: 0em
  body-subtle:
    fontFamily: Be Vietnam Pro
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0em
  label-lg:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.04em
  mono-timer:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-sm: 1rem
  margin: 2rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system is engineered specifically for adult and young adult Vietnamese learners practicing TOEIC Reading under cognitive load. The aesthetic merges **Corporate / Modern** precision with an inviting, low-stress academic sanctuary.

### Brand Personality & Tone
- **Calm Authority:** Authoritative and academically rigorous without feeling intimidating or bureaucratic.
- **Cognitive Clarity:** Distraction-free interfaces that minimize exam anxiety, eye fatigue, and visual clutter during prolonged passage reading.
- **Encouraging & Progress-Driven:** Positive reinforcement through warm accents that celebrate incremental score gains.

### Target Audience & Emotional Response
- **Audience:** University students and working professionals across Vietnam preparing for TOEIC levels 450 to 900+.
- **Emotional Target:** Confidence, focus, psychological safety, and clear sense of personal progression. Error states inform without punishing.

## Colors

The palette uses a light mode foundation optimized for extended reading sessions, leveraging high-contrast text against soft, tinted neutral surfaces to reduce glare.

### Palette Architecture
- **Primary (`#1E3A8A` / Deep Blue):** Anchors core actions, timer panels, passage headers, active selections, and institutional credibility. Darker shade `#0F2A66` serves as active/pressed state.
- **Secondary (`#F59E0B` / Amber Gold):** Signals score targets, high-value review flags, streaks, and motivational callouts. Darker accent `#D97706` applies to text labels on light backgrounds for AA compliance.
- **Tertiary (`#10B981` / Emerald Green):** Represents correct answers, completed test sections, and positive score differentials.
- **Neutral Primary (`#0F172A` / Slate 900):** Main typography color for maximum legibility of complex bilingual passages.
- **Neutral Surfaces:**
  - Base canvas: `#F8FAFC` (Slate 50)
  - Card & Container fill: `#FFFFFF` (Pure White)
  - Inactive containers / split-pane dividers: `#F1F5F9` (Slate 100)
  - Structural borders: `#E2E8F0` (Slate 200)
- **Feedback & Error:**
  - Error solid: `#EF4444` (Crimson)
  - Error background: `#FEF2F2` (Red 50)
  - Error border: `#FECACA` (Red 200)

## Typography

Typography is specifically calibrated for bilingual Vietnamese and English reading comprehension. **Be Vietnam Pro** provides custom-crafted diacritical marks that avoid vertical clipping and visual distortion in Vietnamese tone marks, while **Inter** delivers compact, high-legibility numerical and interactive UI elements.

### Rules for Application
- **TOEIC Reading Passages:** Always rendered in `body-reading` (17px / 28px height). Line height is intentionally expanded to prevent collision of stacked diacritics (e.g., `ẩ`, `ễ`, `ở`) and ensure comfortable scan-reading during Part 7 multi-passages.
- **Dual-Language Hints & Explanations:** English question stems use `body-default` regular weight; Vietnamese translations and grammar rule breakdowns use `body-subtle` with `#334155` to establish effortless visual separation.
- **Timer & Test Controls:** The `mono-timer` style uses tabular figure settings within `Inter` to prevent UI jitter as the countdown advances.

## Layout & Spacing

The layout model optimizes for simultaneous passage viewing and question resolution.

### Layout Mechanics
- **Desktop (>= 1024px):** Fixed-split or fluid 12-column dual-pane workspace.
  - Left pane (Passage): 55% width or 7 columns, independent internal scroll.
  - Right pane (Questions & Answers): 45% width or 5 columns, synchronized target scrolling.
  - Max canvas container: `1280px` centered with `2rem` outer margins.
- **Tablet (768px - 1023px):** Collapsible split-pane with sticky quick-navigation bar at the bottom.
- **Mobile (< 768px):** Single-column stacked mode with persistent sticky tabs: `[Văn bản]` (Passage) and `[Câu hỏi]` (Questions), accompanied by an anchored persistent bottom navigation drawer. Outer margin scales down to `1rem`.

## Elevation & Depth

Depth is maintained primarily through **low-contrast outlines** paired with **ambient soft shadows**. This keeps the reading plane flat and comfortable, avoiding heavy simulated real-world lighting that distracts during focused study.

### Elevation Hierarchy
- **Level 0 (Canvas):** Pure `#F8FAFC`. Completely flat.
- **Level 1 (Cards, Passages & Worksheets):** White `#FFFFFF` surface with a `1px solid #E2E8F0` border and subtle ambient drop shadow: `box-shadow: 0 1px 3px rgba(15, 23, 42, 0.05), 0 1px 2px rgba(15, 23, 42, 0.03)`.
- **Level 2 (Hovered Choice, Active Selection, Answer Explanation Drawer):** White `#FFFFFF` surface, `1px solid #CBD5E1`, with elevation shadow: `box-shadow: 0 4px 12px -2px rgba(30, 58, 138, 0.08), 0 2px 6px -1px rgba(15, 23, 42, 0.04)`.
- **Level 3 (Modals, Test Completion Dialogs, Vocabulary Popovers):** Elevated overlays utilizing `box-shadow: 0 12px 28px -4px rgba(15, 23, 42, 0.12), 0 4px 10px -2px rgba(15, 23, 42, 0.06)`.
- **Focus Rings:** Accessible double ring: `box-shadow: 0 0 0 2px #FFFFFF, 0 0 0 4px #1E3A8A`.

## Shapes

The interface embraces a modern, friendly, and structured aesthetic using soft, generous curvature calibrated between 12px and 16px.

### Corner Radius System
- **Core Elements (`rounded`, 0.5rem / 8px):** Input boxes, answer bubble radio nodes, and compact tags.
- **Standard Interactive Blocks (`rounded-lg`, 1rem / 16px):** Primary passage containers, exam card modules, question blocks, and dialog boxes.
- **Pill Elements (`rounded-full`):** Category chips, timer badges, and question navigation jump-pills (e.g., question numbers 101 to 200).
- **Proportional Relationship:** Internal elements (such as option selectors inside an exam card) carry an 8px radius to sit proportionally within the parent 16px card.

## Components

### Buttons
- **Primary (Test Submission, Next Question):** `#1E3A8A` background, `#FFFFFF` text, `rounded-lg` (16px or 12px for compact). Padding: 12px 24px. Hover state shifts to `#0F2A66`.
- **Secondary (Vocabulary Bookmark, Review Later):** Transparent background, `1.5px solid #E2E8F0`, `#1E3A8A` text. Hover fills to `#F1F5F9`.
- **Accent (Target Score Milestone / Tip Unlock):** `#F59E0B` background, `#FFFFFF` text. Hover shifts to `#D97706`.

### Cards & Reading Passages
- **Passage Container:** `#FFFFFF` background, `1px solid #E2E8F0`, 16px border-radius, generous 24px internal padding (`space-lg`). Content text uses `body-reading`.
- **Question Card:** Stacked layout separated by 16px spacing. Selected state draws a `2px solid #1E3A8A` border with subtle `#EFF6FF` tint.

### Multiple Choice Options (A, B, C, D)
- **Base State:** Flex row with an integrated circular letter badge (A/B/C/D), `1px solid #E2E8F0`, `#FFFFFF` background, 12px roundedness, 14px padding.
- **Selected State:** `#1E3A8A` border, `#EFF6FF` background, dark blue badge.
- **Correct State (Review Mode):** `#10B981` border, `#ECFDF5` background, `#065F46` label text.
- **Incorrect Selected State:** `#EF4444` border, `#FEF2F2` background, `#991B1B` label text.

### Chips & Badges
- **Question Progress Chips:** 36x36px rounded-full pills. Unanswered: `#F1F5F9` with `#475569` text; Answered: `#1E3A8A` with `#FFFFFF` text; Flagged for Review: `#FEF3C7` with `#D97706` text and border.
- **Part Indicator Tags (Part 5, Part 6, Part 7):** Small pill tags with `#F1F5F9` background, `#0F172A` text, 4px 10px padding.

### Checkboxes & Radio Buttons
- Hidden native radios styled into custom rounded-full circles (24px diameter) containing centered uppercase letters (A, B, C, D).

### Input Fields (Fill-in-the-blank / Practice Notes)
- Crisp `#FFFFFF` background, `1px solid #CBD5E1` border, 8px border-radius, 10px 14px padding. On focus: `#1E3A8A` border with `0 0 0 3px rgba(30, 58, 138, 0.15)`.

### Specialized Domain Components
- **Bilingual Explanation Accordion:** Collapsible drawer underneath questions in review mode. Features a light neutral background (`#F8FAFC`), explicit grammar highlight tags, and dual English/Vietnamese vocabulary definitions.
- **Exam Countdown Timer Bar:** Sticky top navigation component containing Part filters, live timer (`mono-timer`), and progress bar filled with `#1E3A8A` and `#F59E0B` threshold indicator.