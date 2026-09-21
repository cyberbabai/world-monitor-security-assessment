# Layouts — World Monitor Security Assessment

## Primary App Layout (`components/layout/Layout.jsx`)

```jsx
<div className="flex min-h-screen bg-black">
  <Sidebar />                          {/* w-56, glass-sidebar surface */}
  <main className="flex-1 overflow-auto">
    <AnimatePresence mode="wait">
      <motion.div key={location.pathname} variants={pageVariants}>
        <Outlet />                     {/* page content here */}
      </motion.div>
    </AnimatePresence>
  </main>
</div>
```

Layout is a horizontal flex: fixed-width sidebar (w-56) + scrollable main content area.

## Sidebar (`components/layout/Sidebar.jsx`)

```
aside.glass-sidebar (w-56, min-h-screen, flex-col, py-7)
├── Wordmark block (px-5, mb-8)
│     "WM/SEC"          — 17px bold, IBM Plex Mono, #fff
│     "Assessment Platform" — 11px, Inter, rgba(255,255,255,0.30)
├── nav.flex-1 (px-3, flex-col, gap-0.5)
│     NavLink × 5 (px-3 py-2, rounded-[8px], text-[13px], Inter 500)
│     Active state: bg-[#0A7CFF]/12 text-[#0A7CFF]
│     Inactive: text-white/40 hover:text-white/80 hover:bg-white/[0.04]
│     Icons: Lucide (size 14), Dashboard | Plus | AlertTriangle | FileText | CheckSquare
└── Sign out button (px-3, text-white/25, hover:text-[#FF453A])
```

Nav items:
- Dashboard → `/dashboard`
- New Scan → `/scan/new`
- Findings → `/findings`
- Report → `/report`
- Tracker → `/tracker`

## Login Layout (no sidebar)

Full-screen, flex centered, `background: #070C14`. Three.js ParticleNetwork fills the background. A single `glass-card` centered at `max-w-xs`. No sidebar.

## Page Content Padding

All page components: `p-8 space-y-6` (32px padding, 24px vertical gap between sections).
