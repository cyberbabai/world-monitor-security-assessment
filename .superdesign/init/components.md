# Components — World Monitor Security Assessment

## UI Primitives

### `components/ui/AppleButton.jsx`
Framer Motion button with spring hover/tap. Variants: `primary` (blue fill), `ghost` (frosted border), `destructive` (red tint), `success` (green tint). Sizes: `sm`, `md`, `lg`.
```jsx
<AppleButton variant="primary" size="lg">Sign in</AppleButton>
<AppleButton variant="ghost">Cancel</AppleButton>
<AppleButton variant="destructive">Delete</AppleButton>
```
Key styles: `rounded-[12px]`, `font-semibold`, `whileHover scale:1.02`, `whileTap scale:0.97`.

### `components/ui/AppleInput.jsx`
Frosted input field with label, error state, and password toggle (Eye/EyeOff icon).
```jsx
<AppleInput label="Email" type="email" value={v} onChange={fn} required />
<AppleInput label="Password" type="password" error="Required" />
```
Key styles: `rounded-[12px]`, `bg-white/[0.07]`, `focus:bg-white/[0.10]`, `focus:border-[#0A84FF]/50`.

### `components/ui/GlassCard.jsx`
Reusable wrapper applying `.glass-card` class. Simple passthrough div.

## Dashboard Components

### `components/dashboard/KpiCard.jsx`
Stat card with animated mount. Props: `label`, `value`, `color`, `icon` (Lucide), `index` (stagger delay).
```jsx
<KpiCard label="Critical" value={3} color="#FF453A" icon={AlertTriangle} index={1} />
```
Layout: label + icon row on top, large number (40px IBM Plex Mono) below. Uses `.glass-card p-5`.

### `components/dashboard/SeverityDonut.jsx`
Recharts `ResponsiveContainer` + `PieChart` donut showing critical/high/medium/low counts. Colors from SEVERITY_CONFIG. Props: `counts` object.

## Findings Components

### `components/findings/SeverityBadge.jsx`
Pill badge colored by severity. `text-[11px] px-2 py-0.5 rounded-full`. Color from `getSeverityConfig`.

### `components/findings/CodeBlock.jsx`
Dark monospace block for HTTP request/response PoC. Dark background `rgba(0,0,0,0.4)`, `#30D158` text (terminal green), `rounded-[10px] p-4`.

## Scan Components

### `components/scan/ModuleToggle.jsx`
Glass toggle row per scan module. Checkbox + module name + optional sublabel. Used in NewScan.

## Three.js Scenes

### `components/three/ParticleNetwork.jsx`
Full-screen background on Login. 800 floating points (blue, drift via sin/cos), lines between points within 120px. `@react-three/fiber Canvas`.

### `components/three/ThreatGlobe.jsx`
Dashboard right panel. Wireframe IcosahedronGeometry globe, pulsing dot markers at threat-origin cities, slow auto-rotation. `@react-three/fiber + drei OrbitControls`.

### `components/three/ScanRadar.jsx`
Scan progress page top. Rotating TorusGeometry ring. Sweep arc angle = `(progress/100) * 2π`. Finding markers pop onto ring surface as discovered. `useFrame` animation.

### `components/three/CvssRing3D.jsx`
Finding detail page left column. TorusGeometry ring, arc fills to CVSS score / 10. Glows in severity color. `drei Text` for score number in center. Slow rotation.
