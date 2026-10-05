# DESIGN SYSTEM SPECIFICATION (DESIGN.md)
**Project:** Audiflow — Intelligent Contract Audit & Regulatory Risk Platform  
**Target Platforms:** iOS 17+ (SwiftUI), Web (React/Tailwind)  
**Standard:** ricoui-design-md Specification  
**Version:** 1.0.0  

---

## 1. BRAND IDENTITY & DESIGN PHILOSOPHY ("EL ALMA")

Audiflow is a mission-critical legal-tech platform that combines regulatory rigor with intelligent, modern AI assistance.

### Core Principles
1. **Unwavering Trust & Rigor (Seriedad y Confianza):** Legal compliance requires deep authority. Colors are dominated by authoritative deep navy and precise semantic alerts. Never frivolous or childish.
2. **Crystal Clarity & High Legibility:** Contracts are text-dense. Typography must provide immediate visual hierarchy, ample line-height, and unmistakable contrast.
3. **Purposeful Semantics (El Semáforo Normativo):** Colors are not decorative; they carry strict regulatory meaning (Green = Safe/Conforme, Yellow = Medium Risk, Orange = Notable Risk, Red = Critical Contingency).
4. **Subtle Tactility & Glass Surfaces:** Subtle micro-interactions, refined corner radii, and gentle layered elevations that feel premium on modern Apple devices.

---

## 2. DESIGN TOKENS: COLOR PALETTE

### Primary Brand Colors
- `brand.primary`: `#0F2744` (Audiflow Deep Navy — represents legal security and authority)
- `brand.secondary`: `#1E3E62` (Slate Navy — secondary container and headers)
- `brand.accent`: `#2563EB` (Action Cobalt Blue — interactive links and primary action states)
- `brand.accentLight`: `#3B82F6` (Electric Blue — focus rings and highlights)

### Surfaces & Backgrounds
- **Light Mode (Canvas):**
  - `surface.background`: `#F8FAFC` (Slate Canvas)
  - `surface.card`: `#FFFFFF` (Pure White Card)
  - `surface.subtle`: `#F1F5F9` (Muted input fills and badges)
  - `surface.overlay`: `rgba(15, 39, 68, 0.40)` (Modal dim)
- **Dark Mode (iOS Adaptive):**
  - `surface.dark.background`: `#0B132B` (Midnight Obsidian)
  - `surface.dark.card`: `#131F3A` (Deep Slate Glass)
  - `surface.dark.subtle`: `#1E293B`

### Text Hierarchy
- `text.primary`: `#0F172A` (Slate 900 — Maximum readability)
- `text.secondary`: `#475569` (Slate 600 — Context, labels, metadata)
- `text.muted`: `#94A3B8` (Slate 400 — Placeholders, inactive state)
- `text.onDark`: `#FFFFFF` (White text on primary brand buttons)

### Semantic Risk Matrix (El Semáforo de Riesgo)
- **VERDE (Bajo Riesgo / Conforme):**
  - Background: `#ECFDF5`
  - Border: `#A7F3D0`
  - Text/Fill: `#059669` (Emerald 600)
- **AMARILLO (Riesgo Medio / Observación):**
  - Background: `#FEFCE8`
  - Border: `#FDE047`
  - Text/Fill: `#D97706` (Amber 600)
- **NARANJA (Riesgo Notable / Ajuste Requerido):**
  - Background: `#FFF7ED`
  - Border: `#FDBA74`
  - Text/Fill: `#EA580C` (Orange 600)
- **ROJO (Riesgo Alto / Contingencia Crítica):**
  - Background: `#FEF2F2`
  - Border: `#FECACA`
  - Text/Fill: `#DC2626` (Red 600)

---

## 3. TYPOGRAPHY SYSTEM (Apple Human Interface Guidelines Alignment)

The typography scale maps directly to Apple's native dynamic type on iOS:

| Token | Size | Weight | Line Height | Usage |
| :--- | :--- | :--- | :--- | :--- |
| `font.display` | 32pt | Bold (700) | 40pt | Dashboard Score, Hero Titles |
| `font.titleLarge` | 24pt | Bold (700) | 30pt | Section Headers, Modal Titles |
| `font.titleMedium`| 20pt | SemiBold (600) | 26pt | Card Titles, Contract Names |
| `font.headline` | 17pt | SemiBold (600) | 22pt | Form labels, Key Metrics |
| `font.body` | 16pt | Regular (400) | 24pt | Legal Clause text, Analysis |
| `font.callout` | 15pt | Medium (500) | 20pt | Key Findings, Bullet points |
| `font.subheadline`| 14pt | Regular (400) | 18pt | Secondary descriptions |
| `font.caption` | 12pt | SemiBold (600) | 16pt | Badges, Timestamps, SLA tags |

---

## 4. SPACING & SPATIAL SYSTEM

Strict 4pt / 8pt rhythmic base grid:

- `spacing.xxs`: `2pt`
- `spacing.xs`: `4pt`
- `spacing.sm`: `8pt`
- `spacing.md`: `12pt`
- `spacing.base`: `16pt` (Standard screen padding)
- `spacing.lg`: `24pt` (Card padding and section gap)
- `spacing.xl`: `32pt`
- `spacing.xxl`: `48pt`

---

## 5. CORNER RADII & SHADOWS

### Corner Radii
- `radius.xs`: `4pt` (Tags, small pills)
- `radius.sm`: `8pt` (Buttons, form fields)
- `radius.md`: `12pt` (Standard cards, alert banners)
- `radius.lg`: `18pt` (Main contract container cards, bottom sheets)
- `radius.full`: `9999pt` (Badges, rounded chips)

### Elevation & Shadows
- `shadow.subtle`: `color: #0000000D, radius: 4pt, x: 0, y: 2` (Standard cards)
- `shadow.medium`: `color: #0F274414, radius: 12pt, x: 0, y: 6` (Floating action bar, modals)
- `shadow.brandGlow`: `color: #2563EB2E, radius: 16pt, x: 0, y: 8` (Primary CTAs)

---

## 6. COMPONENT SPECIFICATIONS (SWIFTUI MAPPING)

### A. Primary Action Button (`PrimaryButtonStyle`)
- Height: `48pt` minimum (Apple touch target guidelines).
- Background: `LinearGradient(colors: [#0F2744, #1E3E62])`.
- Text: White, 16pt SemiBold.
- Corner Radius: `radius.md` (12pt).
- Feedback: Scales to `0.98` with haptic feedback on touch.

### B. Risk Badge Pill (`RiskBadge`)
- Padding: Horizontal 10pt, Vertical 4pt.
- Radius: `radius.full`.
- Icon: Visual indicator dot (`w: 6, h: 6`) + Text in `font.caption`.

### C. Contract Audit Card (`AuditCard`)
- Background: `surface.card` with border `1pt` solid `#E2E8F0`.
- Padding: `spacing.lg` (24pt).
- Corner Radius: `radius.lg` (18pt).
- Shadow: `shadow.subtle`.

---

## 7. AI CODING RULES (FOR XCODE / COPILOT / CURSOR)

When generating or modifying iOS SwiftUI code for Audiflow, any AI MUST adhere to:
1. **Never use hardcoded system colors** like `.foregroundColor(.black)` or `.background(.blue)`. Always use `Color.brandPrimary`, `Color.surfaceBackground`, `Color.textSecondary`, etc.
2. **Never hardcode arbitrary paddings** like `.padding(13)`. Always use `AppSpacing.base`, `AppSpacing.md`, etc.
3. **Always use native SwiftUI `ViewModifier` or `ButtonStyle`** defined in `DesignTokens.swift`.
4. **Support Light and Dark mode** automatically through token resolution.
