# Theme — World Monitor Security Assessment

## Design Language
Apple Human Interface Guidelines meets intelligence/security ops. Deep navy-black surfaces, IBM Plex Mono as the distinctive display typeface, Inter for body copy, glassmorphism for focal surfaces only. Motion via Framer Motion spring physics.

## Color Tokens (from index.css @theme)

| Token | Value | Role |
|---|---|---|
| `--color-bg-base` | `#070C14` | Full page background (deep navy-black) |
| `--color-bg-raised` | `#0D1420` | Sidebar surface (solid, not glass) |
| `--color-bg-elevated` | `#141C2B` | Hover/elevated states |
| `--color-accent` | `#0A7CFF` | Buttons, active nav, links |
| `--color-accent-dim` | `rgba(10,124,255,0.15)` | Accent tint backgrounds |
| `--color-sev-critical` | `#FF453A` | CVSS critical ≥ 9.0 |
| `--color-sev-high` | `#FF9F0A` | CVSS high 7.0–8.9 |
| `--color-sev-medium` | `#FFD60A` | CVSS medium 4.0–6.9 |
| `--color-sev-low` | `#30D158` | CVSS low 0.1–3.9 |
| `--color-sev-info` | `#636366` | Informational |

## Typography

| Family | Role | Font Stack |
|---|---|---|
| IBM Plex Mono | Display, h1/h2/h3, KPI numbers, CVSS scores, nav wordmark | `"IBM Plex Mono", ui-monospace, monospace` |
| Inter | Body, labels, captions, table cells, nav labels | `"Inter", system-ui, sans-serif` |

- Body default: 15px / 1.5, color `#FFFFFF`
- Page titles: 28px, bold, IBM Plex Mono, `letter-spacing: -0.02em`
- Section headers: 13px, semibold, IBM Plex Mono, `rgba(255,255,255,0.70)`
- Captions / metadata: 12–13px, Inter, `rgba(255,255,255,0.35–0.40)`
- KPI numbers: 40px, bold, IBM Plex Mono, severity color
- CVSS scores: 14px, bold, IBM Plex Mono, severity color

## Glass Card Pattern

```css
.glass-card {
  background: rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(16px) saturate(160%);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
}
.glass-card-sm {
  /* same but border-radius: 10px */
}
```
Used sparingly — only for elevated focal surfaces (KPI cards, chart panels, login form).

## Sidebar Surface

```css
.glass-sidebar {
  background: #0D1420;
  border-right: 1px solid rgba(255,255,255,0.06);
}
```
Solid, not glass. w-56, full height.

## Data Row Pattern (tables)

```css
.data-row {
  border-bottom: 1px solid rgba(255,255,255,0.05);
  transition: background 120ms ease;
}
.data-row:hover { background: rgba(255,255,255,0.03); }
```
No card treatment on table rows — just subtle dividers.

## Animation System

```js
// Spring config — Apple HIG physics
export const spring = { type: 'spring', stiffness: 400, damping: 30 }
export const springGentle = { type: 'spring', stiffness: 200, damping: 25 }

// Page transitions
export const pageVariants = {
  initial: { opacity: 0, y: 20, filter: 'blur(8px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { ...spring, duration: 0.3 } },
  exit:    { opacity: 0, y: -10, filter: 'blur(4px)', transition: { duration: 0.15 } },
}

// Card mount (staggered by index)
export const cardVariants = {
  initial: { opacity: 0, scale: 0.96, y: 10 },
  animate: (i = 0) => ({ opacity: 1, scale: 1, y: 0, transition: { ...spring, delay: i * 0.05 } }),
}
```
Reduce-motion: all animations disabled via `@media (prefers-reduced-motion: reduce)`.

## Severity Config

```js
critical: { label: 'Critical', color: '#FF453A', bg: 'rgba(255,69,58,0.15)' }
high:     { label: 'High',     color: '#FF9F0A', bg: 'rgba(255,159,10,0.15)' }
medium:   { label: 'Medium',   color: '#FFD60A', bg: 'rgba(255,214,10,0.15)' }
low:      { label: 'Low',      color: '#30D158', bg: 'rgba(48,209,88,0.15)'  }
info:     { label: 'Info',     color: '#636366', bg: 'rgba(99,99,102,0.15)' }
```

## Three.js Scenes

| Scene | Component | Location | Purpose |
|---|---|---|---|
| ParticleNetwork | `three/ParticleNetwork.jsx` | Login background | 800 pts, blue neural connections |
| ThreatGlobe | `three/ThreatGlobe.jsx` | Dashboard right panel | Rotating wireframe globe, threat markers |
| ScanRadar | `three/ScanRadar.jsx` | Scan progress page | Torus ring, sweep arc = scan % |
| CvssRing3D | `three/CvssRing3D.jsx` | Finding detail page | Torus ring, arc = CVSS score / 10 |
