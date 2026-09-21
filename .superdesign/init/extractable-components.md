# Extractable Components — World Monitor Security Assessment

## High-priority for Superdesign DraftComponents

### 1. SeverityBadge
**File:** `components/findings/SeverityBadge.jsx`
**Props:** `severity: 'critical'|'high'|'medium'|'low'|'info'`
**Shape:** Pill with colored background tint + text. `text-[11px] px-2 py-0.5 rounded-full capitalize`.
**Colors:** From SEVERITY_CONFIG — each severity has its own color + bg + border.
**Extract as:** standalone badge component for any severity label display.

### 2. KpiCard
**File:** `components/dashboard/KpiCard.jsx`
**Props:** `label`, `value`, `color`, `icon` (Lucide), `index`
**Shape:** `glass-card p-5`. Label + icon on top row. Large number (40px IBM Plex Mono) below.
**Animation:** `cardVariants` mount animation with `custom={index}` stagger.
**Extract as:** reusable metric card for any dashboard stat.

### 3. AppleButton
**File:** `components/ui/AppleButton.jsx`
**Variants:** primary (blue fill), ghost (frosted border), destructive (red tint), success (green tint)
**Sizes:** sm / md / lg
**Extract as:** primary interactive control across all pages.

### 4. AppleInput
**File:** `components/ui/AppleInput.jsx`
**Features:** label, type (text/email/password), placeholder, error state, password toggle
**Extract as:** form field primitive used in Login and NewScan.

### 5. CodeBlock (HTTP Request/Response)
**File:** `components/findings/CodeBlock.jsx`
**Shape:** Dark mono block `rgba(0,0,0,0.4)` bg, `#30D158` text, `rounded-[10px] p-4`.
**Use:** PoC HTTP request/response display in FindingDetail.
**Extract as:** reusable code/terminal display block.

### 6. FilterPillGroup
**Not a file yet — inline in FindingsList.jsx**
**Shape:** Container with `p-1 rounded-[8px]` frosted bg, inner buttons with active/inactive states.
**Active:** `bg-{color}20 text-{color}` (severity-colored or `bg-white/10 text-white`)
**Inactive:** `text-white/40 transparent`
**Extract as:** reusable segmented filter control.

### 7. ScanModuleRow
**File:** `components/scan/ModuleToggle.jsx`
**Shape:** Glass toggle row — checkbox, module name, optional description, optional file upload trigger.
**Extract as:** settings-style toggle row used in NewScan.

### 8. StatusBadge (variant of SeverityBadge)
**Inline in FindingsList.jsx / RemediationTracker.jsx**
**Statuses:** `open` (gray), `in-progress` (blue), `fixed` (green)
**Shape:** Same pill style as SeverityBadge but with status-specific colors.
**Extract as:** status indicator reusable across findings and tracker views.
