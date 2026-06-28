# macOS Window Controls Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current Windows-style custom titlebar controls with left-aligned macOS traffic-light controls while preserving existing window behavior.

**Architecture:** Keep the existing custom Electron titlebar and `data-window-action` event wiring. Split the titlebar into a left traffic-light group for close/minimize/fullscreen and a right utility group for guide/update/DIY. Use CSS-only visual changes and add a source-structure regression test.

**Tech Stack:** Electron renderer HTML/CSS in `public/index.html`, Node built-in test runner in `test/*.test.js`.

---

## File Structure

- Modify: `/Users/ifprice/Mineradio-mac/Mineradio/public/index.html`
  - Move the three `desktop-window-btn` controls before the drag region.
  - Add a `desktop-traffic-lights` group on the left.
  - Add a `desktop-utility-controls` group on the right for `?`, update, and DIY.
  - Restyle `.desktop-window-btn` as compact macOS traffic-light circles.

- Create: `/Users/ifprice/Mineradio-mac/Mineradio/test/macos-window-controls.test.js`
  - Lock the left traffic-light group, right utility group, and existing `data-window-action` values.

- Mirror after verification:
  - `/Users/ifprice/Mineradio-mac/local/public/index.html`
  - `/Users/ifprice/Mineradio-mac/local/test/macos-window-controls.test.js`

---

### Task 1: Add Titlebar Structure Regression Test

**Files:**
- Create: `/Users/ifprice/Mineradio-mac/Mineradio/test/macos-window-controls.test.js`

- [ ] **Step 1: Create the test file**

```js
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'public', 'index.html'), 'utf8');

function titlebarMarkup() {
  const start = indexHtml.indexOf('<div id="desktop-titlebar"');
  assert.notEqual(start, -1, 'Expected desktop titlebar markup');
  const end = indexHtml.indexOf('<div id="fullscreen-diy-zone"', start);
  assert.notEqual(end, -1, 'Expected fullscreen DIY zone after titlebar');
  return indexHtml.slice(start, end);
}

test('desktop titlebar uses left macOS traffic lights and right utility controls', () => {
  const markup = titlebarMarkup();
  assert.match(markup, /desktop-traffic-lights/);
  assert.match(markup, /desktop-utility-controls/);
  assert.ok(markup.indexOf('desktop-traffic-lights') < markup.indexOf('desktop-drag-region'));
  assert.ok(markup.indexOf('desktop-utility-controls') > markup.indexOf('desktop-drag-region'));
});

test('traffic lights preserve existing window action wiring', () => {
  const markup = titlebarMarkup();
  assert.match(markup, /desktop-window-btn close[\s\S]*data-window-action="close"/);
  assert.match(markup, /desktop-window-btn minimize[\s\S]*data-window-action="minimize"/);
  assert.match(markup, /desktop-window-btn maximize[\s\S]*data-window-action="maximize"/);
});

test('traffic lights are styled as macOS circles instead of Windows icon buttons', () => {
  assert.match(indexHtml, /\.desktop-window-btn\{[^}]*border-radius:50%/);
  assert.match(indexHtml, /\.desktop-window-btn\.close\{[^}]*#ff5f57/);
  assert.match(indexHtml, /\.desktop-window-btn\.minimize\{[^}]*#ffbd2e/);
  assert.match(indexHtml, /\.desktop-window-btn\.maximize\{[^}]*#28c840/);
});
```

- [ ] **Step 2: Run it and verify it fails**

Run:

```bash
cd /Users/ifprice/Mineradio-mac/Mineradio
node --test test/macos-window-controls.test.js
```

Expected: fails because `desktop-traffic-lights`, `desktop-utility-controls`, and circle styles do not exist yet.

---

### Task 2: Convert The Custom Titlebar To macOS Traffic Lights

**Files:**
- Modify: `/Users/ifprice/Mineradio-mac/Mineradio/public/index.html`

- [ ] **Step 1: Replace the titlebar control markup**

Replace the `#desktop-titlebar` contents with:

```html
<div id="desktop-titlebar" aria-label="window controls">
  <div class="desktop-traffic-lights" aria-label="macOS window controls">
    <button class="desktop-window-btn close" data-window-action="close" title="关闭" aria-label="关闭"><span aria-hidden="true"></span></button>
    <button class="desktop-window-btn minimize" data-window-action="minimize" title="最小化" aria-label="最小化"><span aria-hidden="true"></span></button>
    <button class="desktop-window-btn maximize" data-window-action="maximize" title="全屏" aria-label="全屏"><span class="icon-maximize" aria-hidden="true"></span><span class="icon-restore" aria-hidden="true" style="display:none"></span></button>
  </div>
  <div class="desktop-drag-region">
    <div class="desktop-app-mark" aria-hidden="true"></div>
    <div class="desktop-app-title" aria-hidden="true"></div>
  </div>
  <div class="desktop-utility-controls">
    <button id="visual-guide-btn" class="icon-btn" type="button" onclick="startVisualGuide({ manual: true })" title="查看使用引导" aria-label="查看使用引导">?</button>
    <button id="update-entry" class="update-entry" type="button" onclick="openUpdatePanel()" title="发现新版本" aria-label="发现新版本">...</button>
    <button id="diy-mode-btn" class="desktop-mode-btn" type="button" onclick="toggleDiyMode()" title="开启 DIY 玩家模式" aria-label="开启 DIY 玩家模式" aria-pressed="false">DIY</button>
  </div>
</div>
```

Keep the existing full SVG content inside `#update-entry`; only move the groups and replace the three window-control SVGs with spans.

- [ ] **Step 2: Restyle the controls**

Update the CSS near the existing titlebar styles:

```css
body.desktop-shell #desktop-titlebar{position:fixed;z-index:500;top:0;left:0;right:0;height:44px;padding:0 14px;display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;background:transparent;backdrop-filter:none;-webkit-backdrop-filter:none;-webkit-app-region:drag;pointer-events:none}
.desktop-traffic-lights,.desktop-utility-controls{display:flex;align-items:center;-webkit-app-region:no-drag;pointer-events:auto}
.desktop-traffic-lights{gap:8px;padding-left:4px}
.desktop-utility-controls{gap:6px;justify-content:flex-end}
.desktop-window-btn{width:13px;height:13px;border:0;border-radius:50%;padding:0;background:#8b8f98;color:rgba(40,20,18,.66);display:flex;align-items:center;justify-content:center;cursor:pointer;transition:filter .16s,transform .16s,box-shadow .16s}
.desktop-window-btn span{display:block;position:relative;width:100%;height:100%;opacity:0;transition:opacity .12s}
.desktop-window-btn.close{background:#ff5f57}
.desktop-window-btn.minimize{background:#ffbd2e}
.desktop-window-btn.maximize{background:#28c840}
.desktop-traffic-lights:hover .desktop-window-btn span{opacity:1}
.desktop-window-btn.close span::before,.desktop-window-btn.close span::after{content:"";position:absolute;left:3px;right:3px;top:6px;height:1.5px;border-radius:2px;background:currentColor}
.desktop-window-btn.close span::before{transform:rotate(45deg)}
.desktop-window-btn.close span::after{transform:rotate(-45deg)}
.desktop-window-btn.minimize span::before{content:"";position:absolute;left:3px;right:3px;top:6px;height:1.5px;border-radius:2px;background:currentColor}
.desktop-window-btn.maximize .icon-maximize::before{content:"";position:absolute;left:3.5px;top:3.5px;width:6px;height:6px;border-radius:1.5px;background:currentColor}
.desktop-window-btn.maximize .icon-restore::before{content:"";position:absolute;left:3.2px;top:3.2px;width:6.5px;height:6.5px;border-radius:1.5px;border:1.5px solid currentColor;box-sizing:border-box}
.desktop-window-btn:hover{filter:brightness(1.06);transform:translateY(-.5px);box-shadow:0 0 0 1px rgba(0,0,0,.18)}
```

- [ ] **Step 3: Keep fullscreen icon updates compatible**

Confirm `updateDesktopWindowState()` still finds `.icon-maximize` and `.icon-restore`. It should continue to toggle `display` between the two spans.

- [ ] **Step 4: Run focused test**

Run:

```bash
cd /Users/ifprice/Mineradio-mac/Mineradio
node --test test/macos-window-controls.test.js
```

Expected: pass.

---

### Task 3: Verify, Sync, And Package

**Files:**
- Modify mirror files under `/Users/ifprice/Mineradio-mac/local/`
- Output: `/Users/ifprice/Mineradio-mac/local/dist/Mineradio-1.1.3-mac-arm64.dmg`

- [ ] **Step 1: Run all tests in `Mineradio`**

```bash
cd /Users/ifprice/Mineradio-mac/Mineradio
node --test test/*.test.js
```

Expected: all tests pass.

- [ ] **Step 2: Sync changed files to `local`**

```bash
rsync -a /Users/ifprice/Mineradio-mac/Mineradio/public/index.html /Users/ifprice/Mineradio-mac/local/public/index.html
rsync -a /Users/ifprice/Mineradio-mac/Mineradio/test/macos-window-controls.test.js /Users/ifprice/Mineradio-mac/local/test/macos-window-controls.test.js
rsync -a /Users/ifprice/Mineradio-mac/Mineradio/docs/superpowers/plans/2026-06-28-macos-window-controls.md /Users/ifprice/Mineradio-mac/local/docs/superpowers/plans/2026-06-28-macos-window-controls.md
rsync -a /Users/ifprice/Mineradio-mac/Mineradio/docs/superpowers/specs/2026-06-28-macos-window-controls-design.md /Users/ifprice/Mineradio-mac/local/docs/superpowers/specs/2026-06-28-macos-window-controls-design.md
```

- [ ] **Step 3: Run all tests in `local`**

```bash
cd /Users/ifprice/Mineradio-mac/local
node --test test/*.test.js
```

Expected: all tests pass.

- [ ] **Step 4: Build arm64 DMG without manual signing**

```bash
cd /Users/ifprice/Mineradio-mac/local
npm run build:mac:arm64
```

Expected: `dist/Mineradio-1.1.3-mac-arm64.dmg` is rebuilt; signing is skipped or remains adhoc.

## Self-Review

- Spec coverage: left traffic lights, right utility controls, existing behavior, no native Electron controls, verification, and packaging are covered.
- Placeholder scan: no TBD/TODO placeholders.
- Type consistency: class names are consistent across test, markup, and CSS.
