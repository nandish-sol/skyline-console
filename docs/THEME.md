# Theme Color System — Current State & Proper Implementation Plan

> **Status (2026-04-10):** Half-implemented. User can pick a color in Profile Settings and it persists to DB, but only ~20% of the UI actually changes. This doc is the roadmap to do it right.

## Current state (what ships today)

### What works
- `/user/settings → Appearance` tab with 8 preset color swatches
- Backend `GET/PATCH /api/v1/profile/me` persists `theme_color` in `user_profiles.theme_color` (VARCHAR(16), hex like `#197560`)
- `src/layouts/Base/index.jsx` calls `applyThemeFromProfile()` on mount; reads `theme_color` from `/profile/me` and sets `--primary-color` CSS variable on `<html>`
- `src/styles/base.less` declares `:root { --primary-color: #197560; }` as the default
- Xloud-authored custom components use `var(--primary-color)`:
  - `ProfileSettings` Save/Discard/Change-Password buttons
  - `UserCenter` Edit Profile button
  - `UserCenter` header-card gradient (green → primary → teal)
  - `UserCenter` `.stat-value` numeric colors
  - `ProfileImageModal` Save button
  - `ProjectInfo` header gradient

### What's broken
**Ant Design components don't respond to the theme picker.** All `.ant-btn-primary`, `.ant-tabs-ink-bar`, `.ant-menu-item-selected`, `.ant-radio-inner`, `.ant-checkbox-inner`, form focus rings, pagination active pages, date picker highlights, etc. are stuck on `#0068FF` (Xloud's configured blue, compiled into the main CSS bundle at build time).

**Why**: Ant Design 4 uses LESS variables that are resolved at webpack compile time via `less-loader` with `modifyVars` fed from `config/theme.js`. The hex values are literally baked into strings inside `main.bundle.<hash>.js` — there's no CSS variable indirection at the Ant Design layer. Changing a CSS var at runtime cannot affect already-compiled CSS that contains the literal `#0068FF` or its derivatives.

### What this means for users
- Pick Purple in the theme picker → the UserCenter avatar ring, custom buttons, and stats turn purple
- But the Save button on Instance Create, the selected sidebar menu item, the active tab underline, form focus rings, instance type radios — all stay blue
- Result: **demo-grade, not enterprise-grade.** Looks broken and cheap.

---

## Architecture Background

### Layer 1: LESS variables (build-time, FROZEN)
- `config/theme.js` → consumed by `less-loader` `modifyVars`
- Current value: `'primary-color': '#0068FF'`
- Flows into `src/styles/variables.less` and `node_modules/antd/lib/style/themes/default.less`
- Webpack compiles all LESS → one CSS bundle per chunk
- Every `.ant-*` rule gets hex literals (primary, hover, active, disabled, shadow, background-tint)
- **Cannot be changed at runtime without rebuild**

### Layer 2: Inline JSX style props (easy to fix, already done for profile page)
- `style={{background: '#197560'}}` in JSX
- Refactored to `style={{background: 'var(--primary-color)'}}`
- Status: **done for all Xloud-authored custom components** in the profile/user center area (commit `257367a`)
- Remaining hex hits: `src/components/Layout/GlobalHeader/RightContent.jsx:104`, `src/pages/watcher/containers/ActionPlans/Detail/BaseDetail.jsx:101,177` (purely cosmetic accents, low priority)

### Layer 3: The `--primary-color` CSS custom property (runtime, working)
- Added in `src/styles/base.less`: `:root { --primary-color: #197560; }`
- Changed at runtime via `document.documentElement.style.setProperty('--primary-color', hex)`
- Applied on every layout mount by `applyThemeFromProfile()` in `src/layouts/Base/index.jsx`
- **Only affects elements that explicitly use `var(--primary-color)`** — not Ant Design

---

## Implementation Options (ranked)

### Option A: `!important` CSS overrides (hack — DO NOT SHIP)

Add blanket overrides in `base.less`:

```less
:global {
  :root { --primary-color: #197560; }
  .ant-btn-primary:not(.ant-btn-dangerous):not(.ant-btn-background-ghost) {
    background-color: var(--primary-color) !important;
    border-color: var(--primary-color) !important;
  }
  .ant-tabs-ink-bar { background: var(--primary-color) !important; }
  .ant-tabs-tab-active .ant-tabs-tab-btn { color: var(--primary-color) !important; }
  .ant-menu-item-selected, .ant-menu-item-active { color: var(--primary-color) !important; }
  .ant-radio-checked .ant-radio-inner { border-color: var(--primary-color) !important; }
  a, .ant-btn-link { color: var(--primary-color); }
}
```

| | |
|---|---|
| Effort | 1 hour |
| Coverage | ~70% of visible UI |
| Hover/focus states | **broken** (stuck blue) |
| Shadows | **broken** (stuck rgba(0,104,255,...)) |
| Disabled/selected backgrounds | **broken** |
| Maintenance | fragile, every Ant patch can break it |
| Verdict | **Demo-grade only. Ship as temporary stopgap if enterprise pressure demands visible theme switching before proper solution is ready.** |

### Option B: Runtime LESS with `less.modifyVars` (complex, unreliable)

Ship the LESS compiler in the browser bundle and recompile on theme change.

```js
import less from 'less';
await less.modifyVars({ '@primary-color': userColor });
```

| | |
|---|---|
| Effort | 1 week (webpack config rewrite) |
| Coverage | ~85% of visible UI |
| Bundle cost | +100 KB (less compiler) |
| Recompile time | ~500 ms per switch (visible flash) |
| Reliability | Ant 4 docs explicitly warn this is unreliable with tree-shaken builds |
| Verdict | **Not recommended.** Too fragile for production. |

### Option C: Preset CSS bundles at build time (RECOMMENDED — ENTERPRISE-GRADE)

Generate **N pre-built CSS bundles** during `yarn run build`, one per preset color. Swap the stylesheet link at runtime.

**Build-time changes:**
- Create `scripts/build-themes.js` that runs LESS compilation N times with different `primary-color` values fed via `modifyVars`
- Output: `skyline_console/static/themes/theme-xloud-green.css`, `theme-blue.css`, `theme-purple.css`, ... (one per preset)
- Each bundle contains ONLY the rules that change with primary color — everything else stays in `main.css`
- Use `mini-css-extract-plugin` with a separate entry point per theme, or post-process `main.css` with a regex-based color swap for the 8 presets

**Runtime changes:**
- Default stylesheet `<link id="xloud-theme" rel="stylesheet" href="/themes/theme-xloud-green.css">` injected in `src/asset/template/index.html`
- On app boot in `src/layouts/Base/index.jsx → applyThemeFromProfile()`, read `theme_color` from `/profile/me` and swap `document.getElementById('xloud-theme').href = '/themes/theme-' + slug(color) + '.css'`
- Browser replaces the CSS atomically — no FOUC if the new bundle is preloaded
- On user theme pick in Appearance tab: same swap, instant visual change

**Constraints:**
- **Preset colors only** — no free hex picker. The 8 swatches are the universe.
- Need a slug lookup: `'#197560' → 'xloud-green'`
- Each preset bundle is ~50-200 KB (only the rules that change, not the whole app CSS)
- Build time increases roughly 2× (N LESS compilations in parallel)

**FOUC prevention:**
- Set a cookie on login redirect with the user's theme slug
- `index.html` template reads the cookie server-side (or via inline script) and emits the right `<link>` before page render
- Fallback: default preset loads instantly, then runtime swap happens ~200 ms later when `/profile/me` responds (brief flash of default theme — acceptable)

**Webpack config sketch:**

```js
// config/webpack.prod.js
const themes = [
  { slug: 'xloud-green', primary: '#197560' },
  { slug: 'blue',        primary: '#1890ff' },
  { slug: 'purple',      primary: '#722ed1' },
  // ... 5 more
];

// Strategy: post-build color substitution on the compiled CSS
const postbuild = () => {
  const mainCss = fs.readFileSync('skyline_console/static/main.<hash>.css', 'utf8');
  themes.forEach(theme => {
    // Replace all #0068ff hits with theme.primary, plus all derived colors
    // (hover: lighten 10%, active: darken 10%, background-ghost: fade 10%)
    const themed = replaceColorFamily(mainCss, '#0068ff', theme.primary);
    fs.writeFileSync(`skyline_console/static/themes/theme-${theme.slug}.css`, themed);
  });
};
```

The `replaceColorFamily` helper computes all derived colors (hover, active, background-tint, shadow-rgba) from the source and target primary using the same formulas Ant Design uses internally (documented in `node_modules/antd/lib/style/themes/default.less`).

| | |
|---|---|
| Effort | **3-5 days** (webpack plumbing, color-family replacement helper, FOUC handling, testing all 8 presets, docs) |
| Coverage | **100% for all 8 presets** |
| Bundle cost | +50-200 KB per preset on disk, but **user downloads only one** |
| Switch time | **instant** (atomic stylesheet swap) |
| Reliability | rock-solid, no runtime compilation |
| Upstream divergence | small (webpack config + post-build script only) |
| Verdict | **Ship this.** Clean, enterprise-grade, aligned with how VMware Aria does theming. |

### Option D: Migrate to Ant Design 5 + ConfigProvider (proper, huge)

Rewrite the Skyline frontend to use Ant Design 5, which has native runtime theming via CSS-in-JS tokens.

```jsx
import { ConfigProvider, theme } from 'antd';

<ConfigProvider theme={{ token: { colorPrimary: userThemeColor } }}>
  <App />
</ConfigProvider>
```

| | |
|---|---|
| Effort | **2-4 weeks full-time** |
| Coverage | **100%**, free hex picker |
| Dark mode | comes free |
| Accessibility tokens | come free |
| Motion/density tokens | come free |
| Breaking changes | ~40 components, Modal API, Message API, DatePicker moment → dayjs, Form API, Table, Form list, icons library, removed components (PageHeader), removed `locale` prop in many places |
| Upstream divergence | **huge** — official Skyline is still on Ant 4. Every future merge becomes painful. |
| Verdict | **Correct long-term answer, but not a 1-session task.** Plan for Xloud 2026.2 or later. |

---

## Recommendation

**Short term (next 1-2 weeks):** Ship **Option C** (preset CSS bundles).

- 3-5 days of engineering
- Enterprise-grade visual result (all Ant components properly themed)
- Leaves the existing `var(--primary-color)` work in place (Xloud custom components still use it, Ant-based components use the swapped bundle)
- User experience: swatch → click Save → instant visual change across entire UI

**Long term (2026.2 or 2027.1):** Plan **Option D** (Ant 5 migration).

- Track the official Skyline upstream — once they migrate to Ant 5, rebase
- Or lead the migration if Xloud's pace demands it sooner
- Enables dark mode, custom token palettes, accessibility tokens
- Unlocks free hex picker (not limited to presets)

**Do NOT ship Option A** (`!important` overrides). It's a trap — looks broken, rots over time, breaks on every Ant patch bump.

---

## Work Items if/when Option C is approved

1. **Color family math helper** (`scripts/lib/color-family.js`)
   - Given source primary and target primary, generate all Ant Design derived colors: hover (`colorPalette(primary, 5)`), active (`colorPalette(primary, 7)`), outline-color (primary with 0.2 alpha), background-tint (primary with 0.06 alpha)
   - Use the same math as Ant Design's `@ant-design/colors` package

2. **Webpack post-build script** (`scripts/build-themes.js`)
   - Read compiled `main.<hash>.css`
   - For each preset in `THEME_PRESETS`, produce a themed copy
   - Write to `skyline_console/static/themes/theme-<slug>.css`
   - Update the Kolla config and nginx to serve `/themes/` directly

3. **Runtime swap** (`src/layouts/Base/index.jsx`)
   - Create `<link id="xloud-theme" rel="stylesheet">` in `src/asset/template/index.html`
   - On `applyThemeFromProfile`, compute slug from `theme_color` hex and swap `href`
   - Preload the most likely next theme (current + default) via `<link rel="preload" as="style">`

4. **FOUC prevention**
   - On successful login (`/api/v1/login` response handler), also set a `xloud_theme_slug` cookie with 30-day expiry
   - Inline script at top of `<head>` in `index.html` template reads the cookie, creates the `<link>` with the right href **before** any CSS is parsed
   - Fallback to default if cookie missing

5. **Appearance tab update** (`src/pages/user-center/containers/ProfileSettings/index.jsx`)
   - After successful PATCH, also swap the `<link>` href immediately (instead of just setting CSS var)
   - Keep the CSS var swap as a fallback for Xloud custom components that still use it

6. **Testing matrix**
   - Each of the 8 presets: verify buttons, tabs, menus, radios, checkboxes, forms, modals, pickers, pagination, steps, progress, sliders, selects
   - Verify hover, focus, active, disabled, selected states
   - Verify instance create wizard, volume actions, keypair form, network topology links
   - Verify on all 4 auth states: logged out, non-admin user, admin user, project-scoped admin
   - Verify FOUC is ≤100 ms on cold load

7. **Documentation**
   - Update this file with final implementation notes
   - Add `docs/source/configuration/theming.rst` for upstream-style docs
   - Update user-facing `/user/settings → Appearance` tab with a small info line explaining which UI regions are themed

---

## Tracking

| Status | Date | Notes |
|---|---|---|
| Partial implementation shipped | 2026-04-10 | `--primary-color` CSS var + `applyThemeFromProfile` in BaseLayout + Xloud custom components refactored to use var. Commit `257367a`. |
| Full Option C planned | TBD | Awaiting scheduling decision. |
| Option D / Ant 5 migration | TBD | Track upstream Skyline. |

---

## Why this doc exists

The current implementation gives users a working theme picker in the settings page and makes Xloud-authored components respond to it. That's what a user-visible feature needs to ship a v1 of Profile Settings. But it falls short of enterprise-grade because Ant Design components — which make up the majority of the UI — stay on the compile-time primary color.

The proper fix is Option C (preset CSS bundles) and it's a planned 3-5 day work item, not an afternoon hack. This doc exists so we don't forget the decision, don't ship the `!important` hack in a moment of pressure, and have a concrete plan ready when it's time to execute.
